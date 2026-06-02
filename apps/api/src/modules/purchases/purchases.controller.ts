import type { NextFunction, Request, Response } from 'express';
import * as s from './purchases.service.js';
import type { CreatePurchaseInput, ListPurchasesQuery } from './purchases.schemas.js';

export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try { res.status(201).json({ success: true, data: await s.createPurchase(req.tenantId!, req.validatedBody as CreatePurchaseInput) }); } catch (e) { next(e); }
};
export const list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try { const r = await s.listPurchases(req.tenantId!, req.validatedQuery as ListPurchasesQuery); res.status(200).json({ success: true, data: r.purchases, meta: { page: r.page, total: r.total, limit: r.limit } }); } catch (e) { next(e); }
};
export const getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try { res.status(200).json({ success: true, data: await s.getPurchaseById(req.tenantId!, (req.validatedParams as { id: string }).id) }); } catch (e) { next(e); }
};
export const receive = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try { res.status(200).json({ success: true, data: await s.receivePurchase(req.tenantId!, (req.validatedParams as { id: string }).id) }); } catch (e) { next(e); }
};
