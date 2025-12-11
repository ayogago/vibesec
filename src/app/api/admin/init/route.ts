import { NextResponse } from 'next/server';
import { initializeAdminUser, isDatabaseConfigured, findUserByEmail, ADMIN_CREDENTIALS } from '@/lib/db/users';

export async function POST() {
  try {
    if (!isDatabaseConfigured()) {
      return NextResponse.json({
        success: false,
        message: 'Database not configured. Using localStorage fallback.',
        useLocalStorage: true,
      });
    }

    await initializeAdminUser();

    // Verify admin was created
    const admin = await findUserByEmail(ADMIN_CREDENTIALS.email);

    return NextResponse.json({
      success: !!admin,
      message: admin ? 'Admin user initialized' : 'Admin user creation failed',
      adminEmail: ADMIN_CREDENTIALS.email,
    });
  } catch (error) {
    console.error('Admin init error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to initialize admin' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    if (!isDatabaseConfigured()) {
      return NextResponse.json({
        configured: false,
        message: 'Database not configured',
      });
    }

    const admin = await findUserByEmail(ADMIN_CREDENTIALS.email);

    return NextResponse.json({
      configured: true,
      adminExists: !!admin,
      adminEmail: ADMIN_CREDENTIALS.email,
    });
  } catch (error) {
    console.error('Admin check error:', error);
    return NextResponse.json(
      { configured: false, error: 'Failed to check admin status' },
      { status: 500 }
    );
  }
}
