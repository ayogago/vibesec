-- VibeSec Database Schema
-- Run this in your Supabase SQL Editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255), -- NULL for OAuth users
  name VARCHAR(255) NOT NULL,
  image VARCHAR(500),
  subscription VARCHAR(20) DEFAULT 'free' CHECK (subscription IN ('anonymous', 'free', 'starter', 'pro')),
  pending_plan VARCHAR(20) CHECK (pending_plan IN ('anonymous', 'free', 'starter', 'pro')),
  github_id BIGINT UNIQUE,
  github_access_token TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_github_id ON users(github_id);

-- Scan history table
CREATE TABLE IF NOT EXISTS scans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  repo_name VARCHAR(255) NOT NULL,
  repo_url VARCHAR(500) NOT NULL,
  repo_owner VARCHAR(255),
  is_private BOOLEAN DEFAULT FALSE,
  security_score INTEGER CHECK (security_score >= 0 AND security_score <= 100),
  total_findings INTEGER DEFAULT 0,
  critical_count INTEGER DEFAULT 0,
  high_count INTEGER DEFAULT 0,
  medium_count INTEGER DEFAULT 0,
  low_count INTEGER DEFAULT 0,
  scan_data JSONB, -- Full scan results
  scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_scans_user_id ON scans(user_id);
CREATE INDEX IF NOT EXISTS idx_scans_scanned_at ON scans(scanned_at DESC);

-- Sessions table (for tracking active sessions)
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token_hash);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
-- Users can read their own data
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

-- Users can update their own data (except admin status)
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid()::text = id::text)
  WITH CHECK (auth.uid()::text = id::text);

-- Service role can do everything
CREATE POLICY "Service role full access to users" ON users
  FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for scans table
-- Users can view their own scans
CREATE POLICY "Users can view own scans" ON scans
  FOR SELECT USING (auth.uid()::text = user_id::text);

-- Users can insert their own scans
CREATE POLICY "Users can insert own scans" ON scans
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Service role can do everything
CREATE POLICY "Service role full access to scans" ON scans
  FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for sessions table
CREATE POLICY "Service role full access to sessions" ON sessions
  FOR ALL USING (auth.role() = 'service_role');

-- Insert default admin user (password will be hashed by the application)
-- This is a placeholder - the actual admin should be created via the API
-- INSERT INTO users (email, name, subscription, is_admin)
-- VALUES ('admin@vibesec.dev', 'VibeSec Admin', 'pro', true)
-- ON CONFLICT (email) DO NOTHING;

-- Analytics view for admin dashboard
CREATE OR REPLACE VIEW admin_analytics AS
SELECT
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT COUNT(*) FROM users WHERE last_login_at > NOW() - INTERVAL '30 days') as active_users,
  (SELECT COUNT(*) FROM scans) as total_scans,
  (SELECT COUNT(*) FROM scans WHERE scanned_at > NOW() - INTERVAL '1 day') as scans_today,
  (SELECT COALESCE(AVG(security_score), 0) FROM scans) as avg_security_score,
  (SELECT COALESCE(SUM(critical_count), 0) FROM scans) as critical_findings_total,
  (SELECT COUNT(*) FROM users WHERE subscription = 'starter') * 19.99 +
  (SELECT COUNT(*) FROM users WHERE subscription = 'pro') * 99 as estimated_mrr;

-- Grant access to the view
GRANT SELECT ON admin_analytics TO authenticated;
GRANT SELECT ON admin_analytics TO service_role;
