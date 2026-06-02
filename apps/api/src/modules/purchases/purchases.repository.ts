import type { Purchase } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import type { CreatePurchaseInput, ListPurchasesQuery } from './purchases.schemas.js';

export const create = async (tenantId: string, input: CreatePurchaseInput): Promise<Purchase> => {
  const totalAmount = input.lineItems.reduce((sum, li) => sum + li.quantity * li.unitCostAmount, 0);
  return prisma.purchase.create({
    data: {
      tenantId, storeId: input.storeId, supplierId: input.supplierId ?? null, totalAmount, notes: input.notes ?? null,
      lineItems: { create: input.lineItems.map((li) => ({ productId: li.productId, quantity: li.quantity, unitCostAmount: li.unitCostAmount, totalAmount: li.quantity * li.unitCostAmount })) }
    },
    include: { lineItems: { include: { product: true } }, supplier: true }
  });
};

export const findById = async (tenantId: string, id: string): Promise<Purchase | null> =>
  prisma.purchase.findFirst({ where: { id, tenantId }, include: { lineItems: { include: { product: true } }, supplier: true } });

export const list = async (tenantId: string, query: ListPurchasesQuery): Promise<[Purchase[], number]> => {
  const where: import('@prisma/client').Prisma.PurchaseWhereInput = { tenantId };
  if (query.storeId) where.storeId = query.storeId;
  if (query.status) where.status = query.status;
  const [purchases, total] = await Promise.all([prisma.purchase.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (query.page - 1) * query.limit, take: query.limit, include: { supplier: true } }), prisma.purchase.count({ where })]);
  return [purchases, total];
};

export const markReceived = async (tenantId: string, id: string): Promise<Purchase> => {
  return prisma.$transaction(async (tx) => {
    const purchase = await tx.purchase.update({ where: { id, tenantId }, data: { status: 'RECEIVED', receivedAt: new Date() }, include: { lineItems: true } });
    for (const item of purchase.lineItems) {
      await tx.stockItem.upsert({
        where: { storeId_productId: { storeId: purchase.storeId, productId: item.productId } },
        create: { tenantId, storeId: purchase.storeId, productId: item.productId, quantityOnHand: item.quantity },
        update: { quantityOnHand: { increment: item.quantity } }
      });
      const stockItem = await tx.stockItem.findUnique({ where: { storeId_productId: { storeId: purchase.storeId, productId: item.productId } } });
      await tx.stockMovement.create({ data: { tenantId, stockItemId: stockItem!.id, type: 'PURCHASE', quantityDelta: item.quantity, referenceId: purchase.id } });
    }
    return purchase;
  });
};
