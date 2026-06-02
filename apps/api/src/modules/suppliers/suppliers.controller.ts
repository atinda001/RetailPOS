import type { NextFunction, Request, Response } from 'express';
import * as s from './suppliers.service.js';
import type { CreateSupplierInput, ListSuppliersQuery, UpdateSupplierInput } from './suppliers.schemas.js';

export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try { res.status(201).json({ success: true, data: await s.createSupplier(req.tenantId!, req.validatedBody as CreateSupplierInput) }); } catch (e) { next(e); }
};
export const list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try { const r = await s.listSuppliers(req.tenantId!, req.validatedQuery as ListSuppliersQuery); res.status(200).json({ success: true, data: r.suppliers, meta: { page: r.page, total: r.total, limit: r.limit } }); } catch (e) { next(e); }
};
export const getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try { res.status(200).json({ success: true, data: await s.getSupplierById(req.tenantId!, (req.validatedParams as { id: string }).id) }); } catch (e) { next(e); }
};
export const update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try { res.status(200).json({ success: true, data: await s.updateSupplier(req.tenantId!, (req.validatedParams as { id: string }).id, req.validatedBody as UpdateSupplierInput) }); } catch (e) { next(e); }
};
