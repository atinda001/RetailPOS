import { z } from 'zod';

export const createStoreSchema = z.object({
  name: z.string().min(2).max(100),
  address: z.string().max(300).optional(),
  phone: z.string().max(20).optional(),
  currency: z.string().length(3).default('KES'),
  timezone: z.string().default('Africa/Nairobi'),
  receiptFooter: z.string().max(200).optional(),
  kraPin: z.string().max(20).optional(),
  vatRegNumber: z.string().max(20).optional(),
  vatModel: z.enum(['INCLUSIVE', 'EXCLUSIVE']).default('INCLUSIVE'),
}).strict();

export const updateStoreSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  address: z.string().max(300).optional(),
  phone: z.string().max(20).optional(),
  currency: z.string().length(3).optional(),
  timezone: z.string().optional(),
  receiptFooter: z.string().max(200).optional(),
  kraPin: z.string().max(20).optional(),
  vatRegNumber: z.string().max(20).optional(),
  vatModel: z.enum(['INCLUSIVE', 'EXCLUSIVE']).optional(),
}).strict();

export const storeParamsSchema = z.object({
  id: z.string().uuid(),
});

export type CreateStoreInput = z.infer<typeof createStoreSchema>;
export type UpdateStoreInput = z.infer<typeof updateStoreSchema>;
