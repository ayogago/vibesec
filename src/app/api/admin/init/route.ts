import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import * as db from '@/lib/db';

// This endpoint initializes or resets the admin user
// It should be called during initial setup or when resetting admin password
// For security, it only works if ADMIN_PASSWORD is set

export async function POST() {
  try {
    // Check if database is configured
    if (!db.isDatabaseConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Database not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.',
        },
        { status: 500 }
      );
    }

    // Check if ADMIN_PASSWORD is set
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      return NextResponse.json(
        {
          success: false,
          error: 'ADMIN_PASSWORD environment variable not set.',
        },
        { status: 500 }
      );
    }

    const adminEmail = 'info@securesitescan.com';
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const client = createClient(supabaseUrl, supabaseAnonKey);

    // Check if admin exists
    const existingAdmin = await db.findUserByEmail(adminEmail);

    // Hash the password
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    if (existingAdmin) {
      // Update existing admin's password
      const { error } = await client
        .from('users')
        .update({
          password_hash: passwordHash,
          updated_at: new Date().toISOString()
        })
        .eq('email', adminEmail);

      if (error) {
        return NextResponse.json(
          {
            success: false,
            error: `Failed to update admin password: ${error.message}`,
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Admin password reset successfully',
        email: adminEmail,
        action: 'password_reset',
      });
    } else {
      // Create new admin user
      const { error } = await client.from('users').insert({
        id: 'a0000000-0000-0000-0000-000000000001',
        email: adminEmail,
        name: 'SecureSiteScan Admin',
        password_hash: passwordHash,
        subscription: 'pro',
      });

      if (error) {
        return NextResponse.json(
          {
            success: false,
            error: `Failed to create admin user: ${error.message}`,
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Admin user created successfully',
        email: adminEmail,
        action: 'created',
      });
    }
  } catch (error) {
    console.error('Admin init error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Also support GET for easier testing
export async function GET() {
  return POST();
}
