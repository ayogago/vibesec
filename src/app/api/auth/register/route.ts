import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, pendingPlan } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
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

    const result = await db.createUser(email, password, name, pendingPlan);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Return user without password hash
    const { password_hash, ...userWithoutPassword } = result.user!;

    return NextResponse.json({
      user: userWithoutPassword,
      message: 'Account created successfully',
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}
