import { Router } from 'express';
import { auth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/requireRole.js';
import { validate } from '../../middleware/validate.js';
import * as usersController from './users.controller.js';
import { createUserSchema, listUsersQuerySchema, setPinSchema, updateUserSchema, userParamsSchema } from './users.schemas.js';

const router = Router();
router.use(auth);
router.use(requireRole('ADMIN', 'MANAGER'));

router.get('/', validate({ query: listUsersQuerySchema }), usersController.list);
router.post('/', validate({ body: createUserSchema }), usersController.create);
router.get('/:id', validate({ params: userParamsSchema }), usersController.getById);
router.put('/:id', validate({ params: userParamsSchema, body: updateUserSchema }), usersController.update);
router.delete('/:id', validate({ params: userParamsSchema }), usersController.remove);
router.post('/:id/set-pin', validate({ params: userParamsSchema, body: setPinSchema }), usersController.setPin);

export { router as usersRoutes };
