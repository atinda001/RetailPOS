import type { NextFunction, Request, Response } from 'express';

import { HttpStatus } from '../constants/api.js';
import { logger } from '../lib/logger.js';
import { AppError, ErrorCode } from '../types/errors.js';

/**
 * Handles all thrown errors and formats the API error envelope.
 * @param error Thrown error value.
 * @param req Express request.
 * @param res Express response.
 * @param _next Express next function.
 * @returns Void.
 */
export const errorHandler = (error: unknown, req: Request, res: Response, _next: NextFunction): void => {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details
      }
    });
    return;
  }

  logger.error({ error, path: req.path }, 'Unhandled API error');
  res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
    success: false,
    error: {
      code: ErrorCode.INTERNAL_ERROR,
      message: 'Internal server error',
      details: []
    }
  });
};
