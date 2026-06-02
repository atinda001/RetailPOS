import type { Prisma, StockItem, StockMovement } from '@prisma/client';

import { prisma } from '../../lib/prisma.js';
import type { ListInventoryQuery, StockAdjustmentInput } from './inventory.schemas.js';

/**
 * Lists stock items for a store with pagination and filtering.
 * @param tenantId Tenant identifier.
 * @param query Validated list query.
 * @returns Tuple of [stockItems, totalCount].
 */
export const listByStore = async (tenantId: string, query: ListInventoryQuery): Promise<[StockItem[], number]> => {
  const where: Prisma.StockItemWhereInput = {
    tenantId,
    storeId: query.storeId
  };

  if (query.search) {
    where.product = { name: { contains: query.search, mode: 'insensitive' } };
  }

  if (query.categoryId) {
    where.product = { ...where.product as object, categoryId: query.categoryId };
  }

  const [items, total] = await Promise.all([
    prisma.stockItem.findMany({
      where,
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      include: { product: { include: { category: true } } }
    }),
    prisma.stockItem.count({ where })
  ]);

  return [items, total];
};

/**
 * Finds stock items below their reorder point for a store.
 * @param tenantId Tenant identifier.
 * @param storeId Store identifier.
 * @returns Array of low-stock items.
 */
export const findLowStock = async (tenantId: string, storeId: string): Promise<StockItem[]> => {
  // Use raw SQL to compare quantityOnHand <= reorderPoint (two columns, can't do in Prisma ORM)
  return prisma.$queryRaw<StockItem[]>`
    SELECT si.*, p.name AS "productName", p.barcode, p.sku, p."priceAmount", p."costAmount"
    FROM "StockItem" si
    JOIN "Product" p ON p.id = si."productId"
    WHERE si."tenantId" = ${tenantId}
      AND si."storeId" = ${storeId}
      AND si."quantityOnHand" <= si."reorderPoint"
    ORDER BY (si."quantityOnHand" - si."reorderPoint") ASC
  `;
};

/**
 * Finds a single stock item by ID scoped to a tenant.
 * @param tenantId Tenant identifier.
 * @param stockItemId Stock item identifier.
 * @returns StockItem or null.
 */
export const findById = async (tenantId: string, stockItemId: string): Promise<StockItem | null> => {
  return prisma.stockItem.findFirst({
    where: { id: stockItemId, tenantId },
    include: { product: true, store: true }
  });
};

/**
 * Finds or creates a stock item for a product in a store.
 * @param tenantId Tenant identifier.
 * @param storeId Store identifier.
 * @param productId Product identifier.
 * @returns StockItem.
 */
export const findOrCreate = async (tenantId: string, storeId: string, productId: string): Promise<StockItem> => {
  const existing = await prisma.stockItem.findUnique({
    where: { storeId_productId: { storeId, productId } }
  });

  if (existing) return existing;

  return prisma.stockItem.create({
    data: { tenantId, storeId, productId, quantityOnHand: 0 }
  });
};

/**
 * Adjusts stock quantity and creates a movement record in a transaction.
 * @param tenantId Tenant identifier.
 * @param stockItemId Stock item identifier.
 * @param input Validated adjustment input.
 * @param userId User performing the adjustment.
 * @returns Updated StockItem.
 */
export const adjustStock = async (
  tenantId: string,
  stockItemId: string,
  input: StockAdjustmentInput,
  userId: string
): Promise<StockItem> => {
  return prisma.$transaction(async (tx) => {
    const updated = await tx.stockItem.update({
      where: { id: stockItemId, tenantId },
      data: { quantityOnHand: { increment: input.quantityDelta } }
    });

    await tx.stockMovement.create({
      data: {
        tenantId,
        stockItemId,
        type: input.type,
        quantityDelta: input.quantityDelta,
        reason: input.reason ?? null,
        createdBy: userId
      }
    });

    return updated;
  });
};

/**
 * Lists stock movements for a stock item with pagination.
 * @param tenantId Tenant identifier.
 * @param stockItemId Stock item identifier.
 * @param page Page number.
 * @param limit Items per page.
 * @returns Tuple of [movements, totalCount].
 */
export const listMovements = async (
  tenantId: string,
  stockItemId: string,
  page: number,
  limit: number
): Promise<[StockMovement[], number]> => {
  const where: Prisma.StockMovementWhereInput = { tenantId, stockItemId };

  const [movements, total] = await Promise.all([
    prisma.stockMovement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.stockMovement.count({ where })
  ]);

  return [movements, total];
};
