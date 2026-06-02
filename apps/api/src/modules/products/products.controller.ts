import type { NextFunction, Request, Response } from 'express';

import * as productsService from './products.service.js';
import type { CreateProductInput, ListProductsQuery, UpdateProductInput } from './products.schemas.js';

/**
 * Creates a new product.
 * @param req Express request with validated body.
 * @param res Express response.
 * @param next Express next function.
 * @returns Void.
 */
export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const product = await productsService.createProduct(
      req.tenantId!,
      req.validatedBody as CreateProductInput
    );
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

/**
 * Lists products with pagination.
 * @param req Express request with validated query.
 * @param res Express response.
 * @param next Express next function.
 * @returns Void.
 */
export const list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await productsService.listProducts(
      req.tenantId!,
      req.validatedQuery as ListProductsQuery
    );
    res.status(200).json({
      success: true,
      data: result.products,
      meta: { page: result.page, total: result.total, limit: result.limit }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Gets a single product by ID.
 * @param req Express request with validated params.
 * @param res Express response.
 * @param next Express next function.
 * @returns Void.
 */
export const getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.validatedParams as { id: string };
    const product = await productsService.getProductById(req.tenantId!, id);
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

/**
 * Looks up a product by barcode.
 * @param req Express request with validated params.
 * @param res Express response.
 * @param next Express next function.
 * @returns Void.
 */
export const getByBarcode = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { barcode } = req.validatedParams as { barcode: string };
    const product = await productsService.getProductByBarcode(req.tenantId!, barcode);
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

/**
 * Fully updates a product.
 * @param req Express request with validated params and body.
 * @param res Express response.
 * @param next Express next function.
 * @returns Void.
 */
export const update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.validatedParams as { id: string };
    const product = await productsService.updateProduct(
      req.tenantId!,
      id,
      req.validatedBody as UpdateProductInput
    );
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

/**
 * Soft-deletes a product.
 * @param req Express request with validated params.
 * @param res Express response.
 * @param next Express next function.
 * @returns Void.
 */
export const remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.validatedParams as { id: string };
    await productsService.deleteProduct(req.tenantId!, id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
