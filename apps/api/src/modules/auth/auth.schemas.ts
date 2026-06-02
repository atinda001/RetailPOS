import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(128)
}).strict();

export const pinLoginSchema = z.object({
  terminalId: z.string().uuid(),
  pin: z.string().min(4).max(6)
}).strict();

export const refreshSchema = z.object({
  refreshToken: z.string().min(1)
}).strict();

export type LoginInput = z.infer<typeof loginSchema>;
export type PinLoginInput = z.infer<typeof pinLoginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
