import type { NextFunction, Request, Response } from 'express';

import { config } from '../config/index.js';
import { redis } from '../lib/redis.js';
import { AppError, ErrorCode } from '../types/errors.js';

/**
 * Creates a Redis-backed rate limiter middleware.
 * @param maxRequests Maximum number of requests allowed in the window.
 * @param windowSeconds Duration of the rate limit window in seconds.
 * @param keyPrefix Redis key prefix for the counter.
 * @returns Express rate limiting middleware.
 */
export const rateLimiter = (maxRequests: number, windowSeconds: number, keyPrefix: string) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const identifier = req.user?.id ?? req.ip ?? 'unknown';
      const key = `${keyPrefix}:${identifier}`;
      const current = await redis.incr(key);

      if (current === 1) {
        await redis.expire(key, windowSeconds);
      }

      if (current > maxRequests) {
        next(new AppError(ErrorCode.SERVICE_UNAVAILABLE, 'Too many requests', 429));
        return;
      }

      next();
    } catch {
      // In development, allow requests when Redis is unavailable
      if (config.nodeEnv === 'development') {
        next();
        return;
      }
      // In production, fail closed for security
      next(new AppError(ErrorCode.SERVICE_UNAVAILABLE, 'Rate limiting unavailable', 503));
    }
  };
};
