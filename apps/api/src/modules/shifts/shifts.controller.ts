import type { NextFunction, Request, Response } from 'express';

import * as shiftsService from './shifts.service.js';
import type { CloseShiftInput, ListShiftsQuery, OpenShiftInput } from './shifts.schemas.js';

export const open = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const shift = await shiftsService.openShift(req.tenantId!, req.validatedBody as OpenShiftInput, req.user!.id);
    res.status(201).json({ success: true, data: shift });
  } catch (error) { next(error); }
};

export const close = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.validatedParams as { id: string };
    const shift = await shiftsService.closeShift(req.tenantId!, id, req.validatedBody as CloseShiftInput);
    res.status(200).json({ success: true, data: shift });
  } catch (error) { next(error); }
};

export const getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.validatedParams as { id: string };
    const shift = await shiftsService.getShiftById(req.tenantId!, id);
    res.status(200).json({ success: true, data: shift });
  } catch (error) { next(error); }
};

export const list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await shiftsService.listShifts(req.tenantId!, req.validatedQuery as ListShiftsQuery);
    res.status(200).json({ success: true, data: result.shifts, meta: { page: result.page, total: result.total, limit: result.limit } });
  } catch (error) { next(error); }
};
