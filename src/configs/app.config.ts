import { Environment } from '../common/validators/env.validation';

export const appConfig = {
  corsOrigins: (
    process.env.CORS_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173'
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  port: process.env['PORT'] || 3000,
  nodeEnv: process.env['NODE_ENV'] || Environment.Development,
};
