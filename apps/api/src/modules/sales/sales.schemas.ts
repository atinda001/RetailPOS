import { z } from 'zod';

export const saleLineItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1),
  unitPriceAmount: z.number().int().min(0),
  discountAmount: z.number().int().min(0).default(0)
});

export const paymentSchema = z.object({
  method: z.enum(['CASH', 'CARD', 'MPESA', 'VOUCHER', 'SPLIT']),
  amount: z.number().int().min(0),
  reference: z.string().max(100).optional()
});

export const createSaleSchema = z.object({
  terminalId: z.string().uuid(),
  shiftId: z.string().uuid(),
  customerId: z.string().uuid().nullable().optional(),
  offlineId: z.string().uuid().nullable().optional(),
  lineItems: z.array(saleLineItemSchema).min(1),
  payments: z.array(paymentSchema).min(1),
  discountAmount: z.number().int().min(0).default(0),
  notes: z.string().max(1000).optional()
}).strict();

export const offlineSyncSchema = z.object({
  sales: z.array(createSaleSchema).min(1).max(100)
}).strict();

export const voidSaleSchema = z.object({
  voidReason: z.string().min(1).max(500)
}).strict();

export const listSalesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  from: z.string().optional(),
  to: z.string().optional(),
  cashierId: z.string().uuid().optional(),
  status: z.enum(['COMPLETED', 'VOIDED', 'REFUNDED']).optional(),
  storeId: z.string().uuid().optional()
});

export const saleParamsSchema = z.object({ id: z.string().uuid() });

export type CreateSaleInput = z.infer<typeof createSaleSchema>;
export type OfflineSyncInput = z.infer<typeof offlineSyncSchema>;
export type VoidSaleInput = z.infer<typeof voidSaleSchema>;
export type ListSalesQuery = z.infer<typeof listSalesQuerySchema>;
