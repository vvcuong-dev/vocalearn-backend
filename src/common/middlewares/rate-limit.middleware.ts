// import { HttpStatus, Injectable, Logger, NestMiddleware } from '@nestjs/common';
// import type { NextFunction, Request, Response } from 'express';
// import { RedisService } from '../../modules/redis/redis.service';
// import { RATE_LIMIT } from '../../constants/rate-limit.constant';
// import { CACHE } from '../../constants/cache.constant';
// import { VOCALEARN_ERROR_CODES } from '../../constants/error-code.constant';
// import { AppException } from '../exceptions/app.exception';

// @Injectable()
// export class RateLimitMiddleware implements NestMiddleware {
//   private readonly logger = new Logger(RateLimitMiddleware.name);

//   constructor(private readonly redisService: RedisService) {}

//   async use(req: Request, res: Response, next: NextFunction): Promise<void> {
//     const ip = req.ip ?? req.socket.remoteAddress;
//     if (!ip) {
//       next();
//       return;
//     }

//     const redis = this.redisService.getClient();
//     const key = CACHE.RATE_LIMIT._KEY.BY_IP(ip);
//     let count: number;
//     let timeLeft: number;

//     try {
//       if (!redis.isReady) {
//         next();
//         return;
//       }

//       const [requestCount, ttl] = await redis.multi().incr(key).ttl(key).exec();
//       if (typeof requestCount !== 'number' || typeof ttl !== 'number') {
//         throw new Error('Invalid Redis rate limit result');
//       }
//       count = requestCount;
//       timeLeft = ttl;

//       // Key mới hoặc chưa có thời hạn thì đặt cửa sổ 60 giây.
//       if (count === 1 || ttl < 0) {
//         await redis.expire(key, RATE_LIMIT.WINDOW_S);
//         timeLeft = RATE_LIMIT.WINDOW_S;
//       }

//       // Chỉ phạt khi vừa chạm ngưỡng, không gia hạn ở request tiếp theo.
//       if (count === RATE_LIMIT.PENALTY_THRESHOLD) {
//         await redis.expire(key, RATE_LIMIT.PENALTY_S);
//         timeLeft = RATE_LIMIT.PENALTY_S;
//       }
//     } catch (error) {
//       // Redis lỗi thì cho request đi tiếp.
//       this.logger.error('Rate limit Redis error', error);
//       next();
//       return;
//     }

//     // Đặt ngoài catch để lỗi 429 không bị xử lý như lỗi Redis.
//     if (count > RATE_LIMIT.MAX_REQUESTS) {
//       res.setHeader('Retry-After', timeLeft);
//       throw new AppException(
//         VOCALEARN_ERROR_CODES.COMMON.TOO_MANY_REQUESTS,
//         HttpStatus.TOO_MANY_REQUESTS,
//         `Too many requests. Please try again after ${timeLeft} seconds.`,
//       );
//     }

//     next();
//   }
// }
