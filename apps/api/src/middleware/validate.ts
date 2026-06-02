import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';

import { ValidationError } from '../types/errors.js';

type RequestSchemas = Readonly<{
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
}>;

/**
 * Validates request body, query, and params with Zod before controller execution.
 * @param schemas Zod schemas for request segments.
 * @returns Express middleware that stores validated request data.
 */
export const validate = (schemas: RequestSchemas) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const bodyResult = schemas.body?.safeParse(req.body);
    if (bodyResult && !bodyResult.success) {
      next(new ValidationError(bodyResult.error.issues));
      return;
    }

    const queryResult = schemas.query?.safeParse(req.query);
    if (queryResult && !queryResult.success) {
      next(new ValidationError(queryResult.error.issues));
      return;
    }

    const paramsResult = schemas.params?.safeParse(req.params);
    if (paramsResult && !paramsResult.success) {
      next(new ValidationError(paramsResult.error.issues));
      return;
    }

    req.validatedBody = bodyResult?.data;
    req.validatedQuery = queryResult?.data;
    req.validatedParams = paramsResult?.data;
    next();
  };
};
