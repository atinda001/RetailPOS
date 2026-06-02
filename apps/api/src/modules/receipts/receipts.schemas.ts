import { z } from 'zod';

export const GenerateReceiptParams = z.object({
  id: z.string().uuid(),
});
