import Redis from 'ioredis';

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  retryDelayOnFailover?: number;
  enableReadyCheck?: boolean;
  maxRetriesPerRequest?: number;
}

export const redisConfig: RedisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0', 10),
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: 3,
};

// Create Redis client instance with lazy connection and retry strategy
export const redis = new Redis({
  ...redisConfig,
  lazyConnect: true, // Don't connect immediately - prevents startup crashes
  retryStrategy: (times) => {
    // Retry with exponential backoff, max 3 attempts
    if (times > 3) {
      console.error('Redis connection failed after 3 attempts, continuing without cache');
      return null; // Stop retrying
    }
    const delay = Math.min(times * 50, 2000);
    console.log(`Redis retry attempt ${times}, waiting ${delay}ms`);
    return delay;
  },
  reconnectOnError: (err) => {
    // Only reconnect on READONLY errors
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      return true;
    }
    return false;
  }
});

// Redis connection event handlers
redis.on('connect', () => {
  console.log('Connected to Redis');
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});

redis.on('ready', () => {
  console.log('Redis is ready');
});

redis.on('close', () => {
  console.log('Redis connection closed');
});

// Initialize Redis connection (call this from server.ts)
export async function initializeRedis(): Promise<boolean> {
  try {
    await redis.connect();
    console.log('Redis initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize Redis, continuing without cache:', error);
    return false;
  }
}

// Check if Redis is available
export async function isRedisAvailable(): Promise<boolean> {
  try {
    await redis.ping();
    return true;
  } catch (error) {
    return false;
  }
}

// Utility functions for common Redis operations
export class RedisUtils {
  
  // Cache with TTL
  static async setWithTTL(key: string, value: any, ttl: number = 3600): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      await redis.setex(key, ttl, serialized);
    } catch (error) {
      console.error('Redis setWithTTL error:', error);
      throw error;
    }
  }

  // Get cached value
  static async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  // Delete key
  static async del(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (error) {
      console.error('Redis del error:', error);
      throw error;
    }
  }

  // Check if key exists
  static async exists(key: string): Promise<boolean> {
    try {
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Redis exists error:', error);
      return false;
    }
  }

  // Get remaining TTL
  static async ttl(key: string): Promise<number> {
    try {
      return await redis.ttl(key);
    } catch (error) {
      console.error('Redis ttl error:', error);
      return -1;
    }
  }

  // Increment counter
  static async incr(key: string): Promise<number> {
    try {
      return await redis.incr(key);
    } catch (error) {
      console.error('Redis incr error:', error);
      throw error;
    }
  }

  // Set counter with TTL
  static async incrWithTTL(key: string, ttl: number = 3600): Promise<number> {
    try {
      const multi = redis.multi();
      multi.incr(key);
      multi.expire(key, ttl);
      const results = await multi.exec();
      return results?.[0]?.[1] as number || 0;
    } catch (error) {
      console.error('Redis incrWithTTL error:', error);
      throw error;
    }
  }

  // Add to list
  static async lpush(key: string, value: any): Promise<number> {
    try {
      const serialized = JSON.stringify(value);
      return await redis.lpush(key, serialized);
    } catch (error) {
      console.error('Redis lpush error:', error);
      throw error;
    }
  }

  // Get list range
  static async lrange<T>(key: string, start: number = 0, stop: number = -1): Promise<T[]> {
    try {
      const values = await redis.lrange(key, start, stop);
      return values.map(value => JSON.parse(value));
    } catch (error) {
      console.error('Redis lrange error:', error);
      return [];
    }
  }

  // Add to set
  static async sadd(key: string, value: any): Promise<number> {
    try {
      const serialized = JSON.stringify(value);
      return await redis.sadd(key, serialized);
    } catch (error) {
      console.error('Redis sadd error:', error);
      throw error;
    }
  }

  // Get set members
  static async smembers<T>(key: string): Promise<T[]> {
    try {
      const values = await redis.smembers(key);
      return values.map(value => JSON.parse(value));
    } catch (error) {
      console.error('Redis smembers error:', error);
      return [];
    }
  }

  // Check if member is in set
  static async sismember(key: string, value: any): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value);
      const result = await redis.sismember(key, serialized);
      return result === 1;
    } catch (error) {
      console.error('Redis sismember error:', error);
      return false;
    }
  }
}

// Export redis instance as redisService for backward compatibility
export { redis as redisService };

export default redis;