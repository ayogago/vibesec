import { NextResponse } from 'next/server';
import { isDatabaseConfigured } from '@/lib/db';

export async function GET() {
  try {
    // Check if environment variables are set
    if (!isDatabaseConfigured()) {
      return NextResponse.json({
        status: 'not_configured',
        message: 'Database environment variables are not set. Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.',
        configured: false,
        connected: false,
      });
    }

    // Dynamically import db to avoid initialization errors
    const { db } = await import('@/lib/db');

    // Try to connect to database
    const { error } = await db
      .from('users')
      .select('id')
      .limit(1);

    if (error) {
      return NextResponse.json({
        status: 'error',
        message: `Database connection failed: ${error.message}`,
        configured: true,
        connected: false,
        error: error.message,
      });
    }

    return NextResponse.json({
      status: 'connected',
      message: 'Database is connected and working',
      configured: true,
      connected: true,
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      configured: isDatabaseConfigured(),
      connected: false,
    });
  }
}
