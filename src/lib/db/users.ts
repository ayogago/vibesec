// Database service for user management
// Uses Supabase with secure password hashing

import bcrypt from 'bcryptjs';
import { getSupabaseAdmin, isSupabaseAdminConfigured, DbUser } from '../supabase';
import { SubscriptionTier } from '../subscription';

// Salt rounds for bcrypt (10-12 is recommended for production)
const SALT_ROUNDS = 12;

// Admin credentials for initialization
export const ADMIN_CREDENTIALS = {
  email: 'admin@vibesec.dev',
  password: 'admin123', // This will be hashed when stored
  name: 'VibeSec Admin',
};

// Public user type (without sensitive fields)
export interface PublicUser {
  id: string;
  email: string;
  name: string;
  image: string | null;
  subscription: SubscriptionTier;
  pendingPlan: SubscriptionTier | null;
  isAdmin: boolean;
  status: 'active' | 'suspended';
  createdAt: string;
  lastLoginAt: string | null;
  githubId: number | null;
}

// Convert database user to public user
function toPublicUser(dbUser: DbUser): PublicUser {
  return {
    id: dbUser.id,
    email: dbUser.email,
    name: dbUser.name,
    image: dbUser.image,
    subscription: dbUser.subscription as SubscriptionTier,
    pendingPlan: dbUser.pending_plan as SubscriptionTier | null,
    isAdmin: dbUser.is_admin,
    status: dbUser.status,
    createdAt: dbUser.created_at,
    lastLoginAt: dbUser.last_login_at,
    githubId: dbUser.github_id,
  };
}

// Hash a password securely
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

// Verify a password against a hash
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Find user by email
export async function findUserByEmail(email: string): Promise<PublicUser | null> {
  if (!isSupabaseAdminConfigured()) {
    console.warn('Supabase not configured, user lookup skipped');
    return null;
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (error || !data) {
      return null;
    }

    return toPublicUser(data);
  } catch (error) {
    console.error('Error finding user by email:', error);
    return null;
  }
}

// Find user by ID
export async function findUserById(id: string): Promise<PublicUser | null> {
  if (!isSupabaseAdminConfigured()) {
    return null;
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return null;
    }

    return toPublicUser(data);
  } catch (error) {
    console.error('Error finding user by ID:', error);
    return null;
  }
}

// Find user by GitHub ID
export async function findUserByGitHubId(githubId: number): Promise<PublicUser | null> {
  if (!isSupabaseAdminConfigured()) {
    return null;
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('github_id', githubId)
      .single();

    if (error || !data) {
      return null;
    }

    return toPublicUser(data);
  } catch (error) {
    console.error('Error finding user by GitHub ID:', error);
    return null;
  }
}

// Create a new user
export async function createUser(
  email: string,
  password: string,
  name: string,
  options?: {
    pendingPlan?: SubscriptionTier;
    isAdmin?: boolean;
  }
): Promise<PublicUser | { error: string }> {
  if (!isSupabaseAdminConfigured()) {
    return { error: 'Database not configured' };
  }

  try {
    // Check if user already exists
    const existing = await findUserByEmail(email);
    if (existing) {
      return { error: 'An account with this email already exists' };
    }

    // Hash the password
    const passwordHash = await hashPassword(password);

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('users')
      .insert({
        email: email.toLowerCase(),
        password_hash: passwordHash,
        name,
        subscription: 'free',
        pending_plan: options?.pendingPlan && options.pendingPlan !== 'free' ? options.pendingPlan : null,
        is_admin: options?.isAdmin || false,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating user:', error);
      return { error: 'Failed to create account' };
    }

    return toPublicUser(data);
  } catch (error) {
    console.error('Error creating user:', error);
    return { error: 'Failed to create account' };
  }
}

// Validate user credentials and return user if valid
export async function validateCredentials(
  email: string,
  password: string
): Promise<PublicUser | null> {
  if (!isSupabaseAdminConfigured()) {
    return null;
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (error || !data || !data.password_hash) {
      return null;
    }

    // Verify password
    const isValid = await verifyPassword(password, data.password_hash);
    if (!isValid) {
      return null;
    }

    // Check if user is suspended
    if (data.status === 'suspended') {
      return null;
    }

    // Update last login
    await supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', data.id);

    return toPublicUser(data);
  } catch (error) {
    console.error('Error validating credentials:', error);
    return null;
  }
}

// Update user
export async function updateUser(
  userId: string,
  updates: {
    name?: string;
    image?: string;
    subscription?: SubscriptionTier;
    pendingPlan?: SubscriptionTier | null;
    status?: 'active' | 'suspended';
  }
): Promise<PublicUser | null> {
  if (!isSupabaseAdminConfigured()) {
    return null;
  }

  try {
    const supabase = getSupabaseAdmin();
    const dbUpdates: Record<string, unknown> = {};

    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.image !== undefined) dbUpdates.image = updates.image;
    if (updates.subscription !== undefined) dbUpdates.subscription = updates.subscription;
    if (updates.pendingPlan !== undefined) dbUpdates.pending_plan = updates.pendingPlan;
    if (updates.status !== undefined) dbUpdates.status = updates.status;

    const { data, error } = await supabase
      .from('users')
      .update(dbUpdates)
      .eq('id', userId)
      .select()
      .single();

    if (error || !data) {
      return null;
    }

    return toPublicUser(data);
  } catch (error) {
    console.error('Error updating user:', error);
    return null;
  }
}

