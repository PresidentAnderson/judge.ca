#!/bin/bash

# Railway Redis Setup Script
# This script sets up Redis for caching and session management on Railway

set -e

echo "🔴 Setting up Redis on Railway..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Please install it first."
    exit 1
fi

# Check if logged in
if ! railway whoami &> /dev/null; then
    echo "🔐 Please log in to Railway first: railway login"
    exit 1
fi

# Add Redis service
echo "📝 Adding Redis service to Railway project..."
railway add --database redis

echo "⏳ Waiting for Redis service to be ready..."
sleep 30

# The REDIS_URL will be automatically available in environment variables
echo "✅ Redis service added successfully"

# Get Redis connection info
echo "🔍 Getting Redis connection details..."
REDIS_URL=$(railway variables get REDIS_URL 2>/dev/null || echo "")

if [ -z "$REDIS_URL" ]; then
    echo "⚠️ REDIS_URL not found. Please check Railway dashboard."
    echo "💡 The Redis service might still be initializing. Try again in a few minutes."
else
    echo "✅ Redis URL configured: ${REDIS_URL:0:30}..."
fi

# Create Redis configuration for the application
cat > src/backend/config/redis.config.ts << 'EOF'
import { createClient } from 'redis';
import { logger } from '../utils/logger';

interface RedisConfig {
  url: string;
  retryDelayOnFailover: number;
  maxRetriesPerRequest: number;
  connectTimeout: number;
  commandTimeout: number;
}

class RedisService {
  private client: any;
  private subscriber: any;
  private publisher: any;
  private isConnected = false;

  constructor() {
    this.initializeClient();
  }

  private async initializeClient() {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      
      // Create Redis client
      this.client = createClient({
        url: redisUrl,
        retry_unfulfilled_commands: true,
        retry_delay_on_failover: 100,
        socket: {
          connectTimeout: 60000,
          commandTimeout: 5000,
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              logger.error('Redis connection failed after 10 retries');
              return false;
            }
            return Math.min(retries * 50, 500);
          }
        }
      });

      // Create separate clients for pub/sub
      this.subscriber = createClient({ url: redisUrl });
      this.publisher = createClient({ url: redisUrl });

      // Set up event listeners
      this.client.on('error', (err: Error) => {
        logger.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        logger.info('Redis client connected');
        this.isConnected = true;
      });

      this.client.on('ready', () => {
        logger.info('Redis client ready');
      });

      this.client.on('end', () => {
        logger.info('Redis client disconnected');
        this.isConnected = false;
      });

      // Connect clients
      await Promise.all([
        this.client.connect(),
        this.subscriber.connect(),
        this.publisher.connect()
      ]);

      logger.info('Redis service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Redis:', error);
      throw error;
    }
  }

  // Basic cache operations
  async get(key: string): Promise<string | null> {
    try {
      if (!this.isConnected) return null;
      return await this.client.get(key);
    } catch (error) {
      logger.error(`Redis GET error for key ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<boolean> {
    try {
      if (!this.isConnected) return false;
      
      if (ttl) {
        await this.client.setEx(key, ttl, value);
      } else {
        await this.client.set(key, value);
      }
      return true;
    } catch (error) {
      logger.error(`Redis SET error for key ${key}:`, error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      if (!this.isConnected) return false;
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error(`Redis DEL error for key ${key}:`, error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      if (!this.isConnected) return false;
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Redis EXISTS error for key ${key}:`, error);
      return false;
    }
  }

  // Hash operations
  async hGet(hash: string, field: string): Promise<string | null> {
    try {
      if (!this.isConnected) return null;
      return await this.client.hGet(hash, field);
    } catch (error) {
      logger.error(`Redis HGET error for ${hash}.${field}:`, error);
      return null;
    }
  }

  async hSet(hash: string, field: string, value: string): Promise<boolean> {
    try {
      if (!this.isConnected) return false;
      await this.client.hSet(hash, field, value);
      return true;
    } catch (error) {
      logger.error(`Redis HSET error for ${hash}.${field}:`, error);
      return false;
    }
  }

  async hGetAll(hash: string): Promise<Record<string, string> | null> {
    try {
      if (!this.isConnected) return null;
      return await this.client.hGetAll(hash);
    } catch (error) {
      logger.error(`Redis HGETALL error for ${hash}:`, error);
      return null;
    }
  }

  // List operations
  async lPush(key: string, ...values: string[]): Promise<number> {
    try {
      if (!this.isConnected) return 0;
      return await this.client.lPush(key, values);
    } catch (error) {
      logger.error(`Redis LPUSH error for key ${key}:`, error);
      return 0;
    }
  }

  async rPop(key: string): Promise<string | null> {
    try {
      if (!this.isConnected) return null;
      return await this.client.rPop(key);
    } catch (error) {
      logger.error(`Redis RPOP error for key ${key}:`, error);
      return null;
    }
  }

  // Pub/Sub operations
  async publish(channel: string, message: string): Promise<boolean> {
    try {
      if (!this.isConnected) return false;
      await this.publisher.publish(channel, message);
      return true;
    } catch (error) {
      logger.error(`Redis PUBLISH error for channel ${channel}:`, error);
      return false;
    }
  }

  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    try {
      if (!this.isConnected) return;
      
      await this.subscriber.subscribe(channel, (message) => {
        callback(message);
      });
    } catch (error) {
      logger.error(`Redis SUBSCRIBE error for channel ${channel}:`, error);
    }
  }

  // Session management
  async getSession(sessionId: string): Promise<any> {
    try {
      const sessionData = await this.get(`session:${sessionId}`);
      return sessionData ? JSON.parse(sessionData) : null;
    } catch (error) {
      logger.error(`Error getting session ${sessionId}:`, error);
      return null;
    }
  }

  async setSession(sessionId: string, sessionData: any, ttl: number = 3600): Promise<boolean> {
    try {
      return await this.set(`session:${sessionId}`, JSON.stringify(sessionData), ttl);
    } catch (error) {
      logger.error(`Error setting session ${sessionId}:`, error);
      return false;
    }
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      return await this.del(`session:${sessionId}`);
    } catch (error) {
      logger.error(`Error deleting session ${sessionId}:`, error);
      return false;
    }
  }

  // Rate limiting
  async incrementRateLimit(key: string, window: number): Promise<number> {
    try {
      if (!this.isConnected) return 0;
      
      const multi = this.client.multi();
      multi.incr(key);
      multi.expire(key, window);
      const results = await multi.exec();
      
      return results[0] as number;
    } catch (error) {
      logger.error(`Redis rate limit error for key ${key}:`, error);
      return 0;
    }
  }

  // Health check
  async ping(): Promise<boolean> {
    try {
      if (!this.isConnected) return false;
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      logger.error('Redis ping error:', error);
      return false;
    }
  }

  // Graceful shutdown
  async disconnect(): Promise<void> {
    try {
      await Promise.all([
        this.client?.quit(),
        this.subscriber?.quit(),
        this.publisher?.quit()
      ]);
      logger.info('Redis connections closed');
    } catch (error) {
      logger.error('Error closing Redis connections:', error);
    }
  }

  // Get connection status
  isRedisConnected(): boolean {
    return this.isConnected;
  }
}

