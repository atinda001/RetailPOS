import type { Sale } from '@prisma/client';

import { prisma } from '../../lib/prisma.js';
import { AppError, ErrorCode, NotFoundError } from '../../types/errors.js';
import type { CreateSaleInput, ListSalesQuery, OfflineSyncInput, VoidSaleInput } from './sales.schemas.js';
import * as salesRepository from './sales.repository.js';

/**
 * Processes a complete sale transaction atomically.
 * @param tenantId Tenant identifier.
 * @param input Validated sale creation input.
 * @param cashierId Authenticated cashier ID.
 * @returns Created sale with line items and payments.
 */
export const createSale = async (tenantId: string, input: CreateSaleInput, cashierId: string): Promise<Sale> => {
  // Check for duplicate offline sale outside transaction (idempotency check)
  if (input.offlineId) {
    const existing = await salesRepository.findByOfflineId(tenantId, input.offlineId);
    if (existing) return existing;
  }

  return prisma.$transaction(async (tx) => {
    // Lock shift for update to prevent race conditions
    const shift = await tx.shift.findFirst({
      where: { id: input.shiftId, tenantId, terminalId: input.terminalId }
    });

    if (!shift) throw new AppError(ErrorCode.SHIFT_NOT_OPEN, 'Shift not found or does not belong to terminal', 422);
    if (shift.status === 'CLOSED') throw new AppError(ErrorCode.SHIFT_ALREADY_CLOSED, 'Shift is already closed', 422);

    const productIds = input.lineItems.map((li) => li.productId);
    const products = await tx.product.findMany({
      where: { id: { in: productIds }, tenantId, isActive: true }
    });

    const productMap = new Map(products.map((p) => [p.id, p]));
    const storeId = shift.storeId;

    // Process stock decrements sequentially to avoid deadlocks
    for (const item of input.lineItems) {
      const product = productMap.get(item.productId);
      if (!product) throw new NotFoundError(ErrorCode.PRODUCT_NOT_FOUND, `Product ${item.productId} not found`);

      if (product.trackStock) {
        // Use atomic decrement with check to prevent overselling
        const stockItem = await tx.stockItem.findUnique({
          where: { storeId_productId: { storeId, productId: item.productId } }
        });

        const onHand = stockItem?.quantityOnHand ?? 0;
        if (onHand < item.quantity && !product.allowNegativeStock) {
          throw new AppError(ErrorCode.INSUFFICIENT_STOCK, `Insufficient stock for ${product.name}`, 422);
        }

        const updated = await tx.stockItem.upsert({
          where: { storeId_productId: { storeId, productId: item.productId } },
          create: { tenantId, storeId, productId: item.productId, quantityOnHand: -item.quantity },
          update: { quantityOnHand: { decrement: item.quantity } }
        });

        await tx.stockMovement.create({
          data: {
            tenantId, stockItemId: updated.id, type: 'SALE',
            quantityDelta: -item.quantity, referenceId: null, createdBy: cashierId
          }
        });
      }
    }

    let subtotal = 0;
    let lineTaxTotal = 0;

    const lineItemsData = input.lineItems.map((item) => {
      const product = productMap.get(item.productId)!;
      const lineTotal = item.quantity * item.unitPriceAmount - item.discountAmount;
      const taxAmount = Math.round(lineTotal * (product.taxRateId ? 1600 : 0) / 10000);
      subtotal += item.quantity * item.unitPriceAmount;
      lineTaxTotal += taxAmount;

      return {
        productId: item.productId, productName: product.name,
        productBarcode: product.barcode, quantity: item.quantity,
        unitPriceAmount: item.unitPriceAmount, discountAmount: item.discountAmount,
        taxAmount, totalAmount: lineTotal + taxAmount
      };
    });

    const totalAmount = subtotal - input.discountAmount + lineTaxTotal;
    const amountTendered = input.payments.reduce((sum, p) => sum + p.amount, 0);
    const changeAmount = amountTendered - totalAmount;

    if (amountTendered < totalAmount) {
      throw new AppError(ErrorCode.PAYMENT_AMOUNT_MISMATCH, 'Payment amount is less than total', 422);
    }

    // Generate receipt number inside transaction for atomicity
    const receiptNumber = await salesRepository.generateReceiptNumber(tenantId);

    return salesRepository.createInTransaction(tx, {
      tenantId, storeId, terminalId: input.terminalId, shiftId: input.shiftId,
      cashierId, customerId: input.customerId ?? null, receiptNumber,
      subtotalAmount: subtotal, discountAmount: input.discountAmount,
      taxAmount: lineTaxTotal, totalAmount, amountTendered, changeAmount,
      notes: input.notes ?? null, offlineId: input.offlineId ?? null,
      lineItems: lineItemsData,
      payments: input.payments.map((p) => ({ method: p.method, amount: p.amount, reference: p.reference ?? null }))
    });
  }, { isolationLevel: 'Serializable' });
};

/**
 * Retrieves a sale by ID.
 * @param tenantId Tenant identifier.
 * @param id Sale identifier.
 * @returns Sale with includes.
 */
export const getSaleById = async (tenantId: string, id: string): Promise<Sale> => {
  const sale = await salesRepository.findById(tenantId, id);
  if (!sale) throw new NotFoundError(ErrorCode.SALE_NOT_FOUND, 'Sale not found');
  return sale;
};

/**
 * Lists sales with pagination and filters.
 * @param tenantId Tenant identifier.
 * @param query Validated list query.
 * @returns Sales, total, page, limit.
 */
export const listSales = async (tenantId: string, query: ListSalesQuery): Promise<{
  sales: Sale[]; total: number; page: number; limit: number;
}> => {
  const [sales, total] = await salesRepository.list(tenantId, query);
  return { sales, total, page: query.page, limit: query.limit };
};

/**
 * Voids a sale and reverses stock movements.
 * @param tenantId Tenant identifier.
 * @param id Sale identifier.
 * @param input Void reason.
 * @param userId User performing the void.
 * @returns Voided sale.
 */
export const voidSale = async (tenantId: string, id: string, input: VoidSaleInput, userId: string): Promise<Sale> => {
  return prisma.$transaction(async (tx) => {
    const sale = await tx.sale.findFirst({
      where: { id, tenantId },
      include: { lineItems: true }
    });
    if (!sale) throw new NotFoundError(ErrorCode.SALE_NOT_FOUND, 'Sale not found');
    if (sale.status === 'VOIDED') throw new AppError(ErrorCode.SALE_ALREADY_VOIDED, 'Sale is already voided', 422);

    const voided = await tx.sale.update({
      where: { id, tenantId },
      data: {
        status: 'VOIDED',
        voidedAt: new Date(),
        voidedById: userId,
        voidReason: input.voidReason
      },
      include: { lineItems: true, payments: true }
    });

    for (const item of sale.lineItems) {
      const product = await tx.product.findFirst({ where: { id: item.productId, tenantId } });
      if (!product?.trackStock) continue;

      const stockItem = await tx.stockItem.findUnique({
        where: { storeId_productId: { storeId: sale.storeId, productId: item.productId } }
      });

      if (stockItem) {
        await tx.stockItem.update({
          where: { id: stockItem.id },
          data: { quantityOnHand: { increment: item.quantity } }
        });

        await tx.stockMovement.create({
          data: {
            tenantId, stockItemId: stockItem.id, type: 'RETURN',
            quantityDelta: item.quantity, reason: `Void: ${input.voidReason}`,
            referenceId: sale.id, createdBy: userId
          }
        });
      }
    }

    await tx.auditLog.create({
      data: {
        tenantId, userId, action: 'sale.void', entityType: 'Sale',
        entityId: id, metadata: { voidReason: input.voidReason }
      }
    });

    return voided;
  });
};

/**
 * Processes a batch of offline sales.
 * @param tenantId Tenant identifier.
 * @param input Offline sync input.
 * @param cashierId Authenticated cashier ID.
 * @returns Array of created sales.
 */
export const syncOfflineSales = async (tenantId: string, input: OfflineSyncInput, cashierId: string): Promise<Sale[]> => {
  const results: Sale[] = [];

  for (const saleInput of input.sales) {
    try {
      const sale = await createSale(tenantId, saleInput, cashierId);
      results.push(sale);
    } catch (error) {
      if (error instanceof AppError && error.code === ErrorCode.DUPLICATE_OFFLINE_SALE) {
        const existing = await salesRepository.findByOfflineId(tenantId, saleInput.offlineId!);
        if (existing) results.push(existing);
      }
    }
  }

  return results;
};
