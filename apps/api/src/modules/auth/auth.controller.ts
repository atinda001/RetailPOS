import type { NextFunction, Request, Response } from 'express';

import * as authService from './auth.service.js';
import type { LoginInput, PinLoginInput, RefreshInput } from './auth.schemas.js';

/**
 * Handles email + password login.
 * @param req Express request with validated body.
 * @param res Express response.
 * @param next Express next function.
 * @returns Void.
 */
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await authService.login(req.validatedBody as LoginInput);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles PIN-based cashier login at a terminal.
 * @param req Express request with validated body.
 * @param res Express response.
 * @param next Express next function.
 * @returns Void.
 */
export const pinLogin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await authService.pinLogin(req.validatedBody as PinLoginInput);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * Issues a new access token from a refresh token.
 * @param req Express request with validated body.
 * @param res Express response.
 * @param next Express next function.
 * @returns Void.
 */
export const refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tokens = await authService.refresh(req.validatedBody as RefreshInput);
    res.status(200).json({ success: true, data: tokens });
  } catch (error) {
    next(error);
  }
};

/**
 * Revokes a refresh token (logout).
 * @param req Express request with validated body.
 * @param res Express response.
 * @param next Express next function.
 * @returns Void.
 */
export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await authService.logout(req.validatedBody as RefreshInput);
    res.status(200).json({ success: true, data: { message: 'Logged out' } });
  } catch (error) {
    next(error);
  }
};
