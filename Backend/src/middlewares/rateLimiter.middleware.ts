import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const authAttempts = new Map<string, RateLimitRecord>();

/**
 * In-memory IP rate limiter for sensitive authentication endpoints:
 * Allows max 20 attempts per 15-minute window per IP.
 */
export const authRateLimiter = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 20;

  const record = authAttempts.get(ip);
  if (record) {
    if (now > record.resetTime) {
      authAttempts.set(ip, { count: 1, resetTime: now + windowMs });
    } else {
      record.count += 1;
      if (record.count > maxAttempts) {
        const retryAfterSec = Math.ceil((record.resetTime - now) / 1000);
        res.setHeader('Retry-After', retryAfterSec);
        return res.status(429).json({
          error: `Too many login attempts. Please wait ${Math.ceil(retryAfterSec / 60)} minute(s) before trying again.`,
        });
      }
    }
  } else {
    authAttempts.set(ip, { count: 1, resetTime: now + windowMs });
  }

  // Periodic garbage collection for expired entries (every 100 entries)
  if (authAttempts.size > 100) {
    for (const [key, val] of authAttempts.entries()) {
      if (now > val.resetTime) {
        authAttempts.delete(key);
      }
    }
  }

  next();
};

