import bcrypt from 'bcrypt';
import type { User } from '@prisma/client';

import { prisma } from '../../lib/prisma.js';
import type { CreateUserInput, ListUsersQuery, UpdateUserInput } from './users.schemas.js';

export const create = async (tenantId: string, input: CreateUserInput): Promise<User> => {
  const password = await bcrypt.hash(input.password, 12);
  return prisma.user.create({
    data: { tenantId, email: input.email, password, firstName: input.firstName, lastName: input.lastName, role: input.role },
    select: { id: true, tenantId: true, email: true, firstName: true, lastName: true, role: true, isActive: true, createdAt: true, updatedAt: true }
  });
};

export const findById = async (tenantId: string, id: string): Promise<User | null> => {
  return prisma.user.findFirst({ where: { id, tenantId }, select: { id: true, tenantId: true, email: true, firstName: true, lastName: true, role: true, isActive: true, createdAt: true, updatedAt: true } });
};

export const list = async (tenantId: string, query: ListUsersQuery): Promise<[User[], number]> => {
  const where: import('@prisma/client').Prisma.UserWhereInput = { tenantId };
  if (query.role) where.role = query.role;
  if (query.isActive !== undefined) where.isActive = query.isActive;

  const [users, total] = await Promise.all([
    prisma.user.findMany({ where, skip: (query.page - 1) * query.limit, take: query.limit, select: { id: true, tenantId: true, email: true, firstName: true, lastName: true, role: true, isActive: true, createdAt: true, updatedAt: true } }),
    prisma.user.count({ where })
  ]);
  return [users, total];
};

export const update = async (tenantId: string, id: string, input: UpdateUserInput): Promise<User> => {
  return prisma.user.update({ where: { id, tenantId }, data: input, select: { id: true, tenantId: true, email: true, firstName: true, lastName: true, role: true, isActive: true, createdAt: true, updatedAt: true } });
};

export const softDelete = async (tenantId: string, id: string): Promise<User> => {
  return prisma.user.update({ where: { id, tenantId }, data: { isActive: false }, select: { id: true, tenantId: true, email: true, firstName: true, lastName: true, role: true, isActive: true, createdAt: true, updatedAt: true } });
};

export const setPin = async (tenantId: string, id: string, pin: string): Promise<User> => {
  const hashedPin = await bcrypt.hash(pin, 12);
  return prisma.user.update({ where: { id, tenantId }, data: { pin: hashedPin }, select: { id: true, tenantId: true, email: true, firstName: true, lastName: true, role: true, isActive: true, createdAt: true, updatedAt: true } });
};
