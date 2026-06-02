import { Router } from 'express';
import { auth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/requireRole.js';
import { validate } from '../../middleware/validate.js';
import * as c from './purchases.controller.js';
import { createPurchaseSchema, listPurchasesQuerySchema, purchaseParamsSchema, receivePurchaseSchema } from './purchases.schemas.js';

const router = Router();
router.use(auth);
router.get('/', validate({ query: listPurchasesQuerySchema }), c.list);
router.post('/', requireRole('ADMIN', 'MANAGER'), validate({ body: createPurchaseSchema }), c.create);
router.get('/:id', validate({ params: purchaseParamsSchema }), c.getById);
router.patch('/:id/receive', requireRole('ADMIN', 'MANAGER'), validate({ params: purchaseParamsSchema, body: receivePurchaseSchema }), c.receive);
export { router as purchasesRoutes };
