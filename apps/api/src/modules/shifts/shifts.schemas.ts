import { z } from 'zod';

export const openShiftSchema = z.object({
  terminalId: z.string().uuid(),
  openingFloat: z.number().int().min(0)
}).strict();

export const closeShiftSchema = z.object({
  closingFloat: z.number().int().min(0),
  notes: z.string().max(1000).optional()
}).strict();

export const listShiftsQuerySchema = z.object({
  storeId: z.string().uuid(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['OPEN', 'CLOSED']).optional()
});

export const shiftParamsSchema = z.object({ id: z.string().uuid() });

export type OpenShiftInput = z.infer<typeof openShiftSchema>;
export type CloseShiftInput = z.infer<typeof closeShiftSchema>;
export type ListShiftsQuery = z.infer<typeof listShiftsQuerySchema>;
