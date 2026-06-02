import { Router } from 'express';
import { auth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/requireRole.js';
import { validate } from '../../middleware/validate.js';
import * as c from './suppliers.controller.js';
import { createSupplierSchema, listSuppliersQuerySchema, supplierParamsSchema, updateSupplierSchema } from './suppliers.schemas.js';

const router = Router();
router.use(auth);
router.get('/', validate({ query: listSuppliersQuerySchema }), c.list);
router.post('/', requireRole('ADMIN', 'MANAGER'), validate({ body: createSupplierSchema }), c.create);
router.get('/:id', validate({ params: supplierParamsSchema }), c.getById);
router.put('/:id', requireRole('ADMIN', 'MANAGER'), validate({ params: supplierParamsSchema, body: updateSupplierSchema }), c.update);
export { router as suppliersRoutes };
