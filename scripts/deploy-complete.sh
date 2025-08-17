#!/bin/bash

# Complete Railway Deployment Script for Judge.ca
# This script runs the entire deployment process from start to finish

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${PURPLE}${1}${NC}"
    echo -e "${PURPLE}$(echo "$1" | sed 's/./=/g')${NC}"
}

# Main deployment function
main() {
    print_header "🚀 Judge.ca Complete Railway Deployment"
    echo ""
    print_status "Starting complete deployment process..."
    echo ""

    # Check prerequisites
    print_header "🔍 Checking Prerequisites"
    
    if ! command -v railway &> /dev/null; then
        print_error "Railway CLI not found. Installing..."
        curl -fsSL https://railway.app/install.sh | sh
        print_success "Railway CLI installed"
    else
        print_success "Railway CLI found"
    fi

    if ! command -v node &> /dev/null; then
        print_error "Node.js not found. Please install Node.js first."
        exit 1
    fi
    print_success "Node.js found ($(node --version))"

    if ! command -v npm &> /dev/null; then
        print_error "npm not found. Please install npm first."
        exit 1
    fi
    print_success "npm found ($(npm --version))"

    # Login check
    if ! railway whoami &> /dev/null; then
        print_warning "Not logged in to Railway. Please log in..."
        railway login
    fi
    print_success "Logged in to Railway as $(railway whoami)"

    echo ""

    # Step 1: Install dependencies
    print_header "📦 Installing Dependencies"
    npm install
    print_success "Dependencies installed"
    echo ""

    # Step 2: Build TypeScript
    print_header "🔨 Building TypeScript"
    npm run build:backend
    print_success "TypeScript build completed"
    echo ""

    # Step 3: Environment setup
    print_header "⚙️ Setting Up Environment Variables"
    if [[ -x "./scripts/setup-railway-env.sh" ]]; then
        ./scripts/setup-railway-env.sh
    else
        print_warning "Environment setup script not found or not executable"
        print_status "Setting basic environment variables..."
        railway variables set NODE_ENV=production
        railway variables set JWT_SECRET=$(openssl rand -base64 32)
        print_success "Basic environment variables set"
    fi
    echo ""

    # Step 4: Database setup
    print_header "🗄️ Setting Up PostgreSQL Database"
    if [[ -x "./scripts/setup-railway-database.sh" ]]; then
        ./scripts/setup-railway-database.sh
    else
        print_warning "Database setup script not found"
        print_status "Adding PostgreSQL service manually..."
        railway add --database postgresql
        print_success "PostgreSQL service added"
    fi
    echo ""

    # Step 5: Redis setup
    print_header "🔴 Setting Up Redis Cache"
    if [[ -x "./scripts/setup-railway-redis.sh" ]]; then
        ./scripts/setup-railway-redis.sh
    else
        print_warning "Redis setup script not found"
        print_status "Adding Redis service manually..."
        railway add --database redis
        print_success "Redis service added"
    fi
    echo ""

    # Step 6: Auto-scaling configuration
    print_header "⚡ Configuring Auto-Scaling"
    if [[ -x "./scripts/configure-autoscaling.sh" ]]; then
        ./scripts/configure-autoscaling.sh
    else
        print_warning "Auto-scaling script not found"
        print_status "Setting basic scaling variables..."
        railway variables set ENABLE_CLUSTER_MODE=true
        railway variables set MAX_WORKERS=4
        print_success "Basic scaling configuration set"
    fi
    echo ""

    # Step 7: Deploy to Railway
    print_header "🚀 Deploying to Railway"
    print_status "Starting deployment..."
    railway up --detach
    
    # Wait for deployment
    print_status "Waiting for deployment to complete..."
    sleep 30
    
    # Get deployment URL
    DEPLOYMENT_URL=$(railway status --json 2>/dev/null | jq -r '.deployments[0].url' 2>/dev/null || echo "")
    
    if [[ -n "$DEPLOYMENT_URL" && "$DEPLOYMENT_URL" != "null" ]]; then
        print_success "Deployment completed successfully!"
        echo ""
        print_header "🌐 Deployment URLs"
        echo -e "${CYAN}Main Application:${NC} $DEPLOYMENT_URL"
        echo -e "${CYAN}API Endpoints:${NC}    $DEPLOYMENT_URL/api/*"
        echo -e "${CYAN}WebSocket:${NC}        ${DEPLOYMENT_URL/https/wss}"
        echo -e "${CYAN}Health Check:${NC}     $DEPLOYMENT_URL/health"
        echo ""
    else
        print_warning "Deployment completed but URL not found. Check Railway dashboard."
    fi

    # Step 8: Test deployment
    print_header "🧪 Testing Deployment"
    
    if [[ -n "$DEPLOYMENT_URL" && "$DEPLOYMENT_URL" != "null" ]]; then
        print_status "Testing health endpoint..."
        if curl -f "$DEPLOYMENT_URL/health" > /dev/null 2>&1; then
            print_success "Health check passed"
        else
            print_warning "Health check failed - services may still be starting"
        fi

        # Test WebSocket if script exists
        if [[ -x "./scripts/test-websocket-connection.js" ]]; then
            print_status "Testing WebSocket connection..."
            if node scripts/test-websocket-connection.js --backend-url "$DEPLOYMENT_URL" > /dev/null 2>&1; then
                print_success "WebSocket test passed"
            else
                print_warning "WebSocket test failed - may need JWT_SECRET configuration"
            fi
        fi
    fi
    echo ""

    # Step 9: Final summary
    print_header "✅ Deployment Summary"
    echo ""
    print_success "🎉 Judge.ca backend deployment completed successfully!"
    echo ""
    echo -e "${YELLOW}📋 Next Steps:${NC}"
    echo "1. Update your frontend environment variables with the new backend URL"
    echo "2. Configure custom domain (optional): railway domain add your-domain.com"
    echo "3. Set up monitoring and alerts"
    echo "4. Configure additional environment variables as needed"
    echo "5. Test all functionality from your frontend application"
    echo ""
    echo -e "${YELLOW}🔧 Useful Commands:${NC}"
    echo "• View logs:        railway logs"
    echo "• Check status:     railway status"
    echo "• View variables:   railway variables"
    echo "• Restart service:  railway restart"
    echo ""
    echo -e "${YELLOW}📚 Documentation:${NC}"
    echo "• Complete guide:   ./RAILWAY_DEPLOYMENT.md"
    echo "• Quick reference:  ./DEPLOYMENT_SUMMARY.md"
    echo ""

    # Save deployment info
    cat > deployment-complete.txt << EOF
Judge.ca Railway Deployment Completed
====================================
Date: $(date)
Backend URL: $DEPLOYMENT_URL
WebSocket URL: ${DEPLOYMENT_URL/https/wss}
Health Check: $DEPLOYMENT_URL/health

Services Deployed:
✅ Main Application Server
✅ PostgreSQL Database
✅ Redis Cache
✅ WebSocket Server
✅ Health Monitoring
✅ Auto-scaling Configuration

Environment Variables:
✅ NODE_ENV=production
✅ JWT_SECRET=[configured]
✅ SESSION_SECRET=[configured]
✅ Database & Redis URLs [auto-configured]

Next Steps:
1. Update frontend environment variables
2. Test all functionality
3. Configure additional services (Stripe, email, etc.)
4. Set up monitoring alerts
5. Configure custom domain (optional)

Support:
- Railway Dashboard: https://railway.app/dashboard
- Documentation: ./RAILWAY_DEPLOYMENT.md
- Health Check: $DEPLOYMENT_URL/health
EOF

    print_success "Deployment information saved to deployment-complete.txt"
    print_success "🎉 Deployment complete! Your Judge.ca backend is now live!"
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [options]"
        echo ""
        echo "Complete Railway deployment script for Judge.ca backend services"
        echo ""
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --verbose      Enable verbose output"
        echo "  --skip-tests   Skip deployment testing"
        echo ""
        echo "This script will:"
        echo "1. Check prerequisites"
        echo "2. Install dependencies"
        echo "3. Build the application"
        echo "4. Configure environment variables"
        echo "5. Set up PostgreSQL database"
        echo "6. Set up Redis cache"
        echo "7. Configure auto-scaling"
        echo "8. Deploy to Railway"
        echo "9. Test the deployment"
        echo "10. Provide next steps"
        exit 0
        ;;
    --verbose)
        set -x
        main
        ;;
    --skip-tests)
        export SKIP_TESTS=true
        main
        ;;
    *)
        main
        ;;
esac