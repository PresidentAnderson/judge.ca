-- Judge.ca Database Schema
-- Attorney Referral Service for Quebec

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (clients looking for attorneys)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    preferred_language VARCHAR(2) DEFAULT 'fr' CHECK (preferred_language IN ('fr', 'en')),
    is_verified BOOLEAN DEFAULT FALSE,
    email_verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Attorneys table
CREATE TABLE attorneys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    bar_number VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    firm_name VARCHAR(255),
    phone VARCHAR(20) NOT NULL,
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    province VARCHAR(2) DEFAULT 'QC',
    postal_code VARCHAR(10),
    years_experience INTEGER NOT NULL,
    hourly_rate_min DECIMAL(10,2),
    hourly_rate_max DECIMAL(10,2),
    fixed_fee_available BOOLEAN DEFAULT FALSE,
    contingency_available BOOLEAN DEFAULT FALSE,
    free_consultation BOOLEAN DEFAULT FALSE,
    consultation_fee DECIMAL(10,2),
    languages JSONB DEFAULT '["fr"]',
    bio_fr TEXT,
    bio_en TEXT,
    profile_photo_url VARCHAR(500),
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    availability_status VARCHAR(20) DEFAULT 'available' CHECK (availability_status IN ('available', 'busy', 'unavailable')),
    rating_average DECIMAL(3,2) DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Practice Areas
CREATE TABLE practice_areas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_fr VARCHAR(100) NOT NULL,
    name_en VARCHAR(100) NOT NULL,
    description_fr TEXT,
    description_en TEXT,
    parent_id UUID REFERENCES practice_areas(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Attorney Practice Areas (many-to-many)
CREATE TABLE attorney_practice_areas (
    attorney_id UUID REFERENCES attorneys(id) ON DELETE CASCADE,
    practice_area_id UUID REFERENCES practice_areas(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT FALSE,
    years_experience INTEGER,
    PRIMARY KEY (attorney_id, practice_area_id)
);

-- Attorney Availability
CREATE TABLE attorney_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attorney_id UUID REFERENCES attorneys(id) ON DELETE CASCADE,
    day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Match Requests
CREATE TABLE match_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    practice_area_id UUID REFERENCES practice_areas(id),
    case_description TEXT NOT NULL,
    budget_type VARCHAR(20) CHECK (budget_type IN ('hourly', 'fixed', 'contingency', 'flexible')),
    budget_min DECIMAL(10,2),
    budget_max DECIMAL(10,2),
    urgency VARCHAR(20) CHECK (urgency IN ('immediate', 'within_week', 'within_month', 'flexible')),
    preferred_language VARCHAR(2) CHECK (preferred_language IN ('fr', 'en')),
    additional_requirements TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'matched', 'cancelled', 'expired')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Matches
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_request_id UUID REFERENCES match_requests(id) ON DELETE CASCADE,
    attorney_id UUID REFERENCES attorneys(id) ON DELETE CASCADE,
    match_score DECIMAL(5,2),
    status VARCHAR(20) DEFAULT 'proposed' CHECK (status IN ('proposed', 'accepted', 'rejected', 'expired')),
    attorney_response TEXT,
    user_feedback TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reviews
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attorney_id UUID REFERENCES attorneys(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    match_id UUID REFERENCES matches(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Attorney Credentials
CREATE TABLE attorney_credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attorney_id UUID REFERENCES attorneys(id) ON DELETE CASCADE,
    credential_type VARCHAR(50),
    credential_name VARCHAR(255),
    issuing_organization VARCHAR(255),
    issue_date DATE,
    expiry_date DATE,
    verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Attorney Documents
CREATE TABLE attorney_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attorney_id UUID REFERENCES attorneys(id) ON DELETE CASCADE,
    document_type VARCHAR(50),
    document_name VARCHAR(255),
    file_url VARCHAR(500),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subscription Plans
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10,2),
    price_yearly DECIMAL(10,2),
    features JSONB,
    max_monthly_matches INTEGER,
    priority_listing BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Attorney Subscriptions
CREATE TABLE attorney_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attorney_id UUID REFERENCES attorneys(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES subscription_plans(id),
    stripe_subscription_id VARCHAR(255),
    status VARCHAR(20) CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing')),
    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    attorney_id UUID REFERENCES attorneys(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Educational Content
CREATE TABLE educational_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title_fr VARCHAR(255) NOT NULL,
    title_en VARCHAR(255) NOT NULL,
    content_fr TEXT NOT NULL,
    content_en TEXT NOT NULL,
    category VARCHAR(50),
    tags JSONB,
    author VARCHAR(255),
    is_published BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- FAQs
CREATE TABLE faqs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_fr TEXT NOT NULL,
    question_en TEXT NOT NULL,
    answer_fr TEXT NOT NULL,
    answer_en TEXT NOT NULL,
    category VARCHAR(50),
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_attorneys_bar_number ON attorneys(bar_number);
CREATE INDEX idx_attorneys_is_active ON attorneys(is_active);
CREATE INDEX idx_attorneys_availability_status ON attorneys(availability_status);
CREATE INDEX idx_match_requests_user_id ON match_requests(user_id);
CREATE INDEX idx_match_requests_status ON match_requests(status);
CREATE INDEX idx_matches_attorney_id ON matches(attorney_id);
CREATE INDEX idx_reviews_attorney_id ON reviews(attorney_id);
CREATE INDEX idx_notifications_user_attorney ON notifications(user_id, attorney_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attorneys_updated_at BEFORE UPDATE ON attorneys
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_match_requests_updated_at BEFORE UPDATE ON match_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();