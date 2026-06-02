import type { Supplier } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import type { CreateSupplierInput, ListSuppliersQuery, UpdateSupplierInput } from './suppliers.schemas.js';

export const create = async (tenantId: string, input: CreateSupplierInput): Promise<Supplier> =>
  prisma.supplier.create({ data: { tenantId, ...input, contactName: input.contactName ?? null, phone: input.phone ?? null, email: input.email ?? null, address: input.address ?? null } });

export const findById = async (tenantId: string, id: string): Promise<Supplier | null> =>
  prisma.supplier.findFirst({ where: { id, tenantId } });

export const list = async (tenantId: string, query: ListSuppliersQuery): Promise<[Supplier[], number]> => {
  const where: import('@prisma/client').Prisma.SupplierWhereInput = { tenantId };
  if (query.search) where.name = { contains: query.search, mode: 'insensitive' };
  const [suppliers, total] = await Promise.all([prisma.supplier.findMany({ where, skip: (query.page - 1) * query.limit, take: query.limit }), prisma.supplier.count({ where })]);
  return [suppliers, total];
};

export const update = async (tenantId: string, id: string, input: UpdateSupplierInput): Promise<Supplier> =>
  prisma.supplier.update({ where: { id, tenantId }, data: input });
