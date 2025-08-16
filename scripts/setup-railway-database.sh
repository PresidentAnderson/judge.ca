#!/bin/bash

# Railway PostgreSQL Database Setup Script
# This script sets up the PostgreSQL database for the Judge.ca application on Railway

set -e

echo "🗄️ Setting up PostgreSQL database on Railway..."

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

# Add PostgreSQL service
echo "📝 Adding PostgreSQL service to Railway project..."
railway add --database postgresql

echo "⏳ Waiting for PostgreSQL service to be ready..."
sleep 60

# The DATABASE_URL will be automatically available in environment variables
echo "✅ PostgreSQL service added successfully"

# Get database connection info
echo "🔍 Getting database connection details..."
DB_URL=$(railway variables get DATABASE_URL 2>/dev/null || echo "")

if [ -z "$DB_URL" ]; then
    echo "⚠️ DATABASE_URL not found. Please check Railway dashboard."
    echo "💡 The database might still be initializing. Try again in a few minutes."
else
    echo "✅ Database URL configured: ${DB_URL:0:30}..."
fi

# Create database schema initialization script
cat > scripts/init-railway-db.sql << 'EOF'
-- Judge.ca Database Schema for Railway PostgreSQL
-- This script initializes the database schema for production

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    address JSONB,
    preferences JSONB DEFAULT '{}',
    is_verified BOOLEAN DEFAULT false,
    verification_token VARCHAR(255),
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMP,
    two_factor_secret VARCHAR(255),
    two_factor_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Attorneys table
CREATE TABLE IF NOT EXISTS attorneys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    bar_number VARCHAR(50) UNIQUE NOT NULL,
    specializations TEXT[] DEFAULT '{}',
    experience_years INTEGER,
    education JSONB DEFAULT '[]',
    certifications JSONB DEFAULT '[]',
    practice_areas TEXT[] DEFAULT '{}',
    languages TEXT[] DEFAULT '{}',
    hourly_rate DECIMAL(10,2),
    consultation_fee DECIMAL(10,2),
    availability JSONB DEFAULT '{}',
    bio TEXT,
    profile_image_url VARCHAR(500),
    is_verified BOOLEAN DEFAULT false,
    verification_documents JSONB DEFAULT '[]',
    rating DECIMAL(3,2) DEFAULT 0.00,
    total_reviews INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    subscription_plan VARCHAR(50) DEFAULT 'basic',
    subscription_expires TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Attorney Matches table
CREATE TABLE IF NOT EXISTS attorney_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    attorney_id UUID REFERENCES attorneys(id) ON DELETE CASCADE,
    case_description TEXT NOT NULL,
    practice_area VARCHAR(100) NOT NULL,
    budget_range VARCHAR(50),
    urgency VARCHAR(20) DEFAULT 'normal',
    preferred_language VARCHAR(10) DEFAULT 'en',
    location JSONB,
    status VARCHAR(20) DEFAULT 'pending',
    match_score DECIMAL(3,2),
    ai_analysis JSONB,
    matched_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    attorney_id UUID REFERENCES attorneys(id) ON DELETE CASCADE,
    match_id UUID REFERENCES attorney_matches(id) ON DELETE SET NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    response_text TEXT,
    is_verified BOOLEAN DEFAULT false,
    is_published BOOLEAN DEFAULT true,
    helpful_votes INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Conversations table for messaging
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    attorney_id UUID REFERENCES attorneys(id) ON DELETE CASCADE,
    match_id UUID REFERENCES attorney_matches(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'active',
    last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL,
    sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('user', 'attorney')),
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'voice', 'image')),
    file_url VARCHAR(500),
    file_name VARCHAR(255),
    file_size INTEGER,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    attorney_id UUID REFERENCES attorneys(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    timezone VARCHAR(50) DEFAULT 'America/Toronto',
    meeting_type VARCHAR(20) DEFAULT 'video' CHECK (meeting_type IN ('video', 'phone', 'in-person')),
    meeting_url VARCHAR(500),
    meeting_id VARCHAR(100),
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'cancelled', 'completed', 'no-show')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    attorney_id UUID REFERENCES attorneys(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    stripe_payment_intent_id VARCHAR(255),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'CAD',
    status VARCHAR(20) DEFAULT 'pending',
    payment_method VARCHAR(50),
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Blog posts table
CREATE TABLE IF NOT EXISTS blog_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    author_id UUID REFERENCES attorneys(id) ON DELETE SET NULL,
    category VARCHAR(100),
    tags TEXT[] DEFAULT '{}',
    featured_image_url VARCHAR(500),
    is_published BOOLEAN DEFAULT false,
    published_at TIMESTAMP,
    views INTEGER DEFAULT 0,
    reading_time INTEGER,
    seo_title VARCHAR(255),
    seo_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Push notification subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    endpoint VARCHAR(500) NOT NULL,
    p256dh_key VARCHAR(255) NOT NULL,
    auth_key VARCHAR(255) NOT NULL,
    user_agent VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, endpoint)
);

-- Analytics events table
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB DEFAULT '{}',
    session_id VARCHAR(255),
    ip_address INET,
    user_agent VARCHAR(500),
    referrer VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_attorneys_user_id ON attorneys(user_id);
CREATE INDEX IF NOT EXISTS idx_attorneys_specializations ON attorneys USING GIN(specializations);
CREATE INDEX IF NOT EXISTS idx_attorney_matches_user_id ON attorney_matches(user_id);
CREATE INDEX IF NOT EXISTS idx_attorney_matches_attorney_id ON attorney_matches(attorney_id);
CREATE INDEX IF NOT EXISTS idx_attorney_matches_status ON attorney_matches(status);
CREATE INDEX IF NOT EXISTS idx_reviews_attorney_id ON reviews(attorney_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participants ON conversations(user_id, attorney_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_appointments_attorney_id ON appointments(attorney_id);
CREATE INDEX IF NOT EXISTS idx_appointments_start_time ON appointments(start_time);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(is_published, published_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_attorneys_updated_at BEFORE UPDATE ON attorneys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_attorney_matches_updated_at BEFORE UPDATE ON attorney_matches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON blog_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_push_subscriptions_updated_at BEFORE UPDATE ON push_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EOF

echo "📝 Database initialization script created: scripts/init-railway-db.sql"

# Run database initialization if DATABASE_URL is available
if [ ! -z "$DB_URL" ]; then
    echo "🔄 Initializing database schema..."
    
    # Use psql to run the initialization script
    if command -v psql &> /dev/null; then
        psql "$DB_URL" -f scripts/init-railway-db.sql
        echo "✅ Database schema initialized successfully"
    else
        echo "⚠️ psql not found. Please run the following command manually:"
        echo "psql \"\$DATABASE_URL\" -f scripts/init-railway-db.sql"
    fi
else
    echo "⚠️ DATABASE_URL not available. Please initialize the database manually after deployment."
fi

echo ""
echo "📋 Next steps:"
echo "1. Wait for PostgreSQL service to be fully ready"
echo "2. Run database migrations: railway run npm run db:migrate"
echo "3. Seed initial data: railway run npm run db:seed"
echo "4. Check database connection in your application"
echo ""
echo "✅ Railway PostgreSQL setup complete!"