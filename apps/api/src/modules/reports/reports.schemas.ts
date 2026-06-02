import { z } from 'zod';

export const dateRangeQuerySchema = z.object({
  storeId: z.string().uuid().optional(),
  from: z.string().optional(),
  to: z.string().optional()
});

export const salesSummaryQuerySchema = dateRangeQuerySchema;
export const productPerformanceQuerySchema = dateRangeQuerySchema.extend({ limit: z.coerce.number().int().min(1).max(50).default(10) });
export const cashierPerformanceQuerySchema = dateRangeQuerySchema;
export const stockValuationQuerySchema = z.object({ storeId: z.string().uuid() });
export const endOfDayQuerySchema = z.object({ storeId: z.string().uuid(), date: z.string().optional() });
export const taxSummaryQuerySchema = z.object({ from: z.string().optional(), to: z.string().optional() });

export type DateRangeQuery = z.infer<typeof dateRangeQuerySchema>;
export type SalesSummaryQuery = z.infer<typeof salesSummaryQuerySchema>;
export type EndOfDayQuery = z.infer<typeof endOfDayQuerySchema>;
export type ProductPerformanceQuery = z.infer<typeof productPerformanceQuerySchema>;
export type CashierPerformanceQuery = z.infer<typeof cashierPerformanceQuerySchema>;
