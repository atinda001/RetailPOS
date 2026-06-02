import { Router } from 'express';
import { auth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import * as c from './customers.controller.js';
import { createCustomerSchema, customerParamsSchema, listCustomersQuerySchema, phoneParamsSchema, updateCustomerSchema } from './customers.schemas.js';

const router = Router();
router.use(auth);
router.get('/', validate({ query: listCustomersQuerySchema }), c.list);
router.post('/', validate({ body: createCustomerSchema }), c.create);
router.get('/phone/:phone', validate({ params: phoneParamsSchema }), c.getByPhone);
router.get('/:id', validate({ params: customerParamsSchema }), c.getById);
router.put('/:id', validate({ params: customerParamsSchema, body: updateCustomerSchema }), c.update);
export { router as customersRoutes };
