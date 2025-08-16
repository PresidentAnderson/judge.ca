#!/bin/bash

# Upstash Redis Setup Script for judge.ca
echo "🚀 Setting up Upstash Redis (Free Tier) for judge.ca..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}📝 Upstash Setup Instructions:${NC}"
echo ""
echo "Upstash provides serverless Redis with a generous free tier."
echo ""
echo -e "${YELLOW}Step 1: Create Upstash Account${NC}"
echo "1. Go to https://upstash.com"
echo "2. Click 'Login' and sign up with GitHub/Google/Email"
echo ""
echo -e "${YELLOW}Step 2: Create Redis Database${NC}"
echo "1. Click 'Create Database'"
echo "2. Name: judge-ca-redis"
echo "3. Type: Regional"
echo "4. Region: Choose closest (e.g., US-EAST-1)"
echo "5. Enable 'TLS/SSL' encryption"
echo "6. Enable 'Eviction' (recommended for cache)"
echo "7. Click 'Create'"
echo ""
echo -e "${YELLOW}Step 3: Get Connection Details${NC}"
echo "1. Go to your database dashboard"
echo "2. Copy the 'Redis URL' (starts with redis://)"
echo "3. It will look like:"
echo "   redis://default:[PASSWORD]@[ENDPOINT].upstash.io:6379"
echo ""
echo -e "${YELLOW}Step 4: Update Environment Variables${NC}"
echo "Run this command with your Redis URL:"
echo -e "${GREEN}vercel env add REDIS_URL production${NC}"
echo "Then paste your Upstash Redis URL"
echo ""

# Create a helper file
echo -e "${BLUE}Creating Upstash setup file...${NC}"

cat > /Volumes/DevOps/judge.ca/UPSTASH_SETUP.md << 'EOF'
# Upstash Redis Setup for Judge.ca

## Quick Setup

1. **Create Account**: https://upstash.com
2. **Create Database**: Name it "judge-ca-redis"
3. **Get Redis URL**: From database dashboard
4. **Add to Vercel**: `vercel env add REDIS_URL production`

## Connection String Format
```
redis://default:[PASSWORD]@[ENDPOINT].upstash.io:6379
```

## Free Tier Limits
- 10,000 commands daily
- 256 MB max database size
- 100 concurrent connections
- Durable storage (data persisted)

## Features Included
- TLS/SSL encryption
- REST API access
- Global replication (optional)
- Automatic backups
- Zero maintenance

## Test Connection
```javascript
// Using ioredis
const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL);

// Test
await redis.set('test', 'Hello Upstash!');
const value = await redis.get('test');
console.log(value); // "Hello Upstash!"
```

## Common Use Cases in Judge.ca
- Session storage
- Cache for database queries
- Rate limiting
- Real-time presence
- Message queue for notifications

## Monitoring
- Built-in metrics dashboard
- Command history
- Usage tracking
- Latency monitoring

## Support
- Documentation: https://docs.upstash.com
- Discord: https://upstash.com/discord
EOF

echo -e "${GREEN}✅ Upstash setup instructions created!${NC}"
echo -e "${BLUE}📄 See UPSTASH_SETUP.md for detailed instructions${NC}"

# Create Redis utility file
echo -e "${BLUE}Creating Redis utility file...${NC}"

cat > /Volumes/DevOps/judge.ca/src/backend/utils/redis.ts << 'EOF'
import Redis from 'ioredis';

// Initialize Redis client with Upstash
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  reconnectOnError(err) {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      return true;
    }
    return false;
  }
});

// Connection event handlers
redis.on('connect', () => {
  console.log('✅ Redis connected successfully');
});

redis.on('error', (err) => {
  console.error('❌ Redis connection error:', err);
});

// Utility functions for common operations
export const cache = {
  // Get cached value
  async get(key: string) {
    try {
      const value = await redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  },

  // Set cached value with TTL
  async set(key: string, value: any, ttlSeconds = 3600) {
    try {
      await redis.setex(key, ttlSeconds, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  },

  // Delete cached value
  async del(key: string) {
    try {
      await redis.del(key);
      return true;
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  },

  // Clear all cache (use with caution)
  async flush() {
    try {
      await redis.flushdb();
      return true;
    } catch (error) {
      console.error('Cache flush error:', error);
      return false;
    }
  }
};

// Session management
export const session = {
  async get(sessionId: string) {
    return cache.get(`session:${sessionId}`);
  },

  async set(sessionId: string, data: any, ttlSeconds = 86400) {
    return cache.set(`session:${sessionId}`, data, ttlSeconds);
  },

  async destroy(sessionId: string) {
    return cache.del(`session:${sessionId}`);
  }
};

// Rate limiting
export const rateLimiter = {
  async check(identifier: string, limit = 100, windowSeconds = 3600) {
    const key = `rate:${identifier}`;
    const current = await redis.incr(key);
    
    if (current === 1) {
      await redis.expire(key, windowSeconds);
    }
    
    return {
      allowed: current <= limit,
      remaining: Math.max(0, limit - current),
      reset: await redis.ttl(key)
    };
  }
};

export default redis;
EOF

echo -e "${GREEN}✅ Redis utility file created!${NC}"

# Offer to open Upstash in browser
read -p "Do you want to open Upstash in your browser now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if command -v open &> /dev/null; then
        open "https://console.upstash.com"
    elif command -v xdg-open &> /dev/null; then
        xdg-open "https://console.upstash.com"
    else
        echo "Please open https://console.upstash.com in your browser"
    fi
fi

echo ""
echo -e "${GREEN}🎉 Upstash Redis setup guide complete!${NC}"