import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { isDatabaseConfigured, db, findUserById, updateUser } from '@/lib/db';
import bcrypt from 'bcryptjs';
import type { SubscriptionTier } from '@/lib/database.types';

const ADMIN_EMAILS = ["info@securesitescan.com"];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const user = await findUserById(id);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user's scan history
    const { data: scans, count: totalScans } = await db.from('scan_history')
      .select('*', { count: 'exact' })
      .eq('user_id', id)
      .order('scanned_at', { ascending: false })
      .limit(10);

    // Get daily scan count today
    const today = new Date().toISOString().split('T')[0];
    const { data: dailyCount } = await db.from('daily_scan_counts')
      .select('count')
      .eq('user_id', id)
      .eq('scan_date', today)
      .single();

    return NextResponse.json({
      user: { ...user, password_hash: undefined },
      scans: scans || [],
      totalScans: totalScans || 0,
      scansToday: dailyCount?.count || 0,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isDatabaseConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, subscription, password, status } = body;

    // Build update object
    const updates: Record<string, unknown> = {};

    if (name !== undefined) updates.name = name;
    if (subscription !== undefined) updates.subscription = subscription as SubscriptionTier;
    if (status !== undefined) updates.status = status;

    // If password is provided, hash it
    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);
      updates.password_hash = passwordHash;
    }

    // Direct database update for fields not in updateUser
    const { data, error } = await db.from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }

    return NextResponse.json({ user: { ...data, password_hash: undefined } });
  } catch {
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isDatabaseConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { id } = await params;

    // Check if trying to delete admin user
    const user = await findUserById(id);
    if (user && ADMIN_EMAILS.includes(user.email)) {
      return NextResponse.json({ error: 'Cannot delete admin user' }, { status: 400 });
    }

    // Delete user's scan history first
    await db.from('scan_history').delete().eq('user_id', id);

    // Delete user's daily scan counts
    await db.from('daily_scan_counts').delete().eq('user_id', id);

    // Delete user
    const { error } = await db.from('users').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
