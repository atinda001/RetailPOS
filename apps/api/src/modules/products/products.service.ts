import type { Product } from '@prisma/client';

import { NotFoundError } from '../../types/errors.js';
import { ErrorCode } from '../../types/errors.js';
import type { CreateProductInput, ListProductsQuery, UpdateProductInput } from './products.schemas.js';
import * as productsRepository from './products.repository.js';

/**
 * Creates a product after verifying the tenant scope.
 * @param tenantId Tenant identifier.
 * @param input Validated creation input.
 * @returns Created product.
 */
export const createProduct = async (tenantId: string, input: CreateProductInput): Promise<Product> => {
  return productsRepository.create(tenantId, input);
};

/**
 * Retrieves a product by ID, throwing if not found.
 * @param tenantId Tenant identifier.
 * @param id Product identifier.
 * @returns Product.
 * @throws NotFoundError if product does not exist.
 */
export const getProductById = async (tenantId: string, id: string): Promise<Product> => {
  const product = await productsRepository.findById(tenantId, id);
  if (!product) {
    throw new NotFoundError(ErrorCode.PRODUCT_NOT_FOUND, 'Product not found');
  }
  return product;
};

/**
 * Retrieves a product by barcode, throwing if not found.
 * @param tenantId Tenant identifier.
 * @param barcode Product barcode.
 * @returns Product.
 * @throws NotFoundError if product does not exist.
 */
export const getProductByBarcode = async (tenantId: string, barcode: string): Promise<Product> => {
  const product = await productsRepository.findByBarcode(tenantId, barcode);
  if (!product) {
    throw new NotFoundError(ErrorCode.PRODUCT_NOT_FOUND, 'Product not found');
  }
  return product;
};

/**
 * Lists products with pagination metadata.
 * @param tenantId Tenant identifier.
 * @param query Validated list query.
 * @returns Products array, total count, page, and limit.
 */
export const listProducts = async (tenantId: string, query: ListProductsQuery): Promise<{
  products: Product[];
  total: number;
  page: number;
  limit: number;
}> => {
  const [products, total] = await productsRepository.list(tenantId, query);
  return { products, total, page: query.page, limit: query.limit };
};

/**
 * Updates a product after verifying it exists.
 * @param tenantId Tenant identifier.
 * @param id Product identifier.
 * @param input Validated update input.
 * @returns Updated product.
 * @throws NotFoundError if product does not exist.
 */
export const updateProduct = async (tenantId: string, id: string, input: UpdateProductInput): Promise<Product> => {
  const existing = await productsRepository.findById(tenantId, id);
  if (!existing) {
    throw new NotFoundError(ErrorCode.PRODUCT_NOT_FOUND, 'Product not found');
  }
  return productsRepository.update(tenantId, id, input);
};

/**
 * Soft-deletes a product after verifying it exists.
 * @param tenantId Tenant identifier.
 * @param id Product identifier.
 * @returns Soft-deleted product.
 * @throws NotFoundError if product does not exist.
 */
export const deleteProduct = async (tenantId: string, id: string): Promise<Product> => {
  const existing = await productsRepository.findById(tenantId, id);
  if (!existing) {
    throw new NotFoundError(ErrorCode.PRODUCT_NOT_FOUND, 'Product not found');
  }
  return productsRepository.softDelete(tenantId, id);
};
