import { Router } from 'express';

import { auth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/requireRole.js';
import { validate } from '../../middleware/validate.js';
import * as c from './stores.controller.js';
import { createStoreSchema, storeParamsSchema, updateStoreSchema } from './stores.schemas.js';

const router = Router();
router.use(auth);

router.get('/', requireRole('ADMIN', 'MANAGER'), c.list);
router.post('/', requireRole('ADMIN'), validate({ body: createStoreSchema }), c.create);
router.get('/:id', requireRole('ADMIN', 'MANAGER'), validate({ params: storeParamsSchema }), c.getById);
router.put('/:id', requireRole('ADMIN'), validate({ params: storeParamsSchema, body: updateStoreSchema }), c.update);
router.patch('/:id/deactivate', requireRole('ADMIN'), validate({ params: storeParamsSchema }), c.deactivate);
router.get('/:id/terminals', requireRole('ADMIN', 'MANAGER'), validate({ params: storeParamsSchema }), c.getTerminals);
router.post('/:id/terminals', requireRole('ADMIN'), validate({ params: storeParamsSchema }), c.addTerminal);
router.patch('/:id/terminals/:terminalId/deactivate', requireRole('ADMIN'), c.deactivateTerminal);

export { router as storesRoutes };
