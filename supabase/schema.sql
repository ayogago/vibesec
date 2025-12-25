-- SecureSiteScan Database Schema for Supabase
-- Run this in Supabase SQL Editor to create the tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create subscription tier enum (skip if exists)
DO $$ BEGIN
    CREATE TYPE subscription_tier AS ENUM ('anonymous', 'free', 'starter', 'pro');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    subscription subscription_tier DEFAULT 'free',
    pending_plan subscription_tier,
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add reset token columns if they don't exist (for existing databases)
DO $$ BEGIN
    ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP WITH TIME ZONE;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Add OAuth columns if they don't exist (for existing databases)
DO $$ BEGIN
    ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image VARCHAR(500);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_provider VARCHAR(50);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS github_access_token TEXT;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

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

-- Trigger for users table (drop first if exists to avoid duplicates)
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Row Level Security (RLS) Configuration
-- =====================================================
-- IMPORTANT: Since we use NextAuth (not Supabase Auth), we need to allow
-- the anon key to perform operations. The security is handled at the
-- application layer through NextAuth authentication.
--
-- We DISABLE RLS since our app handles auth via NextAuth, not Supabase Auth.
-- The anon key is only used from server-side API routes which are protected
-- by NextAuth session checks.
-- =====================================================

-- Disable RLS on all tables (app handles authentication via NextAuth)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE scan_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_scan_counts DISABLE ROW LEVEL SECURITY;

-- Grant permissions to anon role for all operations
GRANT ALL ON users TO anon;
GRANT ALL ON scan_history TO anon;
GRANT ALL ON daily_scan_counts TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- =====================================================
-- Admin User Setup Instructions
-- =====================================================
-- IMPORTANT: Admin users should be created via the application with ADMIN_PASSWORD environment variable
-- Do NOT insert hardcoded credentials in schema files
--
-- To create an admin user:
-- 1. Set the ADMIN_PASSWORD environment variable in Vercel/your hosting
-- 2. Deploy the application
-- 3. Call GET or POST /api/admin/init to create the admin user
-- 4. Login with info@securesitescan.com and your ADMIN_PASSWORD
-- =====================================================
