import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/db';

// Track if admin initialization has been attempted this server lifecycle
let adminInitAttempted = false;

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Check if database is configured
    if (!db.isDatabaseConfigured()) {
      return NextResponse.json(
        { error: 'Database not configured. Please set up Supabase.' },
        { status: 500 }
      );
    }

    // Initialize admin user on first login attempt if not done yet
    if (!adminInitAttempted) {
      adminInitAttempted = true;
      try {
        await db.initializeAdminUser();
      } catch (e) {
        console.error('Admin initialization error:', e);
        // Continue with login attempt even if admin init fails
      }
    }

    const user = await db.validateCredentials(email, password);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Return user without password hash
    const { password_hash, ...userWithoutPassword } = user;

    return NextResponse.json({
      user: userWithoutPassword,
      message: 'Login successful',
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}
