import { z } from 'zod';

export const listInventoryQuerySchema = z.object({
  storeId: z.string().uuid(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  categoryId: z.string().uuid().optional()
});

export const lowStockQuerySchema = z.object({
  storeId: z.string().uuid()
});

export const stockAdjustmentSchema = z.object({
  storeId: z.string().uuid(),
  productId: z.string().uuid(),
  quantityDelta: z.number().int(),
  type: z.enum(['ADJUSTMENT_IN', 'ADJUSTMENT_OUT', 'WASTE', 'OPENING_STOCK']),
  reason: z.string().max(500).optional()
}).strict();

export const stockItemParamsSchema = z.object({
  stockItemId: z.string().uuid()
});

export const movementsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

export type ListInventoryQuery = z.infer<typeof listInventoryQuerySchema>;
export type LowStockQuery = z.infer<typeof lowStockQuerySchema>;
export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>;
