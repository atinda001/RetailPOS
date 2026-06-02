import type { NextFunction, Request, Response } from 'express';
import * as s from './reports.service.js';
import type { DateRangeQuery, EndOfDayQuery, SalesSummaryQuery } from './reports.schemas.js';

export const salesSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try { res.status(200).json({ success: true, data: await s.getSalesSummary(req.tenantId!, req.validatedQuery as SalesSummaryQuery) }); } catch (e) { next(e); }
};

export const endOfDay = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try { res.status(200).json({ success: true, data: await s.getEndOfDay(req.tenantId!, req.validatedQuery as EndOfDayQuery) }); } catch (e) { next(e); }
};

export const productPerformance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try { res.status(200).json({ success: true, data: await s.getProductPerformance(req.tenantId!, req.validatedQuery as DateRangeQuery & { limit?: number }) }); } catch (e) { next(e); }
};

export const cashierPerformance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try { res.status(200).json({ success: true, data: await s.getCashierPerformance(req.tenantId!, req.validatedQuery as DateRangeQuery) }); } catch (e) { next(e); }
};
