import { NextResponse } from 'next/server';
import * as db from '@/lib/db';

// This endpoint initializes the admin user if it doesn't exist
// It should be called once during initial setup
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
    if (!process.env.ADMIN_PASSWORD) {
      return NextResponse.json(
        {
          success: false,
          error: 'ADMIN_PASSWORD environment variable not set.',
        },
        { status: 500 }
      );
    }

    // Try to initialize admin user
    await db.initializeAdminUser();

    // Check if admin was created
    const adminUser = await db.findUserByEmail('info@securesitescan.com');

    if (adminUser) {
      return NextResponse.json({
        success: true,
        message: 'Admin user initialized successfully',
        email: 'info@securesitescan.com',
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create admin user. Check Supabase RLS policies or use service role key.',
          hint: 'You may need to disable RLS on the users table or add a policy that allows inserts.',
        },
        { status: 500 }
      );
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
