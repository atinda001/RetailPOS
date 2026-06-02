import type { Purchase } from '@prisma/client';
import { NotFoundError, AppError, ErrorCode } from '../../types/errors.js';
import type { CreatePurchaseInput, ListPurchasesQuery } from './purchases.schemas.js';
import * as repo from './purchases.repository.js';

export const createPurchase = async (tenantId: string, input: CreatePurchaseInput): Promise<Purchase> => repo.create(tenantId, input);
export const getPurchaseById = async (tenantId: string, id: string): Promise<Purchase> => {
  const p = await repo.findById(tenantId, id); if (!p) throw new NotFoundError(ErrorCode.SALE_NOT_FOUND, 'Purchase not found'); return p;
};
export const listPurchases = async (tenantId: string, query: ListPurchasesQuery): Promise<{ purchases: Purchase[]; total: number; page: number; limit: number }> => {
  const [purchases, total] = await repo.list(tenantId, query); return { purchases, total, page: query.page, limit: query.limit };
};
export const receivePurchase = async (tenantId: string, id: string): Promise<Purchase> => {
  const p = await repo.findById(tenantId, id);
  if (!p) throw new NotFoundError(ErrorCode.SALE_NOT_FOUND, 'Purchase not found');
  if (p.status === 'RECEIVED') throw new AppError(ErrorCode.SALE_ALREADY_VOIDED, 'Purchase already received', 422);
  return repo.markReceived(tenantId, id);
};
