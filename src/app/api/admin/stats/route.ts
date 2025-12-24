import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { isDatabaseConfigured, db } from '@/lib/db';

const ADMIN_EMAILS = ["info@securesitescan.com", "owner@securesitescan.com"];

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isDatabaseConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    // Get total users
    const { count: totalUsers } = await db.from('users')
      .select('*', { count: 'exact', head: true });

    // Get users by subscription tier
    const { data: subscriptionData } = await db.from('users')
      .select('subscription');

    const subscriptionCounts = {
      anonymous: 0,
      free: 0,
      starter: 0,
      pro: 0,
    };

    subscriptionData?.forEach((user: { subscription: string }) => {
      if (user.subscription in subscriptionCounts) {
        subscriptionCounts[user.subscription as keyof typeof subscriptionCounts]++;
      }
    });

    // Get total scans
    const { count: totalScans } = await db.from('scan_history')
      .select('*', { count: 'exact', head: true });

    // Get scans today
    const today = new Date().toISOString().split('T')[0];
    const { count: scansToday } = await db.from('scan_history')
      .select('*', { count: 'exact', head: true })
      .gte('scanned_at', `${today}T00:00:00`)
      .lt('scanned_at', `${today}T23:59:59`);

    // Get average security score
    const { data: scoreData } = await db.from('scan_history')
      .select('security_score');

    const avgSecurityScore = scoreData && scoreData.length > 0
      ? Math.round(scoreData.reduce((sum: number, s: { security_score: number }) => sum + s.security_score, 0) / scoreData.length)
      : 0;

    // Get critical findings total
    const { data: findingsData } = await db.from('scan_history')
      .select('critical_count, high_count');

    const criticalFindingsTotal = findingsData?.reduce((sum: number, s: { critical_count: number }) => sum + (s.critical_count || 0), 0) || 0;
    const highFindingsTotal = findingsData?.reduce((sum: number, s: { high_count: number }) => sum + (s.high_count || 0), 0) || 0;

    // Calculate revenue (starter = $2.99, pro = $9.99)
    const monthlyRevenue = (subscriptionCounts.starter * 2.99) + (subscriptionCounts.pro * 9.99);

    // Get users registered this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count: newUsersThisMonth } = await db.from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfMonth.toISOString());

    // Get recent activity (last 7 days scans)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: recentScans } = await db.from('scan_history')
      .select('scanned_at')
      .gte('scanned_at', sevenDaysAgo.toISOString());

    // Group by day
    const dailyScans: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dailyScans[date.toISOString().split('T')[0]] = 0;
    }

    recentScans?.forEach((scan: { scanned_at: string }) => {
      const day = scan.scanned_at.split('T')[0];
      if (day in dailyScans) {
        dailyScans[day]++;
      }
    });

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      totalScans: totalScans || 0,
      scansToday: scansToday || 0,
      avgSecurityScore,
      criticalFindingsTotal,
      highFindingsTotal,
      monthlyRevenue,
      newUsersThisMonth: newUsersThisMonth || 0,
      subscriptionCounts,
      dailyScans: Object.entries(dailyScans).map(([date, count]) => ({ date, count })),
      conversionRate: totalUsers && totalUsers > 0
        ? ((subscriptionCounts.starter + subscriptionCounts.pro) / totalUsers * 100).toFixed(1)
        : 0,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
