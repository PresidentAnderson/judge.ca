#!/bin/bash

# Vercel Deployment Script for judge.ca
echo "🚀 Starting Vercel deployment for judge.ca..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}⚠️  Vercel CLI is not installed. Installing now...${NC}"
    npm install -g vercel
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Please run this script from the project root.${NC}"
    exit 1
fi

echo -e "${BLUE}📝 Pre-deployment checklist:${NC}"
echo "  1. Ensure all environment variables are set in Vercel dashboard"
echo "  2. Database connection string is configured"
echo "  3. Stripe keys are added"
echo "  4. Redis URL is configured"
echo ""

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm install

# Run build to check for errors
echo -e "${YELLOW}🔨 Running build to check for errors...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed. Please fix the errors before deploying.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build successful!${NC}"

# Deploy to Vercel
echo -e "${YELLOW}🚀 Deploying to Vercel...${NC}"
echo ""
echo "Choose deployment type:"
echo "1) Production deployment"
echo "2) Preview deployment"
read -p "Enter choice (1 or 2): " DEPLOY_TYPE

if [ "$DEPLOY_TYPE" = "1" ]; then
    echo -e "${YELLOW}🚀 Deploying to production...${NC}"
    vercel --prod
else
    echo -e "${YELLOW}🚀 Creating preview deployment...${NC}"
    vercel
fi

# Get deployment URL
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo -e "${BLUE}📋 Post-deployment steps:${NC}"
echo "  1. Test the live site thoroughly"
echo "  2. Check all API endpoints are working"
echo "  3. Verify WebSocket connections"
echo "  4. Test payment processing in test mode"
echo "  5. Check mobile responsiveness"
echo "  6. Test PWA installation"
echo ""
echo -e "${YELLOW}🔧 Environment variables to configure in Vercel:${NC}"
echo "  - DATABASE_URL (PostgreSQL connection string)"
echo "  - REDIS_URL (Redis connection string)"
echo "  - JWT_SECRET (Strong secret key)"
echo "  - STRIPE_SECRET_KEY (Stripe secret key)"
echo "  - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (Stripe publishable key)"
echo "  - NEXT_PUBLIC_WEBSOCKET_URL (WebSocket server URL)"
echo "  - SENDGRID_API_KEY (For email notifications)"
echo "  - TWILIO_ACCOUNT_SID (For SMS notifications)"
echo "  - TWILIO_AUTH_TOKEN (Twilio auth token)"
echo ""
echo -e "${GREEN}🎉 Deployment script complete!${NC}"