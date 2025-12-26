import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/db';
import bcrypt from 'bcryptjs';
import { auth } from '@/lib/auth';

const ADMIN_EMAILS = ["info@securesitescan.com"];

// Admin setup endpoint - creates or resets the admin user
// Requires either SETUP_SECRET (for initial setup) or admin session (for resets)
export async function POST(request: NextRequest) {
  try {
    // Check if database is configured
    if (!db.isDatabaseConfigured()) {
      return NextResponse.json(
        { error: 'Database not configured. Please set up Supabase.' },
        { status: 500 }
      );
    }

    // Get action and setup_secret from request body
    let action = 'create';
    let setupSecret = '';
    try {
      const body = await request.json();
      action = body.action || 'create';
      setupSecret = body.setup_secret || '';
    } catch {
      // No body provided, default to create
    }

    // Check if admin already exists
    const adminEmail = 'info@securesitescan.com';
    const existingAdmin = await db.findUserByEmail(adminEmail);

    // Authentication: require setup secret for initial setup, admin session for resets
    if (existingAdmin) {
      // Admin exists - require admin session to reset
      const session = await auth();
      if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
        return NextResponse.json({ error: 'Unauthorized. Admin session required.' }, { status: 401 });
      }
    } else {
      // No admin exists - require setup secret for initial creation
      const expectedSecret = process.env.SETUP_SECRET;
      if (!expectedSecret || setupSecret !== expectedSecret) {
        return NextResponse.json({ error: 'Invalid or missing setup_secret.' }, { status: 401 });
      }
    }

    // Get password from environment variable
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      return NextResponse.json(
        { error: 'ADMIN_PASSWORD environment variable is not set.' },
        { status: 500 }
      );
    }

    if (adminPassword.length < 8) {
      return NextResponse.json(
        { error: 'ADMIN_PASSWORD must be at least 8 characters.' },
        { status: 400 }
      );
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    if (existingAdmin) {
      if (action === 'reset') {
        // Reset password for existing admin
        const client = db.db;
        const { error } = await client
          .from('users')
          .update({ password_hash: passwordHash })
          .eq('email', adminEmail);

        if (error) {
          return NextResponse.json(
            { error: 'Failed to reset admin password.' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          message: 'Admin password reset successfully.',
        });
      } else {
        return NextResponse.json(
          { error: 'Admin user already exists. Use action: "reset" to reset password.' },
          { status: 400 }
        );
      }
    }

    // Create admin user
    const client = db.db;
    const { data, error } = await client
      .from('users')
      .insert({
        email: adminEmail,
        name: 'SecureSiteScan Admin',
        password_hash: passwordHash,
        subscription: 'pro',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create admin user.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Admin user created successfully. You can now login with info@securesitescan.com',
    });
  } catch {
    return NextResponse.json(
      { error: 'Admin setup failed.' },
      { status: 500 }
    );
  }
}

// GET endpoint to check if admin exists
export async function GET() {
  try {
    if (!db.isDatabaseConfigured()) {
      return NextResponse.json({ configured: false, adminExists: false });
    }

    const adminEmail = 'info@securesitescan.com';
    const existingAdmin = await db.findUserByEmail(adminEmail);

    return NextResponse.json({
      configured: true,
      adminExists: !!existingAdmin,
    });
  } catch {
    return NextResponse.json({ configured: false, adminExists: false });
  }
}
