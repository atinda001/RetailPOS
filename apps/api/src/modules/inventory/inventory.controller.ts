import type { NextFunction, Request, Response } from 'express';

import * as inventoryService from './inventory.service.js';
import type { ListInventoryQuery, LowStockQuery, StockAdjustmentInput } from './inventory.schemas.js';

/**
 * Lists stock levels for a store.
 * @param req Express request with validated query.
 * @param res Express response.
 * @param next Express next function.
 * @returns Void.
 */
export const list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await inventoryService.listInventory(req.tenantId!, req.validatedQuery as ListInventoryQuery);
    res.status(200).json({
      success: true,
      data: result.items,
      meta: { page: result.page, total: result.total, limit: result.limit }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Lists low-stock items for a store.
 * @param req Express request with validated query.
 * @param res Express response.
 * @param next Express next function.
 * @returns Void.
 */
export const lowStock = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const items = await inventoryService.getLowStock(req.tenantId!, req.validatedQuery as LowStockQuery);
    res.status(200).json({ success: true, data: items });
  } catch (error) {
    next(error);
  }
};

/**
 * Adjusts stock for a product.
 * @param req Express request with validated params and body.
 * @param res Express response.
 * @param next Express next function.
 * @returns Void.
 */
export const adjust = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const updated = await inventoryService.adjustStock(
      req.tenantId!,
      req.validatedBody as StockAdjustmentInput,
      req.user!.id
    );
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * Lists stock movements for a stock item.
 * @param req Express request with validated params and query.
 * @param res Express response.
 * @param next Express next function.
 * @returns Void.
 */
export const movements = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { stockItemId } = req.validatedParams as { stockItemId: string };
    const { page, limit } = req.validatedQuery as { page: number; limit: number };
    const result = await inventoryService.getMovements(req.tenantId!, stockItemId, page, limit);
    res.status(200).json({
      success: true,
      data: result.movements,
      meta: { page: result.page, total: result.total, limit: result.limit }
    });
  } catch (error) {
    next(error);
  }
};
