import { AppError, ErrorCode } from '../../types/errors.js';
import { findById, formatReceipt } from './receipts.repository.js';

export const generateReceipt = async (tenantId: string, saleId: string) => {
  const sale = await findById(tenantId, saleId);
  if (!sale) {
    throw new AppError(ErrorCode.SALE_NOT_FOUND, 'Sale not found', 404);
  }
  return formatReceipt(sale);
};
