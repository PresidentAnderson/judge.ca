#!/bin/bash

# Vercel Environment Variables Setup Script
echo "🔧 Setting up Vercel environment variables..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Read from .env.local if it exists
if [ -f ".env.local" ]; then
    echo -e "${YELLOW}📝 Found .env.local file. Using values for Vercel...${NC}"
    
    # Set environment variables for all environments
    while IFS='=' read -r key value; do
        # Skip comments and empty lines
        if [[ ! "$key" =~ ^# ]] && [[ -n "$key" ]]; then
            # Remove quotes from value
            value="${value%\"}"
            value="${value#\"}"
            
            echo -e "${BLUE}Setting ${key}...${NC}"
            
            # Add to production
            vercel env add "$key" production <<< "$value" 2>/dev/null || echo "  (already exists or skipped)"
            
            # Add to preview
            vercel env add "$key" preview <<< "$value" 2>/dev/null || echo "  (already exists or skipped)"
            
            # Add to development
            vercel env add "$key" development <<< "$value" 2>/dev/null || echo "  (already exists or skipped)"
        fi
    done < .env.local
    
    echo -e "${GREEN}✅ Environment variables configured!${NC}"
else
    echo -e "${YELLOW}⚠️  No .env.local file found. Creating default environment variables...${NC}"
    
    # Set default environment variables
    vercel env add DATABASE_URL production <<< "postgresql://postgres:postgres@db.example.com:5432/judgedb"
    vercel env add JWT_SECRET production <<< "judge-ca-jwt-secret-2025-change-in-production"
    vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production <<< "pk_test_default"
    vercel env add STRIPE_SECRET_KEY production <<< "sk_test_default"
    vercel env add NEXT_PUBLIC_WEBSOCKET_URL production <<< "wss://judge-ca-ws.vercel.app"
    vercel env add REDIS_URL production <<< "redis://default:password@redis.example.com:6379"
    
    echo -e "${GREEN}✅ Default environment variables created!${NC}"
fi

echo ""
echo -e "${BLUE}📋 Next steps:${NC}"
echo "1. Update DATABASE_URL with your Supabase connection string"
echo "2. Update REDIS_URL with your Upstash connection string"
echo "3. Add your Stripe API keys"
echo "4. Configure other service API keys as needed"
echo ""
echo -e "${YELLOW}View your environment variables at:${NC}"
echo "https://vercel.com/axaiinovation/judge-ca/settings/environment-variables"