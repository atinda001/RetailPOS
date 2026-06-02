import { prisma } from '../../lib/prisma.js';
import type { CreateStoreInput, UpdateStoreInput } from './stores.schemas.js';

export const list = async (tenantId: string) => {
  return prisma.store.findMany({
    where: { tenantId },
    include: {
      _count: { select: { terminals: true, users: true } }
    },
    orderBy: { createdAt: 'asc' }
  });
};

export const findById = async (tenantId: string, id: string) => {
  return prisma.store.findFirst({
    where: { id, tenantId },
    include: {
      terminals: { where: { isActive: true } },
      _count: { select: { terminals: true, users: true, sales: true } }
    }
  });
};

export const create = async (tenantId: string, input: CreateStoreInput) => {
  return prisma.$transaction(async (tx) => {
    const store = await tx.store.create({
      data: { tenantId, ...input }
    });

    // Create a default terminal for the new store
    const terminal = await tx.terminal.create({
      data: {
        tenantId,
        storeId: store.id,
        name: 'Counter 1',
        isActive: true
      }
    });

    // Bootstrap stock items for all existing products in the tenant
    const products = await tx.product.findMany({
      where: { tenantId, isActive: true, trackStock: true },
      select: { id: true }
    });

    if (products.length > 0) {
      await tx.stockItem.createMany({
        data: products.map((p) => ({
          tenantId,
          storeId: store.id,
          productId: p.id,
          quantityOnHand: 0,
          reorderPoint: 5,
          reorderQuantity: 20
        })),
        skipDuplicates: true
      });
    }

    return { store, terminal };
  });
};

export const update = async (tenantId: string, id: string, input: UpdateStoreInput) => {
  const data: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) data[key] = value;
  }
  return prisma.store.update({
    where: { id, tenantId },
    data
  });
};

export const deactivate = async (tenantId: string, id: string) => {
  return prisma.store.update({
    where: { id, tenantId },
    data: { isActive: false }
  });
};

export const listTerminals = async (tenantId: string, storeId: string) => {
  return prisma.terminal.findMany({
    where: { storeId, tenantId },
    orderBy: { name: 'asc' }
  });
};

export const createTerminal = async (tenantId: string, storeId: string, name: string) => {
  return prisma.terminal.create({
    data: { tenantId, storeId, name, isActive: true }
  });
};

export const deactivateTerminal = async (tenantId: string, terminalId: string) => {
  return prisma.terminal.updateMany({
    where: { id: terminalId, tenantId },
    data: { isActive: false }
  });
};