// Export singleton instance
export const redisService = new RedisService();
export default redisService;
EOF

echo "📝 Redis configuration created: src/backend/config/redis.config.ts"

# Create Redis middleware for Express
cat > src/backend/middleware/redis.middleware.ts << 'EOF'
import { Request, Response, NextFunction } from 'express';
import { redisService } from '../config/redis.config';
import { logger } from '../utils/logger';

// Cache middleware
export const cacheMiddleware = (ttl: number = 300) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Only cache GET requests
      if (req.method !== 'GET') {
        return next();
      }

      const cacheKey = `cache:${req.originalUrl}`;
      const cachedData = await redisService.get(cacheKey);

      if (cachedData) {
        logger.debug(`Cache hit for ${req.originalUrl}`);
        return res.json(JSON.parse(cachedData));
      }

      // Override res.json to cache the response
      const originalJson = res.json;
      res.json = function(data: any) {
        // Cache successful responses only
        if (res.statusCode === 200) {
          redisService.set(cacheKey, JSON.stringify(data), ttl);
          logger.debug(`Cached response for ${req.originalUrl}`);
        }
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error:', error);
      next();
    }
  };
};

// Rate limiting middleware using Redis
export const redisRateLimit = (windowMs: number, max: number) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const identifier = req.ip || 'unknown';
      const key = `rate_limit:${identifier}`;
      const window = Math.ceil(windowMs / 1000);

      const current = await redisService.incrementRateLimit(key, window);

      if (current > max) {
        return res.status(429).json({
          error: 'Too many requests',
          retryAfter: window
        });
      }

      // Add rate limit headers
      res.set({
        'X-RateLimit-Limit': max.toString(),
        'X-RateLimit-Remaining': Math.max(0, max - current).toString(),
        'X-RateLimit-Reset': new Date(Date.now() + windowMs).toISOString()
      });

      next();
    } catch (error) {
      logger.error('Redis rate limit error:', error);
      // Fall back to allowing the request if Redis fails
      next();
    }
  };
};

// Session middleware
export const sessionMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionId = req.headers['x-session-id'] as string;
    
    if (sessionId) {
      const sessionData = await redisService.getSession(sessionId);
      if (sessionData) {
        req.session = sessionData;
      }
    }

    next();
  } catch (error) {
    logger.error('Session middleware error:', error);
    next();
  }
};
EOF

echo "📝 Redis middleware created: src/backend/middleware/redis.middleware.ts"

echo ""
echo "📋 Redis setup complete! Next steps:"
echo "1. Update your application to use Redis for caching and sessions"
echo "2. Import redisService in your routes and services"
echo "3. Use cache middleware for expensive API calls"
echo "4. Test Redis connection: railway run node -e \"require('./dist/config/redis.config').default.ping().then(console.log)\""
echo ""
echo "🔴 Example usage:"
echo "  // Cache API response for 5 minutes"
echo "  app.get('/api/attorneys', cacheMiddleware(300), getAttorneys);"
echo ""
echo "  // Rate limit API to 100 requests per 15 minutes"
echo "  app.use('/api', redisRateLimit(900000, 100));"
echo ""
echo "✅ Railway Redis setup complete!"