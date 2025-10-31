#!/bin/bash

# Railway Webhook Setup Script
# Sets up automated deployments via GitHub Actions

set -e

echo "🪝 Railway Webhook Setup"
echo "======================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${YELLOW}⚠️  GitHub CLI not found. Installing...${NC}"
    brew install gh || echo -e "${RED}Please install GitHub CLI: https://cli.github.com${NC}"
fi

# Step 1: Get Railway Token
echo -e "${BLUE}Step 1: Get Railway API Token${NC}"
echo -e "${YELLOW}Please follow these steps:${NC}"
echo "  1. Go to: https://railway.app/account/tokens"
echo "  2. Click 'Create Token'"
echo "  3. Name it: 'GitHub Actions Deploy'"
echo "  4. Copy the token"
echo ""
read -p "Press Enter when you have your Railway token ready..."
echo ""

read -sp "Paste your Railway token: " RAILWAY_TOKEN
echo ""
echo -e "${GREEN}✅ Token received${NC}"
echo ""

# Step 2: Add token to GitHub Secrets
echo -e "${BLUE}Step 2: Adding token to GitHub Secrets${NC}"

# Check if gh is authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${YELLOW}Authenticating with GitHub...${NC}"
    gh auth login
fi

# Add secret
echo -e "${YELLOW}Adding RAILWAY_TOKEN to GitHub Secrets...${NC}"
echo "$RAILWAY_TOKEN" | gh secret set RAILWAY_TOKEN

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Secret added successfully${NC}"
else
    echo -e "${RED}❌ Failed to add secret. Please add manually:${NC}"
    echo "  1. Go to: https://github.com/$(gh repo view --json nameWithOwner -q .nameWithOwner)/settings/secrets/actions"
    echo "  2. Click 'New repository secret'"
    echo "  3. Name: RAILWAY_TOKEN"
    echo "  4. Value: Your Railway token"
fi
echo ""

# Step 3: Commit and push workflow file
echo -e "${BLUE}Step 3: Committing webhook configuration${NC}"

# Check if there are changes
if git diff --quiet .github/workflows/railway-deploy.yml; then
    echo -e "${YELLOW}No changes to commit${NC}"
else
    git add .github/workflows/railway-deploy.yml
    git add WEBHOOK_SETUP_GUIDE.md
    git add setup-webhook.sh

    git commit -m "🪝 Add Railway deployment webhook

- Configure GitHub Actions for automated Railway deployments
- Add webhook setup guide and configuration
- Enable push-to-deploy functionality

Project ID: 3ce7a059-22ef-440a-a6b1-24b345ad88d2"

    echo -e "${YELLOW}Pushing to GitHub...${NC}"
    git push origin $(git branch --show-current)

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Webhook configuration pushed${NC}"
    else
        echo -e "${RED}❌ Failed to push. Please push manually${NC}"
    fi
fi
echo ""

# Step 4: Test the webhook
echo -e "${BLUE}Step 4: Testing webhook${NC}"
echo -e "${YELLOW}Triggering test deployment...${NC}"

REPO_NAME=$(gh repo view --json nameWithOwner -q .nameWithOwner)
gh workflow run railway-deploy.yml

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Workflow triggered${NC}"
    echo ""
    echo -e "${BLUE}Watch deployment progress:${NC}"
    echo "  https://github.com/$REPO_NAME/actions"
    echo ""
    echo -e "${BLUE}Or run:${NC}"
    echo "  gh run watch"
else
    echo -e "${YELLOW}⚠️  Could not trigger workflow automatically${NC}"
    echo "Please trigger manually:"
    echo "  1. Go to: https://github.com/$REPO_NAME/actions"
    echo "  2. Click 'Deploy to Railway'"
    echo "  3. Click 'Run workflow'"
fi
echo ""

# Summary
echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}🎉 Webhook Setup Complete!${NC}"
echo -e "${GREEN}=====================================${NC}"
echo ""
echo -e "${BLUE}What happens now:${NC}"
echo "  ✅ Every push to master triggers Railway deployment"
echo "  ✅ GitHub Actions builds and deploys automatically"
echo "  ✅ Deployment status shown in GitHub commit/PR"
echo ""
echo -e "${BLUE}Useful Commands:${NC}"
echo "  - View workflows: ${YELLOW}gh workflow list${NC}"
echo "  - Watch deployment: ${YELLOW}gh run watch${NC}"
echo "  - View logs: ${YELLOW}gh run view --log${NC}"
echo "  - List runs: ${YELLOW}gh run list${NC}"
echo ""
echo -e "${BLUE}Railway Dashboard:${NC}"
echo "  https://railway.app/project/3ce7a059-22ef-440a-a6b1-24b345ad88d2"
echo ""
echo -e "${BLUE}Test Deployment:${NC}"
echo "  Make any change and push:"
echo "  ${YELLOW}echo '# Test' >> README.md${NC}"
echo "  ${YELLOW}git add README.md${NC}"
echo "  ${YELLOW}git commit -m 'Test webhook'${NC}"
echo "  ${YELLOW}git push${NC}"
echo ""
echo -e "${GREEN}✨ Happy deploying!${NC}"
