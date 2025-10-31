# Railway Deployment Guide for Judge.ca Backend Services

## Overview

This guide covers the complete deployment of Judge.ca backend services to Railway.app, including API server, WebSocket server, PostgreSQL database, and Redis cache.

## Prerequisites

1. **Railway CLI installed**
   ```bash
   curl -fsSL https://railway.app/install.sh | sh
   ```

2. **Railway account and project**
   - Sign up at [railway.app](https://railway.app)
   - Create a new project or use existing one

3. **Environment configuration**
   - Frontend deployed to Vercel
   - Domain configuration ready

## Quick Deployment

### 1. Automated Deployment
```bash
# Run the complete deployment script
./scripts/deploy-railway.sh
```

### 2. Manual Step-by-Step Deployment

#### Step 1: Initialize Railway Project
```bash
# Login to Railway
railway login

# Link to existing project or create new
railway init
# OR link to existing project
railway link [PROJECT_ID]
```

#### Step 2: Add Database Services
```bash
# Add PostgreSQL
railway add --database postgresql

# Add Redis
railway add --database redis

# Wait for services to initialize
sleep 60
```

#### Step 3: Configure Environment Variables
```bash
# Run environment setup script
./scripts/setup-railway-env.sh

# Or set manually
railway variables set NODE_ENV=production
railway variables set JWT_SECRET=$(openssl rand -base64 32)
railway variables set FRONTEND_URL=https://your-frontend-url.vercel.app
```

#### Step 4: Build and Deploy
```bash
# Build the TypeScript project
npm run build:backend

# Deploy to Railway
railway up --detach
```

## Services Architecture

### 1. Main Application Service
- **Type**: Web Service
- **Port**: 3001 (auto-assigned by Railway)
- **Build Command**: `npm run build:backend`
- **Start Command**: `npm start`
- **Health Check**: `/health`

### 2. PostgreSQL Database
- **Service**: Managed PostgreSQL
- **Connection**: Automatic via `DATABASE_URL`
- **Backup**: Automated by Railway
- **Schema**: Initialized via `scripts/init-railway-db.sql`

### 3. Redis Cache
- **Service**: Managed Redis
- **Connection**: Automatic via `REDIS_URL`
- **Usage**: Caching, sessions, rate limiting
- **Configuration**: `src/backend/config/redis.config.ts`

## Environment Variables

### Required Variables
```bash
# Application
NODE_ENV=production
JWT_SECRET=your-jwt-secret
SESSION_SECRET=your-session-secret
FRONTEND_URL=https://your-frontend.vercel.app

# Database (automatically set by Railway)
DATABASE_URL=postgresql://user:pass@host:port/db
REDIS_URL=redis://user:pass@host:port

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
```

### Optional Variables
```bash
# Stripe Payments
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email Service
SENDGRID_API_KEY=SG....
FROM_EMAIL=noreply@judge.ca

# Monitoring
SENTRY_DSN=https://...@sentry.io/...
LOG_LEVEL=info

# File Upload
MAX_FILE_SIZE=10485760
AWS_S3_BUCKET=your-bucket
```

## Health Checks and Monitoring

### Health Check Endpoints

1. **Basic Health Check**
   ```
   GET /health
   ```
   Returns overall system health status.

2. **Detailed Health Check**
   ```
   GET /health/detailed
   ```
   Returns comprehensive system information.

3. **Service-Specific Checks**
   ```
   GET /health/db        # Database connectivity
   GET /health/redis     # Redis connectivity
   GET /health/websocket # WebSocket server status
   ```

4. **Operational Checks**
   ```
   GET /health/live      # Liveness probe
   GET /health/ready     # Readiness probe
   GET /health/metrics   # Performance metrics
   ```

### Monitoring Features

- **Request Tracking**: Automatic request metrics collection
- **Error Tracking**: Structured error logging
- **Performance Metrics**: Response times, memory usage, CPU
- **Service Health**: Database, Redis, WebSocket status monitoring

## WebSocket Configuration

### Connection Details
- **Protocol**: WSS (WebSocket Secure)
- **Authentication**: JWT token required
- **Events**: Chat, typing indicators, calls, notifications

### Client Connection Example
```javascript
import io from 'socket.io-client';

const socket = io('wss://your-backend-url.railway.app', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

## Database Management

### Schema Initialization
```bash
# Initialize database schema
railway run psql $DATABASE_URL -f scripts/init-railway-db.sql
```

### Migrations
```bash
# Run database migrations
railway run npm run db:migrate

# Seed initial data
railway run npm run db:seed
```

### Backup and Restore
Railway automatically handles PostgreSQL backups. To create manual backups:

```bash
# Create backup
railway run pg_dump $DATABASE_URL > backup.sql

# Restore backup
railway run psql $DATABASE_URL < backup.sql
```

## Performance Optimization

### Auto-Scaling (Railway Pro)
- **CPU Scaling**: Automatic based on load
- **Memory Scaling**: Automatic memory allocation
- **Instance Scaling**: Multiple instances for high availability

### Caching Strategy
- **Redis Cache**: API responses, user sessions
- **Response Caching**: 5-minute cache for expensive queries
- **Rate Limiting**: Redis-based rate limiting

### Database Optimization
- **Connection Pooling**: Configured in database connection
- **Query Optimization**: Indexed queries for performance
- **Read Replicas**: Consider for high-traffic scenarios

## Security Configuration

### Network Security
- **HTTPS Only**: All traffic encrypted
- **CORS Configuration**: Frontend-only access
- **Rate Limiting**: DDoS protection
- **Security Headers**: Helmet.js configuration

### Authentication Security
- **JWT Tokens**: Short-lived tokens with refresh
- **2FA Support**: Time-based OTP
- **Password Security**: Bcrypt hashing
- **Session Management**: Redis-based sessions

## Deployment Scripts

### Available Scripts
```bash
# Deploy to Railway
npm run railway:deploy

# View deployment logs
npm run railway:logs

# Check deployment status
npm run railway:status

# Environment setup
./scripts/setup-railway-env.sh

# Database setup
./scripts/setup-railway-database.sh

# Redis setup
./scripts/setup-railway-redis.sh
```

## Troubleshooting

### Common Issues

1. **Deployment Fails**
   ```bash
   # Check build logs
   railway logs --deployment

   # Verify environment variables
   railway variables
   ```

2. **Database Connection Issues**
   ```bash
   # Test database connection
   railway run psql $DATABASE_URL -c "SELECT 1;"
   ```

3. **Redis Connection Issues**
   ```bash
   # Test Redis connection
   railway run redis-cli -u $REDIS_URL ping
   ```

4. **WebSocket Connection Issues**
   - Check CORS configuration
   - Verify JWT token authentication
   - Check client connection URL

### Debug Commands
```bash
# View all logs
railway logs

# View environment variables
railway variables

# Check service status
railway status

# Connect to database
railway run psql

# Connect to Redis
railway run redis-cli
```

## Performance Monitoring

### Metrics Dashboard
Railway provides built-in metrics for:
- CPU usage
- Memory consumption
- Network traffic
- Response times
- Error rates

### Custom Metrics
Access custom application metrics:
```
GET /health/metrics
```

### Log Analysis
```bash
# View application logs
railway logs --filter "level:error"

# Export logs
railway logs --since "1h" > application.log
```

## Production Checklist

### Pre-Deployment
- [ ] Environment variables configured
- [ ] Database schema deployed
- [ ] Redis connection tested
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Health checks working

### Post-Deployment
- [ ] Health endpoints responding
- [ ] WebSocket connections working
- [ ] Database queries successful
- [ ] Redis caching functional
- [ ] Frontend integration tested
- [ ] Monitoring alerts configured

### Ongoing Maintenance
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Review security logs
- [ ] Update dependencies
- [ ] Backup verification
- [ ] Scale based on usage

## URLs and Endpoints

After successful deployment, your services will be available at:

```
Main Application: https://your-project-name.railway.app
Health Check:     https://your-project-name.railway.app/health
API Endpoints:    https://your-project-name.railway.app/api/*
WebSocket:        wss://your-project-name.railway.app
```

## Support and Resources

- [Railway Documentation](https://docs.railway.app)
- [Judge.ca GitHub Repository](https://github.com/your-repo/judge-ca)
- [Railway Discord Community](https://discord.gg/railway)

## Next Steps

1. **Configure Custom Domain** (Optional)
   ```bash
   railway domain add your-domain.com
   ```

2. **Set up SSL Certificate** (Automatic with Railway)

3. **Configure Frontend Environment**
   Update your Vercel environment variables with the new backend URL.

4. **Test WebSocket Connections**
   Use the frontend application to test real-time features.

5. **Monitor and Optimize**
   Use Railway dashboard and health endpoints to monitor performance.