import { AppError, ErrorCode, NotFoundError } from '../../types/errors.js';
import type { CreateStoreInput, UpdateStoreInput } from './stores.schemas.js';
import * as repo from './stores.repository.js';

export const listStores = async (tenantId: string) => repo.list(tenantId);

export const getStore = async (tenantId: string, id: string) => {
  const store = await repo.findById(tenantId, id);
  if (!store) throw new NotFoundError(ErrorCode.STORE_NOT_FOUND, 'Store not found');
  return store;
};

export const createStore = async (tenantId: string, input: CreateStoreInput) =>
  repo.create(tenantId, input);

export const updateStore = async (tenantId: string, id: string, input: UpdateStoreInput) => {
  const store = await repo.findById(tenantId, id);
  if (!store) throw new NotFoundError(ErrorCode.STORE_NOT_FOUND, 'Store not found');
  return repo.update(tenantId, id, input);
};

export const deactivateStore = async (tenantId: string, id: string) => {
  const store = await repo.findById(tenantId, id);
  if (!store) throw new NotFoundError(ErrorCode.STORE_NOT_FOUND, 'Store not found');
  if (!store.isActive) throw new AppError(ErrorCode.VALIDATION_ERROR, 'Store is already inactive', 422);
  return repo.deactivate(tenantId, id);
};

export const listTerminals = async (tenantId: string, storeId: string) => {
  const store = await repo.findById(tenantId, storeId);
  if (!store) throw new NotFoundError(ErrorCode.STORE_NOT_FOUND, 'Store not found');
  return repo.listTerminals(tenantId, storeId);
};

export const addTerminal = async (tenantId: string, storeId: string, name: string) => {
  const store = await repo.findById(tenantId, storeId);
  if (!store) throw new NotFoundError(ErrorCode.STORE_NOT_FOUND, 'Store not found');
  return repo.createTerminal(tenantId, storeId, name);
};

export const deactivateTerminal = async (tenantId: string, terminalId: string) =>
  repo.deactivateTerminal(tenantId, terminalId);
