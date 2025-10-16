# WisdomOS Web Deployment Guide

[![Deployment](https://img.shields.io/badge/Deployment-Production%20Ready-green.svg)](https://github.com/your-org/wisdomos-web)
[![Netlify Status](https://img.shields.io/badge/Netlify-Deployed-success.svg)](https://netlify.com)
[![Uptime](https://img.shields.io/badge/Uptime-99.9%25-brightgreen.svg)](https://status.example.com)

This guide provides comprehensive instructions for deploying WisdomOS Web to production and staging environments. The application is optimized for deployment on Netlify with Neon PostgreSQL and Stack Auth.

## Table of Contents

- [Deployment Overview](#deployment-overview)
- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Netlify Deployment](#netlify-deployment)
- [Database Setup](#database-setup)
- [Authentication Setup](#authentication-setup)
- [CI/CD Pipeline](#cicd-pipeline)
- [Domain Configuration](#domain-configuration)
- [SSL/TLS Setup](#ssltls-setup)
- [Performance Optimization](#performance-optimization)
- [Monitoring Setup](#monitoring-setup)
- [Backup Strategy](#backup-strategy)
- [Rollback Procedures](#rollback-procedures)
- [Troubleshooting](#troubleshooting)

## Deployment Overview

### Architecture Components

```
┌─────────────────────────────────────────────────────────────────┐
│                     Production Architecture                      │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────┐     │
│  │   Netlify   │    │    Neon     │    │   Stack Auth    │     │
│  │   Hosting   │◄──►│ PostgreSQL  │    │   Identity      │     │
│  │   + CDN     │    │  Database   │    │   Provider      │     │
│  └─────────────┘    └─────────────┘    └─────────────────┘     │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────┐     │
│  │   GitHub    │    │  GitHub     │    │   Netlify       │     │
│  │ Repository  │───►│ Actions CI  │───►│   Functions     │     │
│  │  (Source)   │    │  (Build)    │    │ (API Routes)    │     │
│  └─────────────┘    └─────────────┘    └─────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

### Deployment Flow

1. **Code Push** → GitHub Repository
2. **CI Pipeline** → GitHub Actions (build, test, lint)
3. **Build Process** → Next.js production build
4. **Deploy** → Netlify hosting + edge functions
5. **Health Check** → Automated verification
6. **DNS Update** → Live traffic routing

---

## Prerequisites

### Required Accounts

- **GitHub Account**: For code repository and CI/CD
- **Netlify Account**: For hosting and deployment
- **Neon Account**: For PostgreSQL database
- **Stack Auth Account**: For authentication services
- **Domain Registrar**: For custom domain (optional)

### Required Tools

- **Node.js**: 18.17.0 or higher
- **npm**: 9.0.0 or higher
- **Git**: Latest version
- **Netlify CLI**: `npm install -g netlify-cli`

### Development Environment

```bash
# Verify Node.js version
node --version  # Should be >= 18.17.0

# Verify npm version
npm --version   # Should be >= 9.0.0

# Install Netlify CLI
npm install -g netlify-cli
nlx --version
```

---

## Environment Configuration

### Environment Variables

Create environment-specific configuration:

#### Production Variables

```bash
# Database Configuration
DATABASE_URL="postgresql://neondb_owner:npg_3XKAgdRLH1wJ@ep-sparkling-bonus-ado5a0kw-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Stack Auth Configuration  
NEXT_PUBLIC_STACK_PROJECT_ID="50eed0aa-f4c3-4969-b860-edf1450499b6"
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY="pck_7bmwjjzhwn9jb86g12vy2j242r3q9kn80ze50w81xbgmg"
STACK_SECRET_SERVER_KEY="ssk_rs7mgvqq6cm98nrs7v544t6kx2s1p8yj2bv61rz886f78"

# Neon Data API (Optional - for direct API access)
NEON_API_ENDPOINT="https://ep-sparkling-bonus-ado5a0kw.apirest.c-2.us-east-1.aws.neon.tech/neondb/rest/v1"
NEON_API_KEY="your-production-neon-api-key"

# JWT Configuration
JWT_SECRET="super-secure-production-jwt-secret-key-256-bits-minimum"

# Application Configuration
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://your-domain.com"
NEXT_PUBLIC_APP_NAME="WisdomOS Web"

# Optional: Analytics and Monitoring
NEXT_PUBLIC_ANALYTICS_ID="your-analytics-id"
SENTRY_DSN="your-sentry-dsn"
```

#### Staging Variables

```bash
# Database Configuration (staging branch)
DATABASE_URL="postgresql://username:password@ep-staging-branch.us-east-2.aws.neon.tech/neondb"
NEON_API_ENDPOINT="https://ep-staging-branch.apirest.c-2.us-east-2.aws.neon.tech/neondb/rest/v1"
NEON_API_KEY="your-staging-neon-api-key"

# Stack Auth (same project, different environment)
STACK_AUTH_PROJECT_ID="098f28b2-c387-4e71-8dab-bc81b9643abd"
STACK_AUTH_JWKS_URL="https://api.stack-auth.com/api/v1/projects/098f28b2-c387-4e71-8dab-bc81b9643abd/.well-known/jwks.json"

# JWT Configuration (different secret)
JWT_SECRET="staging-jwt-secret-different-from-production"

# Application Configuration
NODE_ENV="staging"
NEXT_PUBLIC_APP_URL="https://staging-your-domain.netlify.app"
NEXT_PUBLIC_APP_NAME="WisdomOS Web (Staging)"
```

### Environment Variable Security

**Best Practices**:
- Use different secrets for each environment
- Rotate secrets regularly (quarterly)
- Never commit secrets to version control
- Use environment-specific API keys
- Monitor secret access and usage

---

## Netlify Deployment

### Initial Setup

#### 1. Connect Repository

```bash
# Login to Netlify
netlify login

# Link repository (from project root)
netlify init

# Or deploy from command line
netlify deploy --prod
```

#### 2. Configure Build Settings

**Netlify Configuration** (`netlify.toml`):

```toml
[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "18.17.0"
  NPM_VERSION = "9.0.0"
  NETLIFY_USE_YARN = "false"

# Redirects for SPA routing
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

# API routes to Netlify Functions
[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

# Headers for security
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "origin-when-cross-origin"
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;"

# Cache static assets
[[headers]]
  for = "/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

# Environment-specific builds
[context.production]
  command = "npm run build"
  
[context.deploy-preview]
  command = "npm run build"
  
[context.branch-deploy]
  command = "npm run build"
```

#### 3. Set Environment Variables

**Via Netlify Dashboard**:
1. Go to Site Settings → Environment Variables
2. Add all production environment variables
3. Set different values for deploy previews if needed

**Via Netlify CLI**:
```bash
# Set production environment variables
netlify env:set DATABASE_URL "your-production-database-url"
netlify env:set NEON_API_KEY "your-production-api-key"
netlify env:set JWT_SECRET "your-production-jwt-secret"

# List all environment variables
netlify env:list
```

### Build Configuration

#### Package.json Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:ci": "jest --ci --coverage --watchAll=false",
    "build:analyze": "ANALYZE=true next build",
    "prebuild": "npm run type-check && npm run lint",
    "postbuild": "npm run test:ci"
  }
}
```

#### Next.js Configuration

**next.config.js**:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static optimization
  output: 'standalone',
  
  // Optimize images
  images: {
    domains: [
      'your-domain.com',
      'avatars.stackauth.com',
    ],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Headers for security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
  
  // Rewrites for API routes
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/.netlify/functions/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
```

### Deployment Process

#### Manual Deployment

```bash
# Build locally (optional, for testing)
npm run build

# Deploy to staging
netlify deploy

# Deploy to production
netlify deploy --prod

# Deploy with specific directory
netlify deploy --dir=.next --prod
```

#### Automated Deployment

**GitHub Integration**:
1. Connect GitHub repository in Netlify dashboard
2. Configure auto-deploy on push to main branch
3. Set up deploy previews for pull requests
4. Configure branch deploys for feature branches

---

## Database Setup

### Neon Database Configuration

#### 1. Create Production Database

```bash
# Using Neon CLI (if available)
neonctl projects create --name wisdomos-production
neonctl databases create --project-id your-project-id --name wisdomos

# Or use Neon Console:
# 1. Go to https://neon.tech/console
# 2. Create new project: "WisdomOS Production"
# 3. Note connection details
```

#### 2. Set Up Database Schema

```sql
-- Connect to production database
-- Run schema creation script

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables (see architecture.md for complete schema)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  timezone VARCHAR(50) DEFAULT 'UTC',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Continue with other tables...
-- (See docs/architecture.md for complete schema)

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_journal_entries_user_id ON journal_entries(user_id);
-- Continue with other indexes...

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
-- Continue with other tables...

-- Create RLS policies
CREATE POLICY user_own_data ON users FOR ALL USING (id = auth.uid());
-- Continue with other policies...
```

#### 3. Configure Database Branching

```bash
# Create staging branch
neonctl branches create --project-id your-project-id --name staging

# Create feature branches as needed
neonctl branches create --project-id your-project-id --name feature/new-analytics
```

### Database Migration Strategy

#### Migration Scripts

```bash
# Create migrations directory
mkdir -p migrations

# Example migration script
# migrations/001_initial_schema.sql
CREATE TABLE IF NOT EXISTS users (
  -- table definition
);

# migrations/002_add_habits_table.sql
CREATE TABLE IF NOT EXISTS habits (
  -- table definition
);
```

#### Deployment Migrations

```bash
# Run migrations on deployment
# Add to package.json scripts
{
  "scripts": {
    "migrate": "node scripts/migrate.js",
    "migrate:production": "NODE_ENV=production node scripts/migrate.js"
  }
}
```

---

## Authentication Setup

### Stack Auth Configuration

#### 1. Production Project Setup

1. **Create Stack Auth Account**
   - Go to [Stack Auth Console](https://app.stack-auth.com)
   - Create new project: "WisdomOS Production"
   - Note Project ID: `098f28b2-c387-4e71-8dab-bc81b9643abd`

2. **Configure OAuth Providers** (Optional)
   ```json
   {
     "google": {
       "clientId": "your-google-client-id",
       "clientSecret": "your-google-client-secret"
     },
     "github": {
       "clientId": "your-github-client-id",
       "clientSecret": "your-github-client-secret"
     }
   }
   ```

3. **Domain Configuration**
   - Add production domain: `https://your-domain.com`
   - Add staging domain: `https://staging.your-domain.com`
   - Configure redirect URLs

#### 2. JWKS Endpoint Configuration

```typescript
// lib/auth.ts - Production configuration
const STACK_AUTH_CONFIG = {
  projectId: process.env.STACK_AUTH_PROJECT_ID,
  jwksUrl: process.env.STACK_AUTH_JWKS_URL,
  audience: 'wisdomos-web',
  issuer: 'https://api.stack-auth.com',
};

// Verify JWKS endpoint is accessible
const response = await fetch(STACK_AUTH_CONFIG.jwksUrl);
if (!response.ok) {
  throw new Error('JWKS endpoint not accessible');
}
```

---

## CI/CD Pipeline

### GitHub Actions Workflow

**`.github/workflows/deploy.yml`**:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '18.17.0'
  NPM_VERSION: '9.0.0'

jobs:
  test:
    name: Test and Lint
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run type checking
        run: npm run type-check
        
      - name: Run linting
        run: npm run lint
        
      - name: Run tests
        run: npm run test:ci
        
      - name: Build application
        run: npm run build
        env:
          NODE_ENV: production
          
  deploy:
    name: Deploy to Netlify
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build for production
        run: npm run build
        env:
          NODE_ENV: production
          
      - name: Deploy to Netlify
        uses: nwtgck/actions-netlify@v2.0
        with:
          publish-dir: '.next'
          production-branch: main
          github-token: ${{ secrets.GITHUB_TOKEN }}
          deploy-message: "Deploy from GitHub Actions"
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
          
  notify:
    name: Notify Deployment
    needs: [test, deploy]
    runs-on: ubuntu-latest
    if: always()
    
    steps:
      - name: Notify success
        if: needs.deploy.result == 'success'
        run: |
          echo "Deployment successful!"
          # Add Slack/Discord notification here
          
      - name: Notify failure
        if: needs.deploy.result == 'failure'
        run: |
          echo "Deployment failed!"
          # Add error notification here
```

### Branch-based Deployments

```yaml
# .github/workflows/preview.yml
name: Deploy Preview

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  preview:
    name: Deploy Preview
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18.17.0'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build application
        run: npm run build
        env:
          NODE_ENV: staging
          
      - name: Deploy preview
        uses: nwtgck/actions-netlify@v2.0
        with:
          publish-dir: '.next'
          github-token: ${{ secrets.GITHUB_TOKEN }}
          deploy-message: "Preview deploy from PR #${{ github.event.number }}"
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

### Deployment Secrets

**Required GitHub Secrets**:

```bash
# Netlify Integration
NETLIFY_AUTH_TOKEN=your-netlify-auth-token
NETLIFY_SITE_ID=your-netlify-site-id

# Database (for migration scripts)
DATABASE_URL=your-production-database-url
NEON_API_KEY=your-neon-api-key

# Authentication
STACK_AUTH_PROJECT_ID=098f28b2-c387-4e71-8dab-bc81b9643abd
JWT_SECRET=your-production-jwt-secret

# Optional: Monitoring
SENTRY_DSN=your-sentry-dsn
SLACK_WEBHOOK_URL=your-slack-webhook
```

---

## Domain Configuration

### Custom Domain Setup

#### 1. Configure DNS

```bash
# Add DNS records at your domain registrar
# Example for Cloudflare:

# CNAME record
Name: www
Content: your-netlify-site.netlify.app
Proxy: Yes (if using Cloudflare)

# A record (or ALIAS/CNAME for root domain)
Name: @
Content: 104.248.144.179 (Netlify's IP)
```

#### 2. Netlify Domain Configuration

```bash
# Add domain in Netlify dashboard
# Site Settings → Domain management → Add custom domain

# Or via CLI
netlify sites:update --name your-site-id --custom-domain your-domain.com
```

#### 3. Subdomain Configuration

```bash
# Staging subdomain
staging.your-domain.com → staging-netlify-site.netlify.app

# API subdomain (if separate)
api.your-domain.com → api-netlify-site.netlify.app

# Documentation subdomain
docs.your-domain.com → docs-netlify-site.netlify.app
```

---

## SSL/TLS Setup

### Automatic SSL (Netlify)

```bash
# Enable automatic SSL in Netlify dashboard
# Site Settings → Domain management → HTTPS
# - Force HTTPS: Yes
# - Auto-renew certificate: Yes
```

### SSL Configuration

**Netlify automatic SSL provides**:
- Let's Encrypt certificates
- Automatic renewal
- HTTP to HTTPS redirects
- HSTS headers
- TLS 1.2+ support

**Custom SSL Headers** (netlify.toml):

```toml
[[headers]]
  for = "/*"
  [headers.values]
    Strict-Transport-Security = "max-age=31536000; includeSubDomains; preload"
    X-Content-Type-Options = "nosniff"
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

---

## Performance Optimization

### Build Optimization

```javascript
// next.config.js - Production optimizations
const nextConfig = {
  // Optimize JavaScript
  swcMinify: true,
  
  // Optimize images
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 31536000,
  },
  
  // Bundle analyzer
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config) => {
      config.plugins.push(
        new (require('@next/bundle-analyzer'))({ enabled: true })
      );
      return config;
    },
  }),
  
  // Experimental features
  experimental: {
    optimizeCss: true,
    optimizeServerReact: true,
  },
};
```

### CDN Configuration

```toml
# netlify.toml - CDN optimization
[[headers]]
  for = "/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
    
[[headers]]
  for = "/_next/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
    
[[headers]]
  for = "/images/*"
  [headers.values]
    Cache-Control = "public, max-age=604800" # 1 week
```

### Performance Monitoring

```javascript
// Add performance monitoring
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

// Web Vitals reporting
export function reportWebVitals(metric) {
  if (process.env.NODE_ENV === 'production') {
    // Send to analytics service
    console.log(metric);
  }
}
```

---

## Monitoring Setup

### Health Checks

```typescript
// Add comprehensive health checks
// app/api/health/route.ts
export async function GET() {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
    environment: process.env.NODE_ENV,
    checks: {
      database: await checkDatabase(),
      auth: await checkAuth(),
      external: await checkExternalServices(),
    },
  };
  
  const isHealthy = Object.values(health.checks)
    .every(check => check.status === 'healthy');
    
  return Response.json(health, {
    status: isHealthy ? 200 : 503,
  });
}
```

### Uptime Monitoring

```bash
# Set up external monitoring
# Examples:
# - Pingdom: https://your-domain.com/api/health
# - UptimeRobot: https://your-domain.com/api/health
# - StatusCake: https://your-domain.com/api/health

# Internal monitoring
# - Netlify Analytics (built-in)
# - Sentry for error tracking
# - LogRocket for user sessions
```

---

## Backup Strategy

### Database Backups

```bash
# Neon automatic backups
# - Point-in-time recovery
# - Daily automated backups
# - 7-day retention (free tier)
# - 30-day retention (pro tier)

# Manual backup script
#!/bin/bash
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_${BACKUP_DATE}.sql"

# Export database
pg_dump $DATABASE_URL > $BACKUP_FILE

# Upload to cloud storage (optional)
# aws s3 cp $BACKUP_FILE s3://your-backup-bucket/

echo "Backup completed: $BACKUP_FILE"
```

### Application State Backup

```typescript
// User data export functionality
// app/api/export/route.ts
export async function GET(request: NextRequest) {
  const user = getUserFromHeaders(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Export all user data
  const userData = {
    profile: await UserModel.findById(user.id),
    journalEntries: await JournalModel.findByUserId(user.id),
    habits: await HabitModel.findByUserId(user.id),
    lifeAreas: await LifeAreaModel.findByUserId(user.id),
    exportDate: new Date().toISOString(),
  };
  
  return NextResponse.json({
    data: userData,
    meta: {
      format: 'WisdomOS-v1',
      version: '0.1.0',
    },
  });
}
```

---

## Rollback Procedures

### Automated Rollback

```bash
# Netlify automatic rollback
# 1. Go to Netlify dashboard
# 2. Site → Deploys
# 3. Click on previous deploy
# 4. Click "Publish deploy"

# CLI rollback
netlify api listSiteDeploys --site-id your-site-id
netlify api restoreSiteDeploy --site-id your-site-id --deploy-id previous-deploy-id
```

### Database Rollback

```bash
# Using Neon branching
neonctl branches create --project-id your-project-id --name rollback-$(date +%s)

# Point-in-time recovery
neonctl branches create \
  --project-id your-project-id \
  --name recovery-branch \
  --parent main \
  --timestamp "2024-01-01 12:00:00"
```

### Emergency Procedures

```bash
# Emergency rollback checklist
# 1. Identify issue severity
# 2. Communicate with team
# 3. Execute rollback
# 4. Verify functionality
# 5. Document incident
# 6. Post-mortem analysis

# Quick rollback script
#!/bin/bash
echo "Starting emergency rollback..."

# Get last successful deploy
LAST_DEPLOY=$(netlify api listSiteDeploys --site-id $NETLIFY_SITE_ID --json | jq -r '.[1].id')

# Rollback to last deploy
netlify api restoreSiteDeploy --site-id $NETLIFY_SITE_ID --deploy-id $LAST_DEPLOY

echo "Rollback completed to deploy: $LAST_DEPLOY"
echo "Please verify functionality at: $PRODUCTION_URL"
```

---

## Troubleshooting

### Common Deployment Issues

#### Build Failures

```bash
# Debug build locally
npm run build

# Check build logs
netlify logs --site-id your-site-id

# Common fixes:
# 1. Clear cache: rm -rf .next node_modules package-lock.json
# 2. Reinstall: npm install
# 3. Check environment variables
# 4. Verify Node.js version compatibility
```

#### Environment Variable Issues

```bash
# Verify environment variables
netlify env:list --site-id your-site-id

# Test environment variables
node -e "console.log('Database URL:', process.env.DATABASE_URL ? '✓ Set' : '✗ Missing')"

# Common issues:
# 1. Missing required variables
# 2. Incorrect variable names
# 3. Special characters in values
# 4. Different values between environments
```

#### Database Connection Issues

```bash
# Test database connection
curl -X POST "$NEON_API_ENDPOINT/query" \
  -H "Authorization: Bearer $NEON_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT 1"}'

# Common fixes:
# 1. Verify API endpoint URL
# 2. Check API key validity
# 3. Confirm database exists
# 4. Check connection limits
```

#### SSL/Domain Issues

```bash
# Check SSL certificate
curl -I https://your-domain.com

# Verify DNS propagation
dig your-domain.com
nslookup your-domain.com

# Common fixes:
# 1. Wait for DNS propagation (up to 48 hours)
# 2. Clear DNS cache
# 3. Verify CNAME records
# 4. Check SSL certificate renewal
```

### Performance Issues

```bash
# Analyze bundle size
npm run build:analyze

# Check Core Web Vitals
# Use Lighthouse or PageSpeed Insights

# Monitor runtime performance
# Check Netlify Analytics
# Monitor API response times

# Common optimizations:
# 1. Enable compression
# 2. Optimize images
# 3. Reduce JavaScript bundle size
# 4. Implement caching strategies
```

### Debugging Tools

```bash
# Netlify CLI debugging
netlify dev --debug

# Check function logs
netlify functions:list
netlify functions:invoke function-name

# Network debugging
curl -v https://your-domain.com/api/health

# Database debugging
psql $DATABASE_URL -c "SELECT version();"
```

---

## Security Checklist

### Pre-Deployment Security

- [ ] Environment variables secured and rotated
- [ ] Database access restricted (RLS policies)
- [ ] HTTPS enforced everywhere
- [ ] Security headers configured
- [ ] Authentication endpoints tested
- [ ] Input validation implemented
- [ ] Rate limiting configured (future)
- [ ] Error messages don't leak sensitive data

### Post-Deployment Verification

```bash
# Security scan checklist
# 1. SSL Labs test: https://www.ssllabs.com/ssltest/
# 2. Security Headers: https://securityheaders.com/
# 3. Observatory: https://observatory.mozilla.org/

# Manual verification
curl -I https://your-domain.com | grep -E "(Strict-Transport-Security|X-Frame-Options|X-Content-Type-Options)"

# Authentication test
curl -X GET https://your-domain.com/api/journal \
  -H "Authorization: Bearer invalid-token"
# Should return 401 Unauthorized
```

---

## Maintenance Procedures

### Regular Maintenance Tasks

#### Weekly
- [ ] Check deployment status
- [ ] Review error logs
- [ ] Monitor performance metrics
- [ ] Verify backup completion

#### Monthly
- [ ] Update dependencies
- [ ] Rotate secrets (quarterly)
- [ ] Review security headers
- [ ] Analyze performance trends
- [ ] Test disaster recovery procedures

#### Quarterly
- [ ] Security audit
- [ ] Performance optimization review
- [ ] Backup strategy review
- [ ] Disaster recovery testing
- [ ] Documentation updates

### Maintenance Scripts

```bash
#!/bin/bash
# maintenance.sh - Monthly maintenance script

echo "Starting monthly maintenance..."

# Update dependencies
npm update
npm audit fix

# Run security scan
npm audit

# Check for outdated packages
npm outdated

# Performance test
npm run build:analyze

# Health check
curl -f https://your-domain.com/api/health || echo "Health check failed!"

echo "Maintenance completed."
```

---

**Last Updated**: October 2024  
**Deployment Guide Version**: 1.0.0  
**Target Environment**: Production

For deployment support or questions, please [open an issue](https://github.com/your-org/wisdomos-web/issues/new) or contact the DevOps team.