// Database service for Supabase
// This replaces localStorage-based storage with actual database operations

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import type { Database, User, ScanHistory, SubscriptionTier } from './database.types';

// Lazy-load Supabase client to avoid errors when env vars are not set
let _db: SupabaseClient<Database> | null = null;

function getDb(): SupabaseClient<Database> | null {
  if (_db) return _db;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  _db = createClient<Database>(supabaseUrl, supabaseAnonKey);
  return _db;
}

// Check if database is configured
export function isDatabaseConfigured(): boolean {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return !!(supabaseUrl && supabaseAnonKey);
}

// Helper to get db or throw
function requireDb(): SupabaseClient<Database> {
  const client = getDb();
  if (!client) {
    throw new Error('Database not configured');
  }
  return client;
}

// Export db for direct access (with error handling)
export const db = {
  from: <T extends keyof Database['public']['Tables']>(table: T) => {
    return requireDb().from(table);
  }
};

// ============= User Operations =============

export async function createUser(
  email: string,
  password: string,
  name: string,
  pendingPlan?: SubscriptionTier
): Promise<{ user?: User; error?: string }> {
  try {
    if (!isDatabaseConfigured()) {
      return { error: 'Database not configured' };
    }

    const client = requireDb();

    // Check if user already exists
    const { data: existing } = await client
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existing) {
      return { error: 'An account with this email already exists' };
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const { data, error } = await client
      .from('users')
      .insert({
        email: email.toLowerCase(),
        name,
        password_hash: passwordHash,
        subscription: 'free' as SubscriptionTier,
        pending_plan: pendingPlan || null,
      })
      .select()
      .single();

    if (error) {
      return { error: 'Failed to create account' };
    }

    return { user: data as User };
  } catch {
    return { error: 'Failed to create account' };
  }
}

export async function findUserByEmail(email: string): Promise<User | null> {
  try {
    if (!isDatabaseConfigured()) return null;

    const client = requireDb();
    const { data, error } = await client
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (error || !data) return null;
    return data as User;
  } catch {
    return null;
  }
}

export async function findUserById(id: string): Promise<User | null> {
  try {
    if (!isDatabaseConfigured()) return null;

    const client = requireDb();
    const { data, error } = await client
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return data as User;
  } catch {
    return null;
  }
}

export async function validateCredentials(
  email: string,
  password: string
): Promise<User | null> {
  try {
    const user = await findUserByEmail(email);
    if (!user) return null;

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) return null;

    // Update last login
    const client = requireDb();
    await client
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.id);

    return user;
  } catch {
    return null;
  }
}

export async function updateUser(
  userId: string,
  updates: Partial<Pick<User, 'name' | 'subscription' | 'pending_plan' | 'last_login_at'>>
): Promise<User | null> {
  try {
    if (!isDatabaseConfigured()) return null;

    const client = requireDb();
    const { data, error } = await client
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error || !data) return null;
    return data as User;
  } catch {
    return null;
  }
}

export async function activateSubscription(
  userId: string,
  tier: SubscriptionTier
): Promise<User | null> {
  return updateUser(userId, {
    subscription: tier,
    pending_plan: null,
  });
}

// Update user subscription by email (used by Stripe webhook)
export async function updateUserSubscription(
  email: string,
  tier: SubscriptionTier
): Promise<{ user?: User; error?: string }> {
  try {
    if (!isDatabaseConfigured()) {
      return { error: 'Database not configured' };
    }

    const client = requireDb();
    const { data, error } = await client
      .from('users')
      .update({
        subscription: tier,
        pending_plan: null,
        updated_at: new Date().toISOString(),
      })
      .eq('email', email.toLowerCase())
      .select()
      .single();

    if (error) {
      console.error('Error updating subscription:', error);
      return { error: error.message };
    }

    return { user: data as User };
  } catch (error) {
    console.error('Error updating subscription:', error);
    return { error: 'Failed to update subscription' };
  }
}

export async function getAllUsers(): Promise<User[]> {
  try {
    if (!isDatabaseConfigured()) return [];

    const client = requireDb();
    const { data, error } = await client
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return [];
    return (data || []) as User[];
  } catch {
    return [];
  }
}

// ============= Scan History Operations =============

