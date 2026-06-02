import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(128),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'CASHIER']).default('CASHIER')
}).strict();

export const updateUserSchema = z.object({
  email: z.string().email().optional(),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'CASHIER']).optional(),
  isActive: z.boolean().optional()
}).strict();

export const setPinSchema = z.object({ pin: z.string().min(4).max(6) }).strict();
export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'CASHIER']).optional(),
  isActive: z.coerce.boolean().optional()
});
export const userParamsSchema = z.object({ id: z.string().uuid() });

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type SetPinInput = z.infer<typeof setPinSchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
