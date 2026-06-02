import type { NextFunction, Request, Response } from 'express';
import * as usersService from './users.service.js';
import type { CreateUserInput, ListUsersQuery, SetPinInput, UpdateUserInput } from './users.schemas.js';

export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try { res.status(201).json({ success: true, data: await usersService.createUser(req.tenantId!, req.validatedBody as CreateUserInput) }); } catch (error) { next(error); }
};
export const list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try { const r = await usersService.listUsers(req.tenantId!, req.validatedQuery as ListUsersQuery); res.status(200).json({ success: true, data: r.users, meta: { page: r.page, total: r.total, limit: r.limit } }); } catch (error) { next(error); }
};
export const getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try { res.status(200).json({ success: true, data: await usersService.getUserById(req.tenantId!, (req.validatedParams as { id: string }).id) }); } catch (error) { next(error); }
};
export const update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try { res.status(200).json({ success: true, data: await usersService.updateUser(req.tenantId!, (req.validatedParams as { id: string }).id, req.validatedBody as UpdateUserInput) }); } catch (error) { next(error); }
};
export const remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try { await usersService.deleteUser(req.tenantId!, (req.validatedParams as { id: string }).id); res.status(204).send(); } catch (error) { next(error); }
};
export const setPin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try { res.status(200).json({ success: true, data: await usersService.setUserPin(req.tenantId!, (req.validatedParams as { id: string }).id, req.validatedBody as SetPinInput) }); } catch (error) { next(error); }
};
