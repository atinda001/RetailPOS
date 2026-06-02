import type { Prisma, PrismaClient, Sale } from '@prisma/client';

import { prisma } from '../../lib/prisma.js';
import type { CreateSaleInput, ListSalesQuery } from './sales.schemas.js';

interface CreateSaleData {
  tenantId: string;
  storeId: string;
  terminalId: string;
  shiftId: string;
  cashierId: string;
  customerId: string | null;
  receiptNumber: string;
  subtotalAmount: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  amountTendered: number;
  changeAmount: number;
  notes: string | null;
  offlineId: string | null;
  lineItems: Array<{
    productId: string;
    productName: string;
    productBarcode: string | null;
    quantity: number;
    unitPriceAmount: number;
    discountAmount: number;
    taxAmount: number;
    totalAmount: number;
  }>;
  payments: Array<{
    method: string;
    amount: number;
    reference: string | null;
  }>;
}

type TransactionClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

/**
 * Creates a sale with line items and payments within an existing transaction.
 * @param tx Prisma transaction client.
 * @param data Sale creation data.
 * @returns Created sale with includes.
 */
export const createInTransaction = async (tx: TransactionClient, data: CreateSaleData): Promise<Sale> => {
  const sale = await tx.sale.create({
      data: {
        tenantId: data.tenantId,
        storeId: data.storeId,
        terminalId: data.terminalId,
        shiftId: data.shiftId,
        cashierId: data.cashierId,
        customerId: data.customerId,
        receiptNumber: data.receiptNumber,
        subtotalAmount: data.subtotalAmount,
        discountAmount: data.discountAmount,
        taxAmount: data.taxAmount,
        totalAmount: data.totalAmount,
        amountTendered: data.amountTendered,
        changeAmount: data.changeAmount,
        notes: data.notes,
        offlineId: data.offlineId,
        lineItems: {
          create: data.lineItems
        },
        payments: {
          create: data.payments.map((p) => ({
            method: p.method as import('@prisma/client').PaymentMethod,
            amount: p.amount,
            reference: p.reference
          }))
        }
      },
      include: {
        lineItems: true,
        payments: true,
        cashier: { select: { id: true, firstName: true, lastName: true } },
        store: { select: { id: true, name: true, currency: true } }
      }
    });

    return sale;
};

/**
 * Creates a sale with line items and payments in a standalone transaction.
 * @param data Sale creation data.
 * @returns Created sale with includes.
 */
export const create = async (data: CreateSaleData): Promise<Sale> => {
  return prisma.$transaction(async (tx) => {
    return createInTransaction(tx, data);
  });
};

/**
 * Finds a sale by ID scoped to a tenant.
 * @param tenantId Tenant identifier.
 * @param id Sale identifier.
 * @returns Sale or null.
 */
export const findById = async (tenantId: string, id: string): Promise<Sale | null> => {
  return prisma.sale.findFirst({
    where: { id, tenantId },
    include: {
      lineItems: {
        include: {
          product: { select: { id: true, name: true, barcode: true, imageUrl: true } }
        }
      },
      payments: true,
      cashier: { select: { id: true, firstName: true, lastName: true } },
      customer: { select: { id: true, firstName: true, lastName: true, phone: true } },
      store: { select: { id: true, name: true, currency: true } },
      shift: { select: { id: true, openedAt: true } }
    }
  });
};

/**
 * Finds a sale by offlineId for idempotency.
 * @param tenantId Tenant identifier.
 * @param offlineId Client-generated offline identifier.
 * @returns Sale or null.
 */
export const findByOfflineId = async (tenantId: string, offlineId: string): Promise<Sale | null> => {
  return prisma.sale.findUnique({
    where: { tenantId_offlineId: { tenantId, offlineId } },
    include: {
      lineItems: true,
      payments: true,
      cashier: { select: { id: true, firstName: true, lastName: true } },
      store: { select: { id: true, name: true, currency: true } }
    }
  });
};

/**
 * Lists sales with filters and pagination scoped to a tenant.
 * @param tenantId Tenant identifier.
 * @param query Validated list query.
 * @returns Tuple of [sales, totalCount].
 */
export const list = async (tenantId: string, query: ListSalesQuery): Promise<[Sale[], number]> => {
  const where: Prisma.SaleWhereInput = { tenantId };

  if (query.storeId) where.storeId = query.storeId;
  if (query.cashierId) where.cashierId = query.cashierId;
  if (query.status) where.status = query.status;

  if (query.from || query.to) {
    where.createdAt = {};
    if (query.from) where.createdAt.gte = new Date(query.from);
    if (query.to) where.createdAt.lte = new Date(query.to);
  }

  const [sales, total] = await Promise.all([
    prisma.sale.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      include: {
        lineItems: true,
        payments: true,
        cashier: { select: { id: true, firstName: true, lastName: true } }
      }
    }),
    prisma.sale.count({ where })
  ]);

  return [sales, total];
};

/**
 * Voids a sale by setting status to VOIDED.
 * @param tenantId Tenant identifier.
 * @param id Sale identifier.
 * @param voidedById User performing the void.
 * @param voidReason Reason for voiding.
 * @returns Voided sale.
 */
export const voidSale = async (
  tenantId: string,
  id: string,
  voidedById: string,
  voidReason: string
): Promise<Sale> => {
  return prisma.sale.update({
    where: { id, tenantId },
    data: {
      status: 'VOIDED',
      voidedAt: new Date(),
      voidedById,
      voidReason
    },
    include: {
      lineItems: true,
      payments: true
    }
  });
};

/**
 * Generates the next receipt number for a tenant using an atomic sequence.
 * @param tenantId Tenant identifier.
 * @returns Receipt number string.
 */
export const generateReceiptNumber = async (tenantId: string): Promise<string> => {
  const year = new Date().getFullYear();
  const seqName = `receipt_seq_${tenantId.replace(/-/g, '_')}`;

  await prisma.$executeRawUnsafe(
    `CREATE SEQUENCE IF NOT EXISTS "${seqName}" START 1`
  );

  const result = await prisma.$queryRawUnsafe<Array<{ nextval: bigint }>>(
    `SELECT nextval('"${seqName}"') as nextval`
  );

  const seq = Number(result[0]?.nextval ?? 1);
  return `RCP-${year}-${String(seq).padStart(6, '0')}`;
};
