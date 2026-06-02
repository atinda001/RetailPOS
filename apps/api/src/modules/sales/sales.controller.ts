import type { NextFunction, Request, Response } from 'express';

import * as salesService from './sales.service.js';
import type { CreateSaleInput, ListSalesQuery, OfflineSyncInput, VoidSaleInput } from './sales.schemas.js';

export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const sale = await salesService.createSale(req.tenantId!, req.validatedBody as CreateSaleInput, req.user!.id);
    res.status(201).json({ success: true, data: sale });
  } catch (error) { next(error); }
};

export const list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await salesService.listSales(req.tenantId!, req.validatedQuery as ListSalesQuery);
    res.status(200).json({ success: true, data: result.sales, meta: { page: result.page, total: result.total, limit: result.limit } });
  } catch (error) { next(error); }
};

export const getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.validatedParams as { id: string };
    const sale = await salesService.getSaleById(req.tenantId!, id);
    res.status(200).json({ success: true, data: sale });
  } catch (error) { next(error); }
};

export const voidSale = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.validatedParams as { id: string };
    const sale = await salesService.voidSale(req.tenantId!, id, req.validatedBody as VoidSaleInput, req.user!.id);
    res.status(200).json({ success: true, data: sale });
  } catch (error) { next(error); }
};

export const offlineSync = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const sales = await salesService.syncOfflineSales(req.tenantId!, req.validatedBody as OfflineSyncInput, req.user!.id);
    res.status(201).json({ success: true, data: sales });
  } catch (error) { next(error); }
};
