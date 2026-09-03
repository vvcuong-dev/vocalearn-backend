const PREFIX = 'vocalearn';
const GLOBAL_VER = 'v1';

export type CacheFetcher<T> = () => Promise<T>;

// Time to live for cache entries in seconds
export const TTL = {
  TINY: 60, // 1 minute
  SHORT: 300, // 5 minutes
  MEDIUM: 900, // 15 minutes
  LONG: 3600, // 1 hour
  VERY_LONG: 86400, // 1 day
  WEEK: 604800, // 1 week
};

// Manage cache keys with a consistent prefix and versioning

export const CACHE = {
  AUTH: {
    _VER: 'v1',
    _KEY: {
      REFRESH_TOKEN: (userId: number, jti: string) =>
        `${PREFIX}:${GLOBAL_VER}:auth:${CACHE.AUTH._VER}:refresh:id_${userId}:jti_${jti}`,
      BLACKLIST: (jti: string) =>
        `${PREFIX}:${GLOBAL_VER}:auth:${CACHE.AUTH._VER}:blacklist:jti_${jti}`,
      RESET_PASSWORD: (token: string) =>
        `${PREFIX}:${GLOBAL_VER}:auth:${CACHE.AUTH._VER}:reset_password:token_${token}`,
    },
    _PATTERN: {
      ALL_REFRESH_TOKENS: (userId: number) =>
        `${PREFIX}:${GLOBAL_VER}:auth:${CACHE.AUTH._VER}:refresh:id_${userId}:jti_*`,
    },
  },
};
