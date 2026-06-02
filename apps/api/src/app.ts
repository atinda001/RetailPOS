import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import 'express-async-errors';
import helmet from 'helmet';

import { API_BASE_PATH } from './constants/api.js';
import { config } from './config/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { inventoryRoutes } from './modules/inventory/inventory.routes.js';
import { productsRoutes } from './modules/products/products.routes.js';
import { salesRoutes } from './modules/sales/sales.routes.js';
import { customersRoutes } from './modules/customers/customers.routes.js';
import { purchasesRoutes } from './modules/purchases/purchases.routes.js';
import { reportsRoutes } from './modules/reports/reports.routes.js';
import { shiftsRoutes } from './modules/shifts/shifts.routes.js';
import { suppliersRoutes } from './modules/suppliers/suppliers.routes.js';
import { usersRoutes } from './modules/users/users.routes.js';
import { storesRoutes } from './modules/stores/stores.routes.js';

/**
 * Creates and configures the Express application.
 * @returns Configured Express application instance.
 */
export const createApp = (): express.Application => {
  const app = express();

  app.use(helmet());
  app.disable('x-powered-by');

  app.use(cors({
    origin: config.allowedOrigins as unknown as string[],
    credentials: true
  }));

  app.use(express.json());
  app.use(cookieParser());
  app.use(requestLogger);

  app.get(`${API_BASE_PATH}/health`, (_req, res) => {
    res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
  });

  app.use(`${API_BASE_PATH}/auth`, authRoutes);
  app.use(`${API_BASE_PATH}/inventory`, inventoryRoutes);
  app.use(`${API_BASE_PATH}/products`, productsRoutes);
  app.use(`${API_BASE_PATH}/sales`, salesRoutes);
  app.use(`${API_BASE_PATH}/customers`, customersRoutes);
  app.use(`${API_BASE_PATH}/purchases`, purchasesRoutes);
  app.use(`${API_BASE_PATH}/reports`, reportsRoutes);
  app.use(`${API_BASE_PATH}/shifts`, shiftsRoutes);
  app.use(`${API_BASE_PATH}/suppliers`, suppliersRoutes);
  app.use(`${API_BASE_PATH}/users`, usersRoutes);
  app.use(`${API_BASE_PATH}/stores`, storesRoutes);

  app.use(errorHandler);

  return app;
};
