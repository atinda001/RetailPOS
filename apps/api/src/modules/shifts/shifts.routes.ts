import { Router } from 'express';

import { auth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/requireRole.js';
import { validate } from '../../middleware/validate.js';
import * as shiftsController from './shifts.controller.js';
import { closeShiftSchema, listShiftsQuerySchema, openShiftSchema, shiftParamsSchema } from './shifts.schemas.js';

const router = Router();
router.use(auth);

router.post('/open', validate({ body: openShiftSchema }), shiftsController.open);
router.post('/:id/close', requireRole('ADMIN', 'MANAGER'), validate({ params: shiftParamsSchema, body: closeShiftSchema }), shiftsController.close);
router.get('/:id', validate({ params: shiftParamsSchema }), shiftsController.getById);
router.get('/', validate({ query: listShiftsQuerySchema }), shiftsController.list);

export { router as shiftsRoutes };
