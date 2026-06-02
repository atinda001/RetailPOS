import type { NextFunction, Request, Response } from 'express';
import * as s from './customers.service.js';
import type { CreateCustomerInput, ListCustomersQuery, UpdateCustomerInput } from './customers.schemas.js';

export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try { res.status(201).json({ success: true, data: await s.createCustomer(req.tenantId!, req.validatedBody as CreateCustomerInput) }); } catch (e) { next(e); }
};
export const list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try { const r = await s.listCustomers(req.tenantId!, req.validatedQuery as ListCustomersQuery); res.status(200).json({ success: true, data: r.customers, meta: { page: r.page, total: r.total, limit: r.limit } }); } catch (e) { next(e); }
};
export const getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try { res.status(200).json({ success: true, data: await s.getCustomerById(req.tenantId!, (req.validatedParams as { id: string }).id) }); } catch (e) { next(e); }
};
export const getByPhone = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try { res.status(200).json({ success: true, data: await s.getCustomerByPhone(req.tenantId!, (req.validatedParams as { phone: string }).phone) }); } catch (e) { next(e); }
};
export const update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try { res.status(200).json({ success: true, data: await s.updateCustomer(req.tenantId!, (req.validatedParams as { id: string }).id, req.validatedBody as UpdateCustomerInput) }); } catch (e) { next(e); }
};
