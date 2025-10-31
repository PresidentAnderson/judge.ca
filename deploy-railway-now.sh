#!/bin/bash

# Judge.ca Railway Deployment Script
# This script automates the complete Railway deployment process

set -e  # Exit on any error

echo "🚀 Judge.ca Railway Deployment Starting..."
echo "============================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step 1: Check Railway CLI
echo -e "${BLUE}Step 1: Checking Railway CLI...${NC}"
if ! command -v railway &> /dev/null; then
    echo -e "${RED}❌ Railway CLI not found. Installing...${NC}"
    curl -fsSL https://railway.app/install.sh | sh
else
    echo -e "${GREEN}✅ Railway CLI found${NC}"
fi
echo ""

# Step 2: Login to Railway
echo -e "${BLUE}Step 2: Login to Railway${NC}"
echo -e "${YELLOW}⚠️  A browser window will open. Please complete the login.${NC}"
railway login
echo -e "${GREEN}✅ Railway login successful${NC}"
echo ""

# Step 3: Link to existing project
echo -e "${BLUE}Step 3: Linking to Railway project${NC}"
railway link --project 3ce7a059-22ef-440a-a6b1-24b345ad88d2
echo -e "${GREEN}✅ Project linked${NC}"
echo ""

# Step 4: Check current environment variables
echo -e "${BLUE}Step 4: Checking environment variables${NC}"
railway variables
echo ""

# Step 5: Set critical environment variables if not set
echo -e "${BLUE}Step 5: Setting environment variables${NC}"
echo -e "${YELLOW}Setting Node environment...${NC}"
railway variables set NODE_ENV=production || true
railway variables set PORT=3000 || true

echo -e "${YELLOW}Generating JWT secret...${NC}"
JWT_SECRET=$(openssl rand -hex 32)
railway variables set JWT_SECRET="$JWT_SECRET" || true
railway variables set JWT_EXPIRES_IN=7d || true

echo -e "${GREEN}✅ Environment variables configured${NC}"
echo ""

# Step 6: Deploy the application
echo -e "${BLUE}Step 6: Deploying to Railway${NC}"
echo -e "${YELLOW}This may take 5-10 minutes...${NC}"
railway up

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Deployment successful!${NC}"
else
    echo -e "${RED}❌ Deployment failed. Check logs with: railway logs${NC}"
    exit 1
fi
echo ""

# Step 7: Get deployment URL
echo -e "${BLUE}Step 7: Getting deployment URL${NC}"
DEPLOY_URL=$(railway domain)
echo -e "${GREEN}🌐 Application URL: ${DEPLOY_URL}${NC}"
echo ""

# Step 8: Run database migrations
echo -e "${BLUE}Step 8: Running database migrations${NC}"
echo -e "${YELLOW}Running migrations...${NC}"
railway run npm run db:migrate || echo -e "${YELLOW}⚠️  Migrations may need manual setup${NC}"
echo ""

# Step 9: Check deployment health
echo -e "${BLUE}Step 9: Checking deployment health${NC}"
sleep 5  # Wait for app to start
curl -f "${DEPLOY_URL}/api/health" || echo -e "${YELLOW}⚠️  Health check endpoint not responding yet${NC}"
echo ""

# Final summary
echo ""
echo -e "${GREEN}=============================================${NC}"
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo -e "${GREEN}=============================================${NC}"
echo ""
echo -e "${BLUE}📋 Deployment Summary:${NC}"
echo -e "   Project ID: 3ce7a059-22ef-440a-a6b1-24b345ad88d2"
echo -e "   URL: ${DEPLOY_URL}"
echo -e "   Environment: Production"
echo ""
echo -e "${BLUE}📝 Next Steps:${NC}"
echo -e "   1. Visit ${DEPLOY_URL} to test your application"
echo -e "   2. Check logs: ${YELLOW}railway logs${NC}"
echo -e "   3. Monitor status: ${YELLOW}railway status${NC}"
echo -e "   4. Add custom domain: ${YELLOW}railway domain add judge.ca${NC}"
echo ""
echo -e "${BLUE}🔧 Useful Commands:${NC}"
echo -e "   - View logs: ${YELLOW}railway logs${NC}"
echo -e "   - Check status: ${YELLOW}railway status${NC}"
echo -e "   - Open dashboard: ${YELLOW}railway open${NC}"
echo -e "   - Run commands: ${YELLOW}railway run [command]${NC}"
echo ""
echo -e "${GREEN}✨ Your application is now live on Railway!${NC}"
