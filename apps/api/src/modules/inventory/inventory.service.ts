import type { StockItem, StockMovement } from '@prisma/client';

import { redis } from '../../lib/redis.js';
import { AppError, ErrorCode, NotFoundError } from '../../types/errors.js';
import type { ListInventoryQuery, LowStockQuery, StockAdjustmentInput } from './inventory.schemas.js';
import * as inventoryRepository from './inventory.repository.js';

const LOW_STOCK_DEBOUNCE_PREFIX = 'low-stock-debounce';

/**
 * Lists stock levels for a store with pagination.
 * @param tenantId Tenant identifier.
 * @param query Validated list query.
 * @returns Stock items, total, page, limit.
 */
export const listInventory = async (tenantId: string, query: ListInventoryQuery): Promise<{
  items: StockItem[];
  total: number;
  page: number;
  limit: number;
}> => {
  const [items, total] = await inventoryRepository.listByStore(tenantId, query);
  return { items, total, page: query.page, limit: query.limit };
};

/**
 * Retrieves stock items below their reorder point.
 * @param tenantId Tenant identifier.
 * @param query Validated low-stock query.
 * @returns Array of low-stock items.
 */
export const getLowStock = async (tenantId: string, query: LowStockQuery): Promise<StockItem[]> => {
  return inventoryRepository.findLowStock(tenantId, query.storeId);
};

/**
 * Adjusts stock for a product in a store, creating a movement record.
 * @param tenantId Tenant identifier.
 * @param input Validated adjustment input.
 * @param userId User performing the adjustment.
 * @returns Updated stock item.
 * @throws NotFoundError if stock item does not exist.
 */
export const adjustStock = async (tenantId: string, input: StockAdjustmentInput, userId: string): Promise<StockItem> => {
  const stockItem = await inventoryRepository.findOrCreate(tenantId, input.storeId, input.productId);

  const updated = await inventoryRepository.adjustStock(tenantId, stockItem.id, input, userId);

  await checkAndQueueLowStock(tenantId, input.storeId, input.productId, updated.quantityOnHand, updated.reorderPoint);

  return updated;
};

/**
 * Lists stock movements for a stock item.
 * @param tenantId Tenant identifier.
 * @param stockItemId Stock item identifier.
 * @param page Page number.
 * @param limit Items per page.
 * @returns Movements, total, page, limit.
 * @throws NotFoundError if stock item does not exist.
 */
export const getMovements = async (tenantId: string, stockItemId: string, page: number, limit: number): Promise<{
  movements: StockMovement[];
  total: number;
  page: number;
  limit: number;
}> => {
  const stockItem = await inventoryRepository.findById(tenantId, stockItemId);
  if (!stockItem) {
    throw new NotFoundError(ErrorCode.STOCK_ITEM_NOT_FOUND, 'Stock item not found');
  }

  const [movements, total] = await inventoryRepository.listMovements(tenantId, stockItemId, page, limit);
  return { movements, total, page, limit };
};

/**
 * Checks if stock is low and queues a notification if not recently notified.
 * @param tenantId Tenant identifier.
 * @param storeId Store identifier.
 * @param productId Product identifier.
 * @param quantityOnHand Current quantity.
 * @param reorderPoint Reorder threshold.
 * @returns Void.
 */
const checkAndQueueLowStock = async (
  tenantId: string,
  storeId: string,
  productId: string,
  quantityOnHand: number,
  reorderPoint: number
): Promise<void> => {
  if (quantityOnHand > reorderPoint) return;

  const debounceKey = `${LOW_STOCK_DEBOUNCE_PREFIX}:${tenantId}:${storeId}:${productId}`;
  const recentlyNotified = await redis.get(debounceKey);

  if (recentlyNotified) return;

  await redis.set(debounceKey, '1', 'EX', 86400);
  await redis.lpush(`low-stock:${tenantId}:${storeId}`, productId);
};
