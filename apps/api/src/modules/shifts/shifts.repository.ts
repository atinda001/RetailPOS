import type { Shift } from '@prisma/client';

import { prisma } from '../../lib/prisma.js';
import type { ListShiftsQuery } from './shifts.schemas.js';

function addComputedFields(shift: Shift & { sales?: Array<{ totalAmount: number }> }): Shift & { durationMinutes?: number; durationDisplay?: string; cashVariance?: number } {
  const result = shift as Shift & { durationMinutes?: number; durationDisplay?: string; cashVariance?: number };

  // Duration calculation
  if (shift.closedAt) {
    const durationMs = shift.closedAt.getTime() - shift.openedAt.getTime();
    result.durationMinutes = Math.round(durationMs / 60000);
    const hours = Math.floor(result.durationMinutes / 60);
    const mins = result.durationMinutes % 60;
    result.durationDisplay = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  }

  // Cash variance calculation
  if (shift.closingFloat !== null) {
    const totalSales = (shift.sales ?? []).reduce((sum, s) => sum + (s.totalAmount ?? 0), 0);
    const expectedCash = shift.openingFloat + totalSales;
    result.cashVariance = shift.closingFloat - expectedCash;
  }

  return result;
}

export const create = async (tenantId: string, storeId: string, terminalId: string, cashierId: string, openingFloat: number): Promise<Shift> => {
  return prisma.shift.create({
    data: { tenantId, storeId, terminalId, cashierId, openingFloat },
    include: { store: true, terminal: true, cashier: { select: { id: true, firstName: true, lastName: true } } }
  });
};

export const findOpenByCashier = async (tenantId: string, cashierId: string): Promise<Shift | null> => {
  return prisma.shift.findFirst({ where: { tenantId, cashierId, status: 'OPEN' } });
};

export const findById = async (tenantId: string, id: string): Promise<Shift | null> => {
  const shift = await prisma.shift.findFirst({
    where: { id, tenantId },
    include: {
      store: true, terminal: true,
      cashier: { select: { id: true, firstName: true, lastName: true } },
      sales: { include: { payments: true } }
    }
  });
  if (!shift) return null;
  return addComputedFields(shift);
};

export const close = async (tenantId: string, id: string, closingFloat: number, notes: string | null): Promise<Shift> => {
  const shift = await prisma.shift.update({
    where: { id, tenantId },
    data: { status: 'CLOSED', closedAt: new Date(), closingFloat, notes },
    include: {
      store: true, terminal: true,
      cashier: { select: { id: true, firstName: true, lastName: true } },
      sales: { include: { payments: true } }
    }
  });
  return addComputedFields(shift);
};

export const list = async (tenantId: string, query: ListShiftsQuery): Promise<[Shift[], number]> => {
  const where: import('@prisma/client').Prisma.ShiftWhereInput = { tenantId, storeId: query.storeId };
  if (query.status) where.status = query.status;

  const [shifts, total] = await Promise.all([
    prisma.shift.findMany({
      where, orderBy: { openedAt: 'desc' },
      skip: (query.page - 1) * query.limit, take: query.limit,
      include: { cashier: { select: { id: true, firstName: true, lastName: true } }, sales: { select: { totalAmount: true } } }
    }),
    prisma.shift.count({ where })
  ]);

  return [shifts.map(addComputedFields), total];
};
