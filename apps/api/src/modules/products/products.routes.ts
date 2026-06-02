import { Router } from 'express';

import { auth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/requireRole.js';
import { validate } from '../../middleware/validate.js';
import * as productsController from './products.controller.js';
import {
  barcodeParamsSchema,
  createProductSchema,
  listProductsQuerySchema,
  productParamsSchema,
  updateProductSchema
} from './products.schemas.js';

const router = Router();

router.use(auth);

router.get(
  '/',
  validate({ query: listProductsQuerySchema }),
  productsController.list
);

router.post(
  '/',
  requireRole('ADMIN', 'MANAGER'),
  validate({ body: createProductSchema }),
  productsController.create
);

router.get(
  '/barcode/:barcode',
  validate({ params: barcodeParamsSchema }),
  productsController.getByBarcode
);

router.get(
  '/:id',
  validate({ params: productParamsSchema }),
  productsController.getById
);

router.put(
  '/:id',
  requireRole('ADMIN', 'MANAGER'),
  validate({ params: productParamsSchema, body: updateProductSchema }),
  productsController.update
);

router.delete(
  '/:id',
  requireRole('ADMIN', 'MANAGER'),
  validate({ params: productParamsSchema }),
  productsController.remove
);

export { router as productsRoutes };
