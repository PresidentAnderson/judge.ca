#!/bin/bash

# Railway Environment Variables Setup Script
# This script configures all necessary environment variables for production deployment

set -e

echo "⚙️ Setting up environment variables for Railway deployment..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Please install it first."
    exit 1
fi

# Check if logged in
if ! railway whoami &> /dev/null; then
    echo "🔐 Please log in to Railway first: railway login"
    exit 1
fi

# Function to set environment variable with confirmation
set_env_var() {
    local key=$1
    local value=$2
    local description=$3
    
    echo "Setting $key: $description"
    railway variables set "$key=$value"
    echo "✅ $key set successfully"
}

# Function to generate secure random string
generate_secret() {
    openssl rand -base64 32
}

echo "🔐 Setting up security and authentication variables..."

# JWT Secret
JWT_SECRET=$(generate_secret)
set_env_var "JWT_SECRET" "$JWT_SECRET" "JWT token signing secret"

# Session Secret
SESSION_SECRET=$(generate_secret)
set_env_var "SESSION_SECRET" "$SESSION_SECRET" "Session encryption secret"

# Environment
set_env_var "NODE_ENV" "production" "Node.js environment"

echo ""
echo "🌐 Setting up application URLs and CORS..."

# Get frontend URL from user
read -p "Enter your frontend URL (e.g., https://judge-ca.vercel.app): " FRONTEND_URL
if [ ! -z "$FRONTEND_URL" ]; then
    set_env_var "FRONTEND_URL" "$FRONTEND_URL" "Frontend application URL for CORS"
fi

# Additional allowed origins
read -p "Enter additional allowed origins (comma-separated, or press Enter to skip): " ADDITIONAL_ORIGINS
if [ ! -z "$ADDITIONAL_ORIGINS" ]; then
    set_env_var "ALLOWED_ORIGINS" "$ADDITIONAL_ORIGINS" "Additional CORS origins"
fi

echo ""
echo "📊 Setting up rate limiting..."

# Rate limiting configuration
set_env_var "RATE_LIMIT_WINDOW_MS" "900000" "Rate limit window (15 minutes)"
set_env_var "RATE_LIMIT_MAX_REQUESTS" "1000" "Max requests per window for production"

echo ""
echo "💳 Setting up payment processing..."

# Stripe configuration
echo "🚨 IMPORTANT: You need to set up your Stripe keys manually for security"
echo "Run these commands separately with your actual Stripe keys:"
echo "  railway variables set STRIPE_SECRET_KEY=sk_live_..."
echo "  railway variables set STRIPE_PUBLISHABLE_KEY=pk_live_..."
echo "  railway variables set STRIPE_WEBHOOK_SECRET=whsec_..."

echo ""
echo "📧 Setting up email configuration..."

# Email configuration (using SendGrid as example)
echo "📧 Email service setup (optional - you can set these manually later):"
echo "For SendGrid:"
echo "  railway variables set SENDGRID_API_KEY=SG...."
echo "  railway variables set FROM_EMAIL=noreply@judge.ca"
echo ""
echo "For Gmail SMTP:"
echo "  railway variables set SMTP_HOST=smtp.gmail.com"
echo "  railway variables set SMTP_PORT=587"
echo "  railway variables set SMTP_USER=your-email@gmail.com"
echo "  railway variables set SMTP_PASS=your-app-password"

echo ""
echo "🔐 Setting up two-factor authentication..."

# 2FA configuration
TOTP_SECRET=$(generate_secret)
set_env_var "TOTP_SECRET" "$TOTP_SECRET" "TOTP secret for 2FA"

echo ""
echo "📱 Setting up push notifications..."

# Push notification configuration
echo "📱 Push notification setup (optional - set manually later):"
echo "For Firebase Cloud Messaging:"
echo "  railway variables set FCM_SERVER_KEY=AAAAx..."
echo "  railway variables set FCM_SENDER_ID=123456789"

echo ""
echo "🎯 Setting up analytics..."

# Analytics configuration
echo "📊 Analytics setup (optional):"
echo "  railway variables set GA_MEASUREMENT_ID=G-XXXXXXXXXX"
echo "  railway variables set MIXPANEL_TOKEN=your-mixpanel-token"

echo ""
echo "🔍 Setting up monitoring and logging..."

# Monitoring configuration
set_env_var "LOG_LEVEL" "info" "Logging level for production"
set_env_var "ENABLE_REQUEST_LOGGING" "true" "Enable request logging"

# Sentry configuration (optional)
echo "🐛 Error tracking setup (optional):"
echo "  railway variables set SENTRY_DSN=https://...@sentry.io/..."

echo ""
echo "🏥 Setting up health check configuration..."

