#!/bin/bash

# Setup Vercel Environment Variables
echo "Setting up Vercel environment variables..."

# Database
echo "postgresql://postgres:password@db.example.com:5432/judgedb" | npx vercel env add DATABASE_URL production --force 2>/dev/null
echo "false" | npx vercel env add DATABASE_SSL production --force 2>/dev/null

# JWT/Auth
echo "judge-ca-secret-key-change-in-production-$(openssl rand -hex 32)" | npx vercel env add JWT_SECRET production --force 2>/dev/null
echo "7d" | npx vercel env add JWT_EXPIRES_IN production --force 2>/dev/null

# Email (placeholder values)
echo "smtp.gmail.com" | npx vercel env add SMTP_HOST production --force 2>/dev/null
echo "587" | npx vercel env add SMTP_PORT production --force 2>/dev/null
echo "noreply@judge.ca" | npx vercel env add SMTP_USER production --force 2>/dev/null
echo "placeholder-password" | npx vercel env add SMTP_PASS production --force 2>/dev/null

# Stripe (test keys)
echo "sk_test_placeholder" | npx vercel env add STRIPE_SECRET_KEY production --force 2>/dev/null
echo "pk_test_placeholder" | npx vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production --force 2>/dev/null
echo "whsec_placeholder" | npx vercel env add STRIPE_WEBHOOK_SECRET production --force 2>/dev/null

# Redis
echo "redis://localhost:6379" | npx vercel env add REDIS_URL production --force 2>/dev/null

# Application settings
echo "production" | npx vercel env add NODE_ENV production --force 2>/dev/null
echo "3000" | npx vercel env add PORT production --force 2>/dev/null
echo "https://judge.ca" | npx vercel env add FRONTEND_URL production --force 2>/dev/null
echo "wss://judge.ca" | npx vercel env add NEXT_PUBLIC_WEBSOCKET_URL production --force 2>/dev/null

# File upload settings
echo "10485760" | npx vercel env add MAX_FILE_SIZE production --force 2>/dev/null
echo "jpg,jpeg,png,pdf,doc,docx" | npx vercel env add ALLOWED_FILE_TYPES production --force 2>/dev/null

# Rate limiting
echo "900000" | npx vercel env add RATE_LIMIT_WINDOW_MS production --force 2>/dev/null
echo "100" | npx vercel env add RATE_LIMIT_MAX_REQUESTS production --force 2>/dev/null

# Analytics (placeholders)
echo "G-PLACEHOLDER" | npx vercel env add NEXT_PUBLIC_GA_ID production --force 2>/dev/null
echo "GTM-PLACEHOLDER" | npx vercel env add NEXT_PUBLIC_GTM_ID production --force 2>/dev/null
echo "placeholder" | npx vercel env add NEXT_PUBLIC_FB_PIXEL_ID production --force 2>/dev/null

# Sentry
echo "https://placeholder@sentry.io/placeholder" | npx vercel env add SENTRY_DSN production --force 2>/dev/null
echo "https://placeholder@sentry.io/placeholder" | npx vercel env add NEXT_PUBLIC_SENTRY_DSN production --force 2>/dev/null

echo "Environment variables setup complete!"
echo "Note: Please update placeholder values with actual production credentials in Vercel dashboard"