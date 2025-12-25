import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { isDatabaseConfigured, db } from '@/lib/db';
import type { ScanHistory } from '@/lib/database.types';

const ADMIN_EMAILS = ["info@securesitescan.com"];

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
    const severity = searchParams.get('severity') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Build query
    let query = db.from('scan_history').select('*', { count: 'exact' });

    if (search) {
      query = query.or(`repo_name.ilike.%${search}%,repo_url.ilike.%${search}%`);
    }

    if (severity === 'critical') {
      query = query.gt('critical_count', 0);
    } else if (severity === 'high') {
      query = query.gt('high_count', 0);
    } else if (severity === 'clean') {
      query = query.eq('critical_count', 0).eq('high_count', 0);
    }

    const { data, count, error } = await query
      .order('scanned_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching scans:', error);
      return NextResponse.json({ error: 'Failed to fetch scans' }, { status: 500 });
    }

    const scans = data as ScanHistory[] | null;

    // Get user emails for each scan
    const userIds = [...new Set(scans?.map(s => s.user_id) || [])];
    const { data: users } = await db.from('users')
      .select('id, email, name')
      .in('id', userIds);

    const userMap = new Map(users?.map(u => [u.id, u]) || []);

    const scansWithUsers = scans?.map(scan => ({
      ...scan,
      user: userMap.get(scan.user_id) || { email: 'Unknown', name: 'Unknown' },
    }));

    return NextResponse.json({
      scans: scansWithUsers || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error) {
    console.error('Error fetching scans:', error);
    return NextResponse.json({ error: 'Failed to fetch scans' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isDatabaseConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const body = await request.json();
    const { scanId } = body;

    if (!scanId) {
      return NextResponse.json({ error: 'Scan ID required' }, { status: 400 });
    }

    const { error } = await db.from('scan_history').delete().eq('id', scanId);

    if (error) {
      console.error('Error deleting scan:', error);
      return NextResponse.json({ error: 'Failed to delete scan' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting scan:', error);
    return NextResponse.json({ error: 'Failed to delete scan' }, { status: 500 });
  }
}