set_env_var "HEALTH_CHECK_PATH" "/health" "Health check endpoint path"
set_env_var "HEALTH_CHECK_TIMEOUT" "30000" "Health check timeout in ms"

echo ""
echo "⚡ Setting up WebSocket configuration..."

set_env_var "WS_PING_TIMEOUT" "20000" "WebSocket ping timeout"
set_env_var "WS_PING_INTERVAL" "25000" "WebSocket ping interval"

echo ""
echo "🔄 Setting up file upload configuration..."

set_env_var "MAX_FILE_SIZE" "10485760" "Max file upload size (10MB)"
set_env_var "ALLOWED_FILE_TYPES" "jpg,jpeg,png,pdf,doc,docx" "Allowed file extensions"

# Cloud storage configuration
echo "☁️ Cloud storage setup (choose one):"
echo "For AWS S3:"
echo "  railway variables set AWS_ACCESS_KEY_ID=your-access-key"
echo "  railway variables set AWS_SECRET_ACCESS_KEY=your-secret-key"
echo "  railway variables set AWS_REGION=us-east-1"
echo "  railway variables set AWS_S3_BUCKET=your-bucket-name"
echo ""
echo "For Cloudinary:"
echo "  railway variables set CLOUDINARY_CLOUD_NAME=your-cloud-name"
echo "  railway variables set CLOUDINARY_API_KEY=your-api-key"
echo "  railway variables set CLOUDINARY_API_SECRET=your-api-secret"

echo ""
echo "🎨 Setting up frontend integration..."

# API configuration
set_env_var "API_VERSION" "v1" "API version"
set_env_var "API_PREFIX" "/api" "API route prefix"

echo ""
echo "📋 Environment variables summary:"
echo "==================================="

# Display all environment variables (excluding sensitive ones)
railway variables --json | jq -r '.[] | select(.name | test("SECRET|KEY|PASS|TOKEN") | not) | "\(.name)=\(.value)"' 2>/dev/null || echo "Unable to display variables. Use 'railway variables' to view them."

echo ""
echo "🔒 Security checklist:"
echo "======================"
echo "✅ JWT_SECRET - Set with secure random value"
echo "✅ SESSION_SECRET - Set with secure random value"
echo "✅ TOTP_SECRET - Set with secure random value"
echo "⚠️  STRIPE_SECRET_KEY - Needs to be set manually"
echo "⚠️  Database credentials - Automatically managed by Railway"
echo "⚠️  Redis credentials - Automatically managed by Railway"

echo ""
echo "📝 Create .env.example file for documentation..."

cat > .env.example << 'EOF'
# Judge.ca Backend Environment Variables
# Copy this file to .env.local for local development

# Application
NODE_ENV=development
PORT=3001
API_VERSION=v1
API_PREFIX=/api

# Frontend
FRONTEND_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Database (automatically provided by Railway)
DATABASE_URL=postgresql://username:password@host:port/database

# Redis (automatically provided by Railway)
REDIS_URL=redis://username:password@host:port

# Authentication
JWT_SECRET=your-jwt-secret-here
SESSION_SECRET=your-session-secret-here
TOTP_SECRET=your-totp-secret-here

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Stripe Payments
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email (choose one)
# SendGrid
SENDGRID_API_KEY=SG.your-sendgrid-key
FROM_EMAIL=noreply@judge.ca

# SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Push Notifications
FCM_SERVER_KEY=your-fcm-server-key
FCM_SENDER_ID=your-fcm-sender-id

# File Upload
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=jpg,jpeg,png,pdf,doc,docx

# Cloud Storage (choose one)
# AWS S3
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Monitoring
LOG_LEVEL=debug
ENABLE_REQUEST_LOGGING=true
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# Analytics
GA_MEASUREMENT_ID=G-XXXXXXXXXX
MIXPANEL_TOKEN=your-mixpanel-token

# Health Check
HEALTH_CHECK_PATH=/health
HEALTH_CHECK_TIMEOUT=30000

# WebSocket
WS_PING_TIMEOUT=20000
WS_PING_INTERVAL=25000
EOF

echo "📁 Environment example file created: .env.example"

echo ""
echo "✅ Railway environment setup complete!"
echo ""
echo "🔗 Next steps:"
echo "1. Set your Stripe keys: railway variables set STRIPE_SECRET_KEY=sk_live_..."
echo "2. Configure email service (SendGrid/SMTP)"
echo "3. Set up cloud storage (AWS S3/Cloudinary)"
echo "4. Configure monitoring (Sentry)"
echo "5. Deploy your application: railway up"
echo ""
echo "💡 View all variables: railway variables"
echo "🔧 Edit a variable: railway variables set KEY=value"
echo "🗑️  Delete a variable: railway variables delete KEY"