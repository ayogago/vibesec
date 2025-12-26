import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import * as db from '@/lib/db';
import { auth } from '@/lib/auth';

const ADMIN_EMAILS = ["info@securesitescan.com"];

// This endpoint initializes or resets the admin user
// Requires either SETUP_SECRET (for initial setup) or admin session (for resets)

export async function POST(request: NextRequest) {
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

    const adminEmail = 'info@securesitescan.com';

    // Check if admin exists
    const existingAdmin = await db.findUserByEmail(adminEmail);

    // Get setup_secret from request body if provided
    let setupSecret = '';
    try {
      const body = await request.json();
      setupSecret = body.setup_secret || '';
    } catch {
      // No body provided
    }

    // Authentication: require setup secret for initial setup, admin session for resets
    if (existingAdmin) {
      // Admin exists - require admin session to reset
      const session = await auth();
      if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
        return NextResponse.json({ success: false, error: 'Unauthorized. Admin session required.' }, { status: 401 });
      }
    } else {
      // No admin exists - require setup secret for initial creation
      const expectedSecret = process.env.SETUP_SECRET;
      if (!expectedSecret || setupSecret !== expectedSecret) {
        return NextResponse.json({ success: false, error: 'Invalid or missing setup_secret.' }, { status: 401 });
      }
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

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const client = createClient(supabaseUrl, supabaseAnonKey);

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
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: 'Admin init failed.',
      },
      { status: 500 }
    );
  }
}
