import type { Role } from '@prisma/client';

declare global {
  namespace Express {
    interface AuthenticatedUser {
      id: string;
      tenantId: string;
      storeId: string;
      role: Role;
    }

    interface Request {
      user?: AuthenticatedUser;
      tenantId?: string;
      validatedBody?: unknown;
      validatedQuery?: unknown;
      validatedParams?: unknown;
    }
  }
}

export {};