// Change user password
export async function changePassword(
  userId: string,
  newPassword: string
): Promise<boolean> {
  if (!isSupabaseAdminConfigured()) {
    return false;
  }

  try {
    const passwordHash = await hashPassword(newPassword);
    const supabase = getSupabaseAdmin();

    const { error } = await supabase
      .from('users')
      .update({ password_hash: passwordHash })
      .eq('id', userId);

    return !error;
  } catch (error) {
    console.error('Error changing password:', error);
    return false;
  }
}

// Link GitHub account to user
export async function linkGitHubAccount(
  userId: string,
  githubId: number,
  accessToken: string
): Promise<PublicUser | null> {
  if (!isSupabaseAdminConfigured()) {
    return null;
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('users')
      .update({
        github_id: githubId,
        github_access_token: accessToken,
      })
      .eq('id', userId)
      .select()
      .single();

    if (error || !data) {
      return null;
    }

    return toPublicUser(data);
  } catch (error) {
    console.error('Error linking GitHub account:', error);
    return null;
  }
}

// Create or update user from GitHub OAuth
export async function upsertGitHubUser(
  githubId: number,
  email: string,
  name: string,
  image: string | null,
  accessToken: string
): Promise<PublicUser | null> {
  if (!isSupabaseAdminConfigured()) {
    return null;
  }

  try {
    const supabase = getSupabaseAdmin();

    // Check if user exists by GitHub ID
    let user = await findUserByGitHubId(githubId);

    if (user) {
      // Update existing user
      const { data, error } = await supabase
        .from('users')
        .update({
          github_access_token: accessToken,
          image,
          last_login_at: new Date().toISOString(),
        })
        .eq('github_id', githubId)
        .select()
        .single();

      if (error || !data) {
        return null;
      }
      return toPublicUser(data);
    }

    // Check if user exists by email
    const existingByEmail = await findUserByEmail(email);
    if (existingByEmail) {
      // Link GitHub to existing account
      return linkGitHubAccount(existingByEmail.id, githubId, accessToken);
    }

    // Create new user
    const { data, error } = await supabase
      .from('users')
      .insert({
        email: email.toLowerCase(),
        name,
        image,
        github_id: githubId,
        github_access_token: accessToken,
        subscription: 'free',
        is_admin: false,
        status: 'active',
        password_hash: null, // No password for OAuth users
      })
      .select()
      .single();

    if (error || !data) {
      console.error('Error creating GitHub user:', error);
      return null;
    }

    return toPublicUser(data);
  } catch (error) {
    console.error('Error upserting GitHub user:', error);
    return null;
  }
}

// Get all users (admin only)
export async function getAllUsers(): Promise<PublicUser[]> {
  if (!isSupabaseAdminConfigured()) {
    return [];
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      return [];
    }

    return data.map(toPublicUser);
  } catch (error) {
    console.error('Error getting all users:', error);
    return [];
  }
}

// Initialize admin user if it doesn't exist
export async function initializeAdminUser(): Promise<void> {
  if (!isSupabaseAdminConfigured()) {
    console.log('Supabase not configured, skipping admin initialization');
    return;
  }

  try {
    const existingAdmin = await findUserByEmail(ADMIN_CREDENTIALS.email);
    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }

    const result = await createUser(
      ADMIN_CREDENTIALS.email,
      ADMIN_CREDENTIALS.password,
      ADMIN_CREDENTIALS.name,
      { isAdmin: true }
    );

    if ('error' in result) {
      console.error('Failed to create admin user:', result.error);
    } else {
      console.log('Admin user created successfully');
    }
  } catch (error) {
    console.error('Error initializing admin user:', error);
  }
}

// Check if database is available
export function isDatabaseConfigured(): boolean {
  return isSupabaseAdminConfigured();
}
