import { Router } from 'express';

import { auth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/requireRole.js';
import { validate } from '../../middleware/validate.js';
import * as salesController from './sales.controller.js';
import { createSaleSchema, listSalesQuerySchema, offlineSyncSchema, saleParamsSchema, voidSaleSchema } from './sales.schemas.js';

const router = Router();
router.use(auth);

router.post('/', validate({ body: createSaleSchema }), salesController.create);
router.get('/', validate({ query: listSalesQuerySchema }), salesController.list);
router.post('/offline-sync', validate({ body: offlineSyncSchema }), salesController.offlineSync);
router.get('/:id', validate({ params: saleParamsSchema }), salesController.getById);
router.post('/:id/void', requireRole('ADMIN', 'MANAGER'), validate({ params: saleParamsSchema, body: voidSaleSchema }), salesController.voidSale);

export { router as salesRoutes };
