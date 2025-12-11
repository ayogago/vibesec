import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Database row types
export interface DbUser {
  id: string;
  email: string;
  password_hash: string | null;
  name: string;
  image: string | null;
  subscription: 'anonymous' | 'free' | 'starter' | 'pro';
  pending_plan: 'anonymous' | 'free' | 'starter' | 'pro' | null;
  github_id: number | null;
  github_access_token: string | null;
  is_admin: boolean;
  status: 'active' | 'suspended';
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
}

export interface DbScan {
  id: string;
  user_id: string | null;
  repo_name: string;
  repo_url: string;
  repo_owner: string | null;
  is_private: boolean;
  security_score: number | null;
  total_findings: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  scan_data: unknown | null;
  scanned_at: string;
}

export interface AdminAnalytics {
  total_users: number;
  active_users: number;
  total_scans: number;
  scans_today: number;
  avg_security_score: number;
  critical_findings_total: number;
  estimated_mrr: number;
}

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Lazy-initialized clients
let supabaseClient: SupabaseClient | null = null;
let supabaseAdmin: SupabaseClient | null = null;

// Client-side Supabase client (uses anon key, respects RLS)
// Lazily initialized to avoid errors when not configured
export function getSupabase(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }
  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseClient;
}

// For backwards compatibility - returns null if not configured
export const supabase = {
  get client() {
    return getSupabase();
  }
};

// Server-side Supabase client (uses service role key, bypasses RLS)
// Only use this on the server side for admin operations
export function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  }
  if (!supabaseAdmin) {
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return supabaseAdmin;
}

// Check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseAnonKey);
}

// Check if Supabase admin is configured
export function isSupabaseAdminConfigured(): boolean {
  return !!(supabaseUrl && supabaseServiceKey);
}
