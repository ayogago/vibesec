import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import * as db from '@/lib/db';

// GET - Fetch user's scan history
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!db.isDatabaseConfigured()) {
      return NextResponse.json({ scans: [] });
    }

    const scans = await db.getScanHistory(session.user.id);

    return NextResponse.json({ scans });
  } catch (error) {
    console.error('Error fetching scans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scan history' },
      { status: 500 }
    );
  }
}

// POST - Add a new scan to history
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!db.isDatabaseConfigured()) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    const scanData = await request.json();

    // Check if user can scan (rate limiting)
    const user = await db.findUserById(session.user.id);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const canScan = await db.canUserScan(session.user.id, user.subscription);
    if (!canScan.allowed) {
      return NextResponse.json(
        { error: canScan.reason },
        { status: 429 }
      );
    }

    const scan = await db.addScanToHistory(session.user.id, {
      repo_name: scanData.repoName,
      repo_url: scanData.repoUrl,
      security_score: scanData.securityScore,
      total_findings: scanData.totalFindings || 0,
      critical_count: scanData.criticalCount || 0,
      high_count: scanData.highCount || 0,
      medium_count: scanData.mediumCount || 0,
      low_count: scanData.lowCount || 0,
    });

    if (!scan) {
      return NextResponse.json(
        { error: 'Failed to save scan' },
        { status: 500 }
      );
    }

    return NextResponse.json({ scan });
  } catch (error) {
    console.error('Error saving scan:', error);
    return NextResponse.json(
      { error: 'Failed to save scan' },
      { status: 500 }
    );
  }
}

// DELETE - Clear scan history
export async function DELETE() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!db.isDatabaseConfigured()) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    const success = await db.clearScanHistory(session.user.id);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to clear history' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Scan history cleared' });
  } catch (error) {
    console.error('Error clearing scans:', error);
    return NextResponse.json(
      { error: 'Failed to clear scan history' },
      { status: 500 }
    );
  }
}
