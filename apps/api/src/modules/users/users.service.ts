import type { User } from '@prisma/client';

import { NotFoundError, ErrorCode } from '../../types/errors.js';
import type { CreateUserInput, ListUsersQuery, SetPinInput, UpdateUserInput } from './users.schemas.js';
import * as usersRepository from './users.repository.js';

export const createUser = async (tenantId: string, input: CreateUserInput): Promise<User> => usersRepository.create(tenantId, input);

export const getUserById = async (tenantId: string, id: string): Promise<User> => {
  const user = await usersRepository.findById(tenantId, id);
  if (!user) throw new NotFoundError(ErrorCode.USER_NOT_FOUND, 'User not found');
  return user;
};

export const listUsers = async (tenantId: string, query: ListUsersQuery): Promise<{ users: User[]; total: number; page: number; limit: number }> => {
  const [users, total] = await usersRepository.list(tenantId, query);
  return { users, total, page: query.page, limit: query.limit };
};

export const updateUser = async (tenantId: string, id: string, input: UpdateUserInput): Promise<User> => {
  const existing = await usersRepository.findById(tenantId, id);
  if (!existing) throw new NotFoundError(ErrorCode.USER_NOT_FOUND, 'User not found');
  return usersRepository.update(tenantId, id, input);
};

export const deleteUser = async (tenantId: string, id: string): Promise<User> => {
  const existing = await usersRepository.findById(tenantId, id);
  if (!existing) throw new NotFoundError(ErrorCode.USER_NOT_FOUND, 'User not found');
  return usersRepository.softDelete(tenantId, id);
};

export const setUserPin = async (tenantId: string, id: string, input: SetPinInput): Promise<User> => {
  const existing = await usersRepository.findById(tenantId, id);
  if (!existing) throw new NotFoundError(ErrorCode.USER_NOT_FOUND, 'User not found');
  return usersRepository.setPin(tenantId, id, input.pin);
};
