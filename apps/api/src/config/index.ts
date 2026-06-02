import { z } from 'zod';

const environmentSchema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().min(1),
  JWT_REFRESH_EXPIRES_IN: z.string().min(1),
  AWS_BUCKET: z.string().min(1),
  AWS_REGION: z.string().min(1),
  AWS_ACCESS_KEY_ID: z.string().min(1),
  AWS_SECRET_ACCESS_KEY: z.string().min(1),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  ALLOWED_ORIGINS: z.string().default('http://localhost:5173'),
  SENTRY_DSN: z.string().optional().default('')
});

export type AppConfig = Readonly<{
  databaseUrl: string;
  redisUrl: string;
  jwtSecret: string;
  jwtRefreshSecret: string;
  jwtExpiresIn: string;
  jwtRefreshExpiresIn: string;
  awsBucket: string;
  awsRegion: string;
  awsAccessKeyId: string;
  awsSecretAccessKey: string;
  nodeEnv: 'development' | 'test' | 'production';
  port: number;
  allowedOrigins: readonly string[];
  sentryDsn: string;
}>;

const parsedEnvironment = environmentSchema.parse(process.env);

export const config: AppConfig = Object.freeze({
  databaseUrl: parsedEnvironment.DATABASE_URL,
  redisUrl: parsedEnvironment.REDIS_URL,
  jwtSecret: parsedEnvironment.JWT_SECRET,
  jwtRefreshSecret: parsedEnvironment.JWT_REFRESH_SECRET,
  jwtExpiresIn: parsedEnvironment.JWT_EXPIRES_IN,
  jwtRefreshExpiresIn: parsedEnvironment.JWT_REFRESH_EXPIRES_IN,
  awsBucket: parsedEnvironment.AWS_BUCKET,
  awsRegion: parsedEnvironment.AWS_REGION,
  awsAccessKeyId: parsedEnvironment.AWS_ACCESS_KEY_ID,
  awsSecretAccessKey: parsedEnvironment.AWS_SECRET_ACCESS_KEY,
  nodeEnv: parsedEnvironment.NODE_ENV,
  port: parsedEnvironment.PORT,
  allowedOrigins: parsedEnvironment.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim()).filter((origin) => origin.length > 0),
  sentryDsn: parsedEnvironment.SENTRY_DSN
});
