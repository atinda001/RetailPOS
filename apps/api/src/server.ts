import { config } from './config/index.js';
import { createApp } from './app.js';
import { logger } from './lib/logger.js';
import { redis } from './lib/redis.js';

const app = createApp();

const start = async (): Promise<void> => {
  try {
    await redis.connect();
    logger.info('Connected to Redis');
  } catch {
    logger.warn('Redis unavailable — running without session persistence');
  }

  try {
    app.listen(config.port, () => {
      logger.info({ port: config.port, env: config.nodeEnv }, 'API server started');
    });
  } catch (error) {
    logger.error({ error }, 'Failed to start server');
    process.exit(1);
  }
};

void start();