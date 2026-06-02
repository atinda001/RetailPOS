import type { Shift } from '@prisma/client';

import { prisma } from '../../lib/prisma.js';
import { AppError, ErrorCode, NotFoundError } from '../../types/errors.js';
import type { CloseShiftInput, ListShiftsQuery, OpenShiftInput } from './shifts.schemas.js';
import * as shiftsRepository from './shifts.repository.js';

export const openShift = async (tenantId: string, input: OpenShiftInput, cashierId: string): Promise<Shift> => {
  const existing = await shiftsRepository.findOpenByCashier(tenantId, cashierId);
  if (existing) throw new AppError(ErrorCode.SHIFT_ALREADY_OPEN, 'You already have an open shift', 409);

  const terminal = await prisma.terminal.findFirst({ where: { id: input.terminalId, tenantId, isActive: true } });
  if (!terminal) throw new NotFoundError(ErrorCode.SHIFT_NOT_FOUND, 'Terminal not found');

  return shiftsRepository.create(tenantId, terminal.storeId, input.terminalId, cashierId, input.openingFloat);
};

export const closeShift = async (tenantId: string, id: string, input: CloseShiftInput): Promise<Shift> => {
  const shift = await shiftsRepository.findById(tenantId, id);
  if (!shift) throw new NotFoundError(ErrorCode.SHIFT_NOT_FOUND, 'Shift not found');
  if (shift.status === 'CLOSED') throw new AppError(ErrorCode.SHIFT_ALREADY_CLOSED, 'Shift is already closed', 422);

  return shiftsRepository.close(tenantId, id, input.closingFloat, input.notes ?? null);
};

export const getShiftById = async (tenantId: string, id: string): Promise<Shift> => {
  const shift = await shiftsRepository.findById(tenantId, id);
  if (!shift) throw new NotFoundError(ErrorCode.SHIFT_NOT_FOUND, 'Shift not found');
  return shift;
};

export const listShifts = async (tenantId: string, query: ListShiftsQuery): Promise<{
  shifts: Shift[]; total: number; page: number; limit: number;
}> => {
  const [shifts, total] = await shiftsRepository.list(tenantId, query);
  return { shifts, total, page: query.page, limit: query.limit };
};
