import { z } from 'zod';

export const createProductSchema = z.object({
  categoryId: z.string().uuid().nullable().optional(),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).nullable().optional(),
  sku: z.string().max(50).nullable().optional(),
  barcode: z.string().max(50).nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  priceAmount: z.number().int().min(0),
  costAmount: z.number().int().min(0).default(0),
  taxRateId: z.string().uuid().nullable().optional(),
  isActive: z.boolean().default(true),
  trackStock: z.boolean().default(true),
  allowNegativeStock: z.boolean().default(false)
}).strict();

export const updateProductSchema = z.object({
  categoryId: z.string().uuid().nullable().optional(),
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  sku: z.string().max(50).nullable().optional(),
  barcode: z.string().max(50).nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  priceAmount: z.number().int().min(0).optional(),
  costAmount: z.number().int().min(0).optional(),
  taxRateId: z.string().uuid().nullable().optional(),
  isActive: z.boolean().optional(),
  trackStock: z.boolean().optional(),
  allowNegativeStock: z.boolean().optional()
}).strict();

export const listProductsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  isActive: z.coerce.boolean().optional(),
  sortBy: z.enum(['name', 'priceAmount', 'createdAt', 'updatedAt']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc')
});

export const productParamsSchema = z.object({
  id: z.string().uuid()
});

export const barcodeParamsSchema = z.object({
  barcode: z.string().min(1)
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;
