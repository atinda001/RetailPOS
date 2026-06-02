import { z } from 'zod';

export const purchaseLineItemSchema = z.object({ productId: z.string().uuid(), quantity: z.number().int().min(1), unitCostAmount: z.number().int().min(0) });
export const createPurchaseSchema = z.object({ storeId: z.string().uuid(), supplierId: z.string().uuid().nullable().optional(), lineItems: z.array(purchaseLineItemSchema).min(1), notes: z.string().max(1000).optional() }).strict();
export const receivePurchaseSchema = z.object({}).strict();
export const listPurchasesQuerySchema = z.object({ page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(100).default(20), storeId: z.string().uuid().optional(), status: z.enum(['DRAFT', 'ORDERED', 'RECEIVED', 'CANCELLED']).optional() });
export const purchaseParamsSchema = z.object({ id: z.string().uuid() });

export type CreatePurchaseInput = z.infer<typeof createPurchaseSchema>;
export type ListPurchasesQuery = z.infer<typeof listPurchasesQuerySchema>;
