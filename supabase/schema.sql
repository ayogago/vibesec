-- VibeSec Database Schema for Supabase
-- Run this in Supabase SQL Editor to create the tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create subscription tier enum
CREATE TYPE subscription_tier AS ENUM ('anonymous', 'free', 'starter', 'pro');

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    subscription subscription_tier DEFAULT 'free',
    pending_plan subscription_tier,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Scan history table
CREATE TABLE IF NOT EXISTS scan_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    repo_name VARCHAR(500) NOT NULL,
    repo_url VARCHAR(1000) NOT NULL,
    scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    security_score INTEGER NOT NULL CHECK (security_score >= 0 AND security_score <= 100),
    total_findings INTEGER NOT NULL DEFAULT 0,
    critical_count INTEGER NOT NULL DEFAULT 0,
    high_count INTEGER NOT NULL DEFAULT 0,
    medium_count INTEGER NOT NULL DEFAULT 0,
    low_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for scan history
CREATE INDEX IF NOT EXISTS idx_scan_history_user_id ON scan_history(user_id);
CREATE INDEX IF NOT EXISTS idx_scan_history_scanned_at ON scan_history(scanned_at DESC);

-- Daily scan counts table (for rate limiting)
CREATE TABLE IF NOT EXISTS daily_scan_counts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    scan_date DATE NOT NULL DEFAULT CURRENT_DATE,
    count INTEGER NOT NULL DEFAULT 0,
    UNIQUE(user_id, scan_date)
);

-- Create index for daily scan lookups
CREATE INDEX IF NOT EXISTS idx_daily_scans_user_date ON daily_scan_counts(user_id, scan_date);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for users table
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_scan_counts ENABLE ROW LEVEL SECURITY;

-- Users can read/update their own data
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Scan history policies
CREATE POLICY "Users can view own scans" ON scan_history
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own scans" ON scan_history
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own scans" ON scan_history
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- Daily scan count policies
CREATE POLICY "Users can view own scan counts" ON daily_scan_counts
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can manage own scan counts" ON daily_scan_counts
    FOR ALL USING (auth.uid()::text = user_id::text);

-- Insert default admin user (password will need to be hashed in production)
-- The password 'admin123' should be hashed with bcrypt before inserting
INSERT INTO users (id, email, name, password_hash, subscription, created_at)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'admin@vibesec.dev',
    'VibeSec Admin',
    '$2b$10$rOzJqQZQhPjLQmJX0D4Vf.W8Y9cP5E1tKqRzXzGz5A5nMvHq6qLHe', -- 'admin123' hashed
    'pro',
    NOW()
) ON CONFLICT (email) DO NOTHING;
