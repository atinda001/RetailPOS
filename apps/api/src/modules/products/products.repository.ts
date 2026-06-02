import type { Prisma, Product } from '@prisma/client';

import { prisma } from '../../lib/prisma.js';
import type { CreateProductInput, ListProductsQuery, UpdateProductInput } from './products.schemas.js';

/**
 * Creates a new product scoped to a tenant.
 * @param tenantId Tenant identifier.
 * @param input Validated product creation input.
 * @returns Created product.
 */
export const create = async (tenantId: string, input: CreateProductInput): Promise<Product> => {
  const product = await prisma.product.create({
    data: {
      tenantId,
      categoryId: input.categoryId ?? null,
      name: input.name,
      description: input.description ?? null,
      sku: input.sku ?? null,
      barcode: input.barcode ?? null,
      imageUrl: input.imageUrl ?? null,
      priceAmount: input.priceAmount,
      costAmount: input.costAmount,
      taxRateId: input.taxRateId ?? null,
      isActive: input.isActive,
      trackStock: input.trackStock,
      allowNegativeStock: input.allowNegativeStock
    }
  });

  if (input.trackStock) {
    const stores = await prisma.store.findMany({ where: { tenantId, isActive: true } });
    await prisma.stockItem.createMany({
      data: stores.map((store) => ({
        tenantId,
        storeId: store.id,
        productId: product.id,
        quantityOnHand: 0,
        reorderPoint: 5,
        reorderQuantity: 20
      })),
      skipDuplicates: true
    });
  }

  return product;
};

/**
 * Finds a single product by ID scoped to a tenant.
 * @param tenantId Tenant identifier.
 * @param id Product identifier.
 * @returns Product or null.
 */
export const findById = async (tenantId: string, id: string): Promise<Product | null> => {
  return prisma.product.findFirst({
    where: { id, tenantId },
    include: { category: true, taxRate: true }
  });
};

/**
 * Finds a product by barcode scoped to a tenant.
 * @param tenantId Tenant identifier.
 * @param barcode Product barcode.
 * @returns Product or null.
 */
export const findByBarcode = async (tenantId: string, barcode: string): Promise<Product | null> => {
  return prisma.product.findUnique({
    where: { tenantId_barcode: { tenantId, barcode } },
    include: { category: true, taxRate: true }
  });
};

/**
 * Lists products with pagination, filtering, and sorting scoped to a tenant.
 * @param tenantId Tenant identifier.
 * @param query Validated list query parameters.
 * @returns Tuple of [products, totalCount].
 */
export const list = async (tenantId: string, query: ListProductsQuery): Promise<[Product[], number]> => {
  const where: Prisma.ProductWhereInput = { tenantId };

  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { barcode: { contains: query.search, mode: 'insensitive' } },
      { sku: { contains: query.search, mode: 'insensitive' } }
    ];
  }

  if (query.categoryId) {
    where.categoryId = query.categoryId;
  }

  if (query.isActive !== undefined) {
    where.isActive = query.isActive;
  }

  const orderBy: Prisma.ProductOrderByWithRelationInput = {
    [query.sortBy]: query.sortOrder
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      include: { category: true, taxRate: true }
    }),
    prisma.product.count({ where })
  ]);

  return [products, total];
};

/**
 * Fully updates a product scoped to a tenant.
 * @param tenantId Tenant identifier.
 * @param id Product identifier.
 * @param input Validated update input.
 * @returns Updated product.
 */
export const update = async (tenantId: string, id: string, input: UpdateProductInput): Promise<Product> => {
  // Filter out undefined values to satisfy Prisma's strict types
  const data: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) {
      data[key] = value;
    }
  }

  return prisma.product.update({
    where: { id, tenantId },
    data
  });
};

/**
 * Soft-deletes a product by setting isActive to false.
 * @param tenantId Tenant identifier.
 * @param id Product identifier.
 * @returns Updated product.
 */
export const softDelete = async (tenantId: string, id: string): Promise<Product> => {
  return prisma.product.update({
    where: { id, tenantId },
    data: { isActive: false }
  });
};
