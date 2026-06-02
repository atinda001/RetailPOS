import Redis from 'ioredis';

import { config } from '../config/index.js';
import { logger } from './logger.js';

export const redis = new Redis(config.redisUrl, {
  lazyConnect: true,
  maxRetriesPerRequest: 3
});

redis.on('error', (err) => {
  logger.warn({ err }, 'Redis connection error');
});
