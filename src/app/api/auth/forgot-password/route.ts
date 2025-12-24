import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import * as db from '@/lib/db';

// Rate limiting
const resetRateLimit = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS = 3; // 3 requests per hour per email

function checkRateLimit(email: string): boolean {
  const now = Date.now();
  const key = email.toLowerCase();
  const record = resetRateLimit.get(key);

  if (!record || record.resetTime < now) {
    resetRateLimit.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (record.count >= MAX_REQUESTS) {
    return false;
  }

  record.count++;
  return true;
}

// Create email transporter
function createTransporter() {
  return nodemailer.createTransport({
    host: 'smtppro.zoho.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.ZOHO_EMAIL_USER || 'info@securesitescan.com',
      pass: process.env.ZOHO_EMAIL_PASSWORD,
    },
  });
}

// Get base URL for reset link
function getBaseUrl(): string {
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Rate limiting
    if (!checkRateLimit(email)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Check if database is configured
    if (!db.isDatabaseConfigured()) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    // Find user by email
    const user = await db.findUserByEmail(email);

    // Always return success to prevent email enumeration
    // But only send email if user exists
    if (user) {
      // Generate secure token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

      // Store token in database
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      const client = createClient(supabaseUrl, supabaseAnonKey);

      const { error: updateError } = await client
        .from('users')
        .update({
          reset_token: resetToken,
          reset_token_expires: resetTokenExpires,
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Failed to store reset token:', updateError);
        return NextResponse.json(
          { error: 'Failed to process request' },
          { status: 500 }
        );
      }

      // Send reset email if SMTP is configured
      if (process.env.ZOHO_EMAIL_PASSWORD) {
        const resetUrl = `${getBaseUrl()}/reset-password?token=${resetToken}`;
        const transporter = createTransporter();

        await transporter.sendMail({
          from: '"SecureSiteScan" <info@securesitescan.com>',
          to: email,
          subject: 'Reset Your Password - SecureSiteScan',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #10b981; margin: 0;">SecureSiteScan</h1>
              </div>

              <h2 style="color: #1f2937;">Reset Your Password</h2>

              <p style="color: #4b5563; line-height: 1.6;">
                We received a request to reset your password. Click the button below to create a new password:
              </p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}"
                   style="display: inline-block; background-color: #10b981; color: white;
                          padding: 14px 28px; text-decoration: none; border-radius: 8px;
                          font-weight: bold;">
                  Reset Password
                </a>
              </div>

              <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
                This link will expire in 1 hour. If you didn't request a password reset,
                you can safely ignore this email.
              </p>

              <p style="color: #6b7280; font-size: 14px;">
                Or copy and paste this link into your browser:<br>
                <a href="${resetUrl}" style="color: #10b981; word-break: break-all;">${resetUrl}</a>
              </p>

              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

              <p style="color: #9ca3af; font-size: 12px; text-align: center;">
                SecureSiteScan - AI-Powered Security Scanning<br>
                <a href="${getBaseUrl()}" style="color: #9ca3af;">www.securesitescan.com</a>
              </p>
            </div>
          `,
          text: `
Reset Your Password

We received a request to reset your password. Visit the link below to create a new password:

${resetUrl}

This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.

---
SecureSiteScan - AI-Powered Security Scanning
          `,
        });
      }
    }

    // Always return success to prevent email enumeration
    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, you will receive a password reset link.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
