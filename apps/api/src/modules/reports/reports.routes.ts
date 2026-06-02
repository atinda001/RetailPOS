import { Router } from 'express';
import { auth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/requireRole.js';
import { validate } from '../../middleware/validate.js';
import * as c from './reports.controller.js';
import { endOfDayQuerySchema, productPerformanceQuerySchema, cashierPerformanceQuerySchema, salesSummaryQuerySchema } from './reports.schemas.js';

const router = Router();
router.use(auth);
router.use(requireRole('ADMIN', 'MANAGER'));

router.get('/sales-summary', validate({ query: salesSummaryQuerySchema }), c.salesSummary);
router.get('/end-of-day', validate({ query: endOfDayQuerySchema }), c.endOfDay);
router.get('/product-performance', validate({ query: productPerformanceQuerySchema }), c.productPerformance);
router.get('/cashier-performance', validate({ query: cashierPerformanceQuerySchema }), c.cashierPerformance);

export { router as reportsRoutes };
