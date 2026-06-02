import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import { config } from '../config/index.js';
import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';
import { UnauthorizedError } from '../types/errors.js';

interface JwtPayload {
  sub: string;
  tenantId: string;
  storeId: string;
  role: string;
  jti: string;
}

/**
 * Verifies the JWT from the Authorization header and injects req.user and req.tenantId.
 * @param req Express request.
 * @param _res Express response.
 * @param next Express next function.
 * @returns Void.
 */
export const auth = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    next(new UnauthorizedError());
    return;
  }

  const token = header.slice(7);

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;

    let storeId = decoded.storeId;

    if (!storeId) {
      // Fallback: resolve from DB. First check if user has a designated store,
      // otherwise use the tenant's primary (first-created) store.
      logger.warn({ userId: decoded.sub, tenantId: decoded.tenantId }, 'storeId missing from token, resolving from DB');
      const user = await prisma.user.findUnique({ where: { id: decoded.sub }, select: { storeId: true } });
      if (user?.storeId) {
        storeId = user.storeId;
      } else {
        const store = await prisma.store.findFirst({
          where: { tenantId: decoded.tenantId, isActive: true },
          orderBy: { createdAt: 'asc' }
        });
        storeId = store?.id ?? '';
      }
    }

    req.user = {
      id: decoded.sub,
      tenantId: decoded.tenantId,
      storeId,
      role: decoded.role as import('@prisma/client').Role
    };
    req.tenantId = decoded.tenantId;
    next();
  } catch {
    next(new UnauthorizedError());
  }
};
