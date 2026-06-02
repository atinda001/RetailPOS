import { Router } from 'express';

import { auth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/requireRole.js';
import { validate } from '../../middleware/validate.js';
import * as inventoryController from './inventory.controller.js';
import {
  listInventoryQuerySchema,
  lowStockQuerySchema,
  movementsQuerySchema,
  stockAdjustmentSchema,
  stockItemParamsSchema
} from './inventory.schemas.js';

const router = Router();

router.use(auth);

router.get('/', validate({ query: listInventoryQuerySchema }), inventoryController.list);
router.get('/low-stock', validate({ query: lowStockQuerySchema }), inventoryController.lowStock);

router.patch(
  '/:stockItemId/adjust',
  requireRole('ADMIN', 'MANAGER'),
  validate({ params: stockItemParamsSchema, body: stockAdjustmentSchema }),
  inventoryController.adjust
);

router.get(
  '/:stockItemId/movements',
  validate({ params: stockItemParamsSchema, query: movementsQuerySchema }),
  inventoryController.movements
);

export { router as inventoryRoutes };
