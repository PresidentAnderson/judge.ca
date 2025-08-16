#!/bin/bash

# Railway Deployment Script for Judge.ca Backend Services
# This script deploys the backend services to Railway.app

set -e

echo "🚀 Starting Railway deployment for Judge.ca backend services..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    curl -fsSL https://railway.app/install.sh | sh
    echo "✅ Railway CLI installed"
fi

# Check if logged in to Railway
if ! railway whoami &> /dev/null; then
    echo "🔐 Please log in to Railway..."
    railway login
fi

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build:backend

# Check if project is already linked
if [ ! -f ".railway" ]; then
    echo "🔗 Linking to Railway project..."
    
    # Try to link to existing project or create new one
    read -p "Enter your Railway project ID (or press Enter to create new): " PROJECT_ID
    
    if [ -z "$PROJECT_ID" ]; then
        echo "📝 Creating new Railway project..."
        railway login
        railway init
    else
        echo "🔗 Linking to existing project: $PROJECT_ID"
        railway link $PROJECT_ID
    fi
fi

# Set environment variables
echo "⚙️ Setting up environment variables..."

# Database URL will be automatically provided by Railway PostgreSQL service
railway variables set NODE_ENV=production
railway variables set JWT_SECRET=$(openssl rand -base64 32)
railway variables set RATE_LIMIT_WINDOW_MS=900000
railway variables set RATE_LIMIT_MAX_REQUESTS=1000

# Frontend URL - update this with your actual Vercel URL
read -p "Enter your frontend URL (e.g., https://judge-ca.vercel.app): " FRONTEND_URL
if [ ! -z "$FRONTEND_URL" ]; then
    railway variables set FRONTEND_URL=$FRONTEND_URL
fi

# Deploy to Railway
echo "🚀 Deploying to Railway..."
railway up --detach

# Wait for deployment
echo "⏳ Waiting for deployment to complete..."
sleep 30

# Get deployment URL
RAILWAY_URL=$(railway status --json | jq -r '.deployments[0].url' 2>/dev/null || echo "")

if [ ! -z "$RAILWAY_URL" ] && [ "$RAILWAY_URL" != "null" ]; then
    echo "✅ Deployment successful!"
    echo "🌐 Backend URL: $RAILWAY_URL"
    echo "🔗 WebSocket URL: ${RAILWAY_URL/https/wss}"
    echo "❤️ Health Check: $RAILWAY_URL/health"
    
    # Test health endpoint
    echo "🏥 Testing health endpoint..."
    if curl -f "$RAILWAY_URL/health" > /dev/null 2>&1; then
        echo "✅ Health check passed"
    else
        echo "❌ Health check failed"
    fi
else
    echo "⚠️ Deployment completed but URL not found. Check Railway dashboard."
fi

# Display useful commands
echo ""
echo "📋 Useful Railway commands:"
echo "  railway logs         - View deployment logs"
echo "  railway status       - Check deployment status"
echo "  railway open         - Open project in browser"
echo "  railway variables    - Manage environment variables"
echo "  railway restart      - Restart the service"
echo ""

# Save deployment info
cat > deployment-info.txt << EOF
Judge.ca Railway Deployment
==========================
Deployed: $(date)
Backend URL: $RAILWAY_URL
WebSocket URL: ${RAILWAY_URL/https/wss}
Health Check: $RAILWAY_URL/health

Environment Variables Set:
- NODE_ENV=production
- JWT_SECRET=[hidden]
- RATE_LIMIT_WINDOW_MS=900000
- RATE_LIMIT_MAX_REQUESTS=1000
- FRONTEND_URL=$FRONTEND_URL

Next Steps:
1. Set up PostgreSQL database service in Railway
2. Set up Redis service in Railway
3. Update frontend environment variables with new backend URL
4. Test WebSocket connections
5. Configure custom domain (optional)
EOF

echo "💾 Deployment info saved to deployment-info.txt"
echo "🎉 Railway deployment complete!"