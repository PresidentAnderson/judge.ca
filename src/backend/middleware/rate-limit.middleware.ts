import rateLimit from 'express-rate-limit';

interface RateLimitOptions {
  maxRequests?: number;
  windowMs?: number;
  message?: string;
}

export const rateLimitMiddleware = (options: RateLimitOptions = {}) => {
  const {
    maxRequests = 100,
    windowMs = 15 * 60 * 1000, // 15 minutes
    message = 'Too many requests from this IP, please try again later.',
  } = options;

  return rateLimit({
    windowMs,
    max: maxRequests,
    message: {
      error: message,
      retryAfter: Math.ceil(windowMs / 1000),
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};