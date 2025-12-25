import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { isDatabaseConfigured, db, createUser } from '@/lib/db';
import type { SubscriptionTier, User } from '@/lib/database.types';

const ADMIN_EMAILS = ["info@securesitescan.com", "owner@securesitescan.com"];

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isDatabaseConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const subscription = searchParams.get('subscription') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Build query
    let query = db.from('users').select('*', { count: 'exact' });

    if (search) {
      query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%`);
    }

    if (subscription && subscription !== 'all') {
      query = query.eq('subscription', subscription as SubscriptionTier);
    }

    // Get users with scan counts
    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    const users = data as User[] | null;

    // Get scan counts for each user
    const usersWithStats = await Promise.all(
      (users || []).map(async (user) => {
        const { count: scanCount } = await db.from('scan_history')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        const { data: lastScan } = await db.from('scan_history')
          .select('scanned_at')
          .eq('user_id', user.id)
          .order('scanned_at', { ascending: false })
          .limit(1)
          .single();

        return {
          ...user,
          totalScans: scanCount || 0,
          lastScan: lastScan?.scanned_at || null,
          password_hash: undefined, // Don't send password hash
        };
      })
    );

    return NextResponse.json({
      users: usersWithStats,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { email, password, name, subscription } = body;

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await createUser(email, password, name, subscription as SubscriptionTier);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ user: result.user });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
