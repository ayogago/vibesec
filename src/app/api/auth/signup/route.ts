import { NextRequest, NextResponse } from 'next/server';
import { createUser, isDatabaseConfigured } from '@/lib/db/users';
import { createUser as createLocalUser } from '@/lib/users';
import { SubscriptionTier } from '@/lib/subscription';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, pendingPlan } = body;

    // Validation
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

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    // Use database if configured, otherwise fall back to localStorage
    if (isDatabaseConfigured()) {
      const result = await createUser(email, password, name, {
        pendingPlan: pendingPlan as SubscriptionTier,
      });

      if ('error' in result) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json({
        user: {
          id: result.id,
          email: result.email,
          name: result.name,
        },
        message: 'Account created successfully',
      });
    } else {
      // Fallback to localStorage (client will handle this)
      // This route is mainly for database-backed auth
      return NextResponse.json({
        useLocalStorage: true,
        message: 'Database not configured, use client-side registration',
      });
    }
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Failed to create account. Please try again.' },
      { status: 500 }
    );
  }
}
