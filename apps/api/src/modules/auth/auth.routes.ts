import { Router } from 'express';

import { rateLimiter } from '../../middleware/rateLimiter.js';
import { validate } from '../../middleware/validate.js';
import * as authController from './auth.controller.js';
import { loginSchema, pinLoginSchema, refreshSchema } from './auth.schemas.js';

const router = Router();

const authRateLimit = rateLimiter(10, 60, 'rate:auth');

router.post('/login', authRateLimit, validate({ body: loginSchema }), authController.login);
router.post('/pin-login', authRateLimit, validate({ body: pinLoginSchema }), authController.pinLogin);
router.post('/refresh', validate({ body: refreshSchema }), authController.refresh);
router.post('/logout', validate({ body: refreshSchema }), authController.logout);

export { router as authRoutes };
