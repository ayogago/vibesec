import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { isDatabaseConfigured, db } from '@/lib/db';

const ADMIN_EMAILS = ["info@securesitescan.com"];

// Default settings
const DEFAULT_SETTINGS = {
  siteName: 'SecureSiteScan.com',
  siteDescription: 'Security Scanner for AI-Generated Apps',
  contactEmail: 'info@securesitescan.com',
  supportEmail: 'info@securesitescan.com',
  maintenanceMode: false,
  registrationEnabled: true,
  scanLimits: {
    anonymous: 1,
    free: 1,
    starter: 10,
    pro: 50,
  },
  pricing: {
    starter: 2.99,
    pro: 9.99,
  },
  features: {
    githubIntegration: false,
    apiAccess: true,
    emailNotifications: false,
  },
};

// In a production app, you'd store settings in the database
// For now, we'll use in-memory storage with defaults
let appSettings = { ...DEFAULT_SETTINGS };

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check database status
    const dbConfigured = isDatabaseConfigured();
    let dbStatus = { connected: false, tables: { users: 0, scans: 0 } };

    if (dbConfigured) {
      try {
        const { count: userCount } = await db.from('users')
          .select('*', { count: 'exact', head: true });
        const { count: scanCount } = await db.from('scan_history')
          .select('*', { count: 'exact', head: true });

        dbStatus = {
          connected: true,
          tables: {
            users: userCount || 0,
            scans: scanCount || 0,
          },
        };
      } catch {
        dbStatus.connected = false;
      }
    }

    return NextResponse.json({
      settings: appSettings,
      database: dbStatus,
      environment: process.env.NODE_ENV,
      version: '1.0.0',
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Merge updates with existing settings
    appSettings = {
      ...appSettings,
      ...body,
      scanLimits: {
        ...appSettings.scanLimits,
        ...(body.scanLimits || {}),
      },
      pricing: {
        ...appSettings.pricing,
        ...(body.pricing || {}),
      },
      features: {
        ...appSettings.features,
        ...(body.features || {}),
      },
    };

    return NextResponse.json({ settings: appSettings });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'reset') {
      appSettings = { ...DEFAULT_SETTINGS };
      return NextResponse.json({ settings: appSettings, message: 'Settings reset to defaults' });
    }

    if (action === 'clearScans') {
      if (!isDatabaseConfigured()) {
        return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
      }

      // Clear all scan history
      await db.from('scan_history').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await db.from('daily_scan_counts').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      return NextResponse.json({ success: true, message: 'All scan history cleared' });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Error processing action:', error);
    return NextResponse.json({ error: 'Failed to process action' }, { status: 500 });
  }
}