export async function getScanHistory(userId: string): Promise<ScanHistory[]> {
  try {
    if (!isDatabaseConfigured()) return [];

    const client = requireDb();
    const { data, error } = await client
      .from('scan_history')
      .select('*')
      .eq('user_id', userId)
      .order('scanned_at', { ascending: false })
      .limit(50);

    if (error) return [];
    return (data || []) as ScanHistory[];
  } catch {
    return [];
  }
}

interface ScanInput {
  repo_name: string;
  repo_url: string;
  security_score: number;
  total_findings?: number;
  critical_count?: number;
  high_count?: number;
  medium_count?: number;
  low_count?: number;
}

export async function addScanToHistory(
  userId: string,
  scan: ScanInput
): Promise<ScanHistory | null> {
  try {
    if (!isDatabaseConfigured()) return null;

    const client = requireDb();
    const { data, error } = await client
      .from('scan_history')
      .insert({
        user_id: userId,
        repo_name: scan.repo_name,
        repo_url: scan.repo_url,
        security_score: scan.security_score,
        total_findings: scan.total_findings || 0,
        critical_count: scan.critical_count || 0,
        high_count: scan.high_count || 0,
        medium_count: scan.medium_count || 0,
        low_count: scan.low_count || 0,
      })
      .select()
      .single();

    if (error) {
      return null;
    }

    // Increment daily scan count
    await incrementDailyScanCount(userId);

    return data as ScanHistory;
  } catch {
    return null;
  }
}

export async function clearScanHistory(userId: string): Promise<boolean> {
  try {
    if (!isDatabaseConfigured()) return false;

    const client = requireDb();
    const { error } = await client
      .from('scan_history')
      .delete()
      .eq('user_id', userId);

    return !error;
  } catch {
    return false;
  }
}

// ============= Daily Scan Count Operations =============

export async function getDailyScanCount(userId: string): Promise<number> {
  try {
    if (!isDatabaseConfigured()) return 0;

    const today = new Date().toISOString().split('T')[0];
    const client = requireDb();

    const { data, error } = await client
      .from('daily_scan_counts')
      .select('count')
      .eq('user_id', userId)
      .eq('scan_date', today)
      .single();

    if (error || !data) return 0;
    return data.count;
  } catch {
    return 0;
  }
}

export async function incrementDailyScanCount(userId: string): Promise<void> {
  try {
    if (!isDatabaseConfigured()) return;

    const today = new Date().toISOString().split('T')[0];
    const client = requireDb();

    // Try to get existing record
    const { data: existing } = await client
      .from('daily_scan_counts')
      .select('id, count')
      .eq('user_id', userId)
      .eq('scan_date', today)
      .single();

    if (existing) {
      await client
        .from('daily_scan_counts')
        .update({ count: existing.count + 1 })
        .eq('id', existing.id);
    } else {
      // Insert new record
      await client
        .from('daily_scan_counts')
        .insert({
          user_id: userId,
          scan_date: today,
          count: 1,
        });
    }
  } catch {
    // Silently handle error - scan count increment is non-critical
  }
}

export async function canUserScan(
  userId: string,
  subscription: SubscriptionTier
): Promise<{ allowed: boolean; reason?: string }> {
  const limits: Record<SubscriptionTier, number> = {
    anonymous: 1,
    free: 1,
    starter: 10,
    pro: 50,
  };

  const dailyLimit = limits[subscription];
  const currentCount = await getDailyScanCount(userId);

  if (currentCount >= dailyLimit) {
    return {
      allowed: false,
      reason: `You've reached your daily limit of ${dailyLimit} scan${dailyLimit === 1 ? '' : 's'}. Upgrade to scan more.`,
    };
  }

  return { allowed: true };
}

// ============= Admin Operations =============

export async function initializeAdminUser(): Promise<void> {
  try {
    if (!isDatabaseConfigured()) return;

    const adminEmail = 'info@securesitescan.com';
    const existing = await findUserByEmail(adminEmail);

    if (!existing) {
      // Require environment variable for admin password - never use hardcoded fallback
      const adminPassword = process.env.ADMIN_PASSWORD;
      if (!adminPassword) {
        // Skip admin creation if password not configured
        return;
      }
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      const client = requireDb();

      await client.from('users').insert({
        id: 'a0000000-0000-0000-0000-000000000001',
        email: adminEmail,
        name: 'SecureSiteScan Admin',
        password_hash: passwordHash,
        subscription: 'pro' as SubscriptionTier,
      });

    }
  } catch {
    // Admin initialization failed - will be handled on next startup
  }
}
