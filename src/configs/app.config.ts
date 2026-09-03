import { Environment } from '../common/validators/env.validation';

export const appConfig = {
  port: process.env['PORT'] || 3000,
  nodeEnv: process.env['NODE_ENV'] || Environment.Development,
};
