import type { Customer } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import type { CreateCustomerInput, ListCustomersQuery, UpdateCustomerInput } from './customers.schemas.js';

export const create = async (tenantId: string, input: CreateCustomerInput): Promise<Customer> =>
  prisma.customer.create({ data: { tenantId, firstName: input.firstName, lastName: input.lastName ?? null, phone: input.phone ?? null, email: input.email ?? null } });

export const findById = async (tenantId: string, id: string): Promise<Customer | null> =>
  prisma.customer.findFirst({ where: { id, tenantId } });

export const findByPhone = async (tenantId: string, phone: string): Promise<Customer | null> =>
  prisma.customer.findUnique({ where: { tenantId_phone: { tenantId, phone } } });

export const list = async (tenantId: string, query: ListCustomersQuery): Promise<[Customer[], number]> => {
  const where: import('@prisma/client').Prisma.CustomerWhereInput = { tenantId };
  if (query.search) where.OR = [{ firstName: { contains: query.search, mode: 'insensitive' } }, { lastName: { contains: query.search, mode: 'insensitive' } }, { phone: { contains: query.search, mode: 'insensitive' } }];
  const [customers, total] = await Promise.all([prisma.customer.findMany({ where, skip: (query.page - 1) * query.limit, take: query.limit }), prisma.customer.count({ where })]);
  return [customers, total];
};

export const update = async (tenantId: string, id: string, input: UpdateCustomerInput): Promise<Customer> =>
  prisma.customer.update({ where: { id, tenantId }, data: input });
