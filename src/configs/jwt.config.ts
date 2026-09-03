import type { SignOptions } from 'jsonwebtoken';

function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required env variable: ${key}`);
  }
  return value;
}

export const jwtConfig = {
  accessSecret: getRequiredEnv('JWT_ACCESS_SECRET'),
  refreshSecret: getRequiredEnv('JWT_REFRESH_SECRET'),
  accessExpiresIn: (process.env['JWT_ACCESS_EXPIRES_IN'] ||
    '15m') as SignOptions['expiresIn'],
  refreshExpiresIn: (process.env['JWT_REFRESH_EXPIRES_IN'] ||
    '7d') as SignOptions['expiresIn'],
};
