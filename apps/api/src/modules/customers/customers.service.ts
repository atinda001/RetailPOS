import type { Customer } from '@prisma/client';
import { NotFoundError, ErrorCode } from '../../types/errors.js';
import type { CreateCustomerInput, ListCustomersQuery, UpdateCustomerInput } from './customers.schemas.js';
import * as repo from './customers.repository.js';

export const createCustomer = async (tenantId: string, input: CreateCustomerInput): Promise<Customer> => repo.create(tenantId, input);

export const getCustomerById = async (tenantId: string, id: string): Promise<Customer> => {
  const c = await repo.findById(tenantId, id);
  if (!c) throw new NotFoundError(ErrorCode.CUSTOMER_NOT_FOUND, 'Customer not found');
  return c;
};

export const getCustomerByPhone = async (tenantId: string, phone: string): Promise<Customer> => {
  const c = await repo.findByPhone(tenantId, phone);
  if (!c) throw new NotFoundError(ErrorCode.CUSTOMER_NOT_FOUND, 'Customer not found');
  return c;
};

export const listCustomers = async (tenantId: string, query: ListCustomersQuery): Promise<{ customers: Customer[]; total: number; page: number; limit: number }> => {
  const [customers, total] = await repo.list(tenantId, query);
  return { customers, total, page: query.page, limit: query.limit };
};

export const updateCustomer = async (tenantId: string, id: string, input: UpdateCustomerInput): Promise<Customer> => {
  const existing = await repo.findById(tenantId, id);
  if (!existing) throw new NotFoundError(ErrorCode.CUSTOMER_NOT_FOUND, 'Customer not found');
  return repo.update(tenantId, id, input);
};
