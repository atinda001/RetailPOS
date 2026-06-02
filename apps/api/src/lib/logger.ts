import pino from 'pino';

import { config } from '../config/index.js';

export const logger = pino({
  level: config.nodeEnv === 'production' ? 'info' : 'debug',
  redact: ['req.body.password', 'req.body.pin', 'req.headers.authorization']
});
