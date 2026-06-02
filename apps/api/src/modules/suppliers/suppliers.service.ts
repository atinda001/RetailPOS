import type { Supplier } from '@prisma/client';
import { NotFoundError, ErrorCode } from '../../types/errors.js';
import type { CreateSupplierInput, ListSuppliersQuery, UpdateSupplierInput } from './suppliers.schemas.js';
import * as repo from './suppliers.repository.js';

export const createSupplier = async (tenantId: string, input: CreateSupplierInput): Promise<Supplier> => repo.create(tenantId, input);
export const getSupplierById = async (tenantId: string, id: string): Promise<Supplier> => {
  const s = await repo.findById(tenantId, id); if (!s) throw new NotFoundError(ErrorCode.PRODUCT_NOT_FOUND, 'Supplier not found'); return s;
};
export const listSuppliers = async (tenantId: string, query: ListSuppliersQuery): Promise<{ suppliers: Supplier[]; total: number; page: number; limit: number }> => {
  const [suppliers, total] = await repo.list(tenantId, query); return { suppliers, total, page: query.page, limit: query.limit };
};
export const updateSupplier = async (tenantId: string, id: string, input: UpdateSupplierInput): Promise<Supplier> => {
  const existing = await repo.findById(tenantId, id); if (!existing) throw new NotFoundError(ErrorCode.PRODUCT_NOT_FOUND, 'Supplier not found'); return repo.update(tenantId, id, input);
};
