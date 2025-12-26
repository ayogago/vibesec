import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/db';
import { rateLimit, getClientIP, RATE_LIMITS } from '@/lib/rate-limit';

// Track if admin initialization has been attempted this server lifecycle
let adminInitAttempted = false;

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const clientIP = getClientIP(request);
    const rateLimitResult = rateLimit(`login:${clientIP}`, RATE_LIMITS.login);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { status: 429 }
      );
    }

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
      } catch {
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
  } catch {
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}
