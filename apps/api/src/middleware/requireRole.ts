import type { Role } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';

import { ForbiddenError, UnauthorizedError } from '../types/errors.js';

/**
 * Requires an authenticated user with one of the allowed roles.
 * @param allowedRoles Roles permitted to access the route.
 * @returns Express authorization middleware.
 */
export const requireRole = (...allowedRoles: readonly Role[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError());
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(new ForbiddenError());
      return;
    }

    next();
  };
};
