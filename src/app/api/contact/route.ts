import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Rate limiting for email sending
const emailRateLimit = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const MAX_EMAILS = 5; // 5 emails per hour per IP

function checkEmailRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = emailRateLimit.get(ip);

  if (!record || record.resetTime < now) {
    emailRateLimit.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (record.count >= MAX_EMAILS) {
    return false;
  }

  record.count++;
  return true;
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  if (forwarded) return forwarded.split(',')[0].trim();
  if (realIP) return realIP;
  return 'unknown';
}

// Create Zoho SMTP transporter
function createTransporter() {
  return nodemailer.createTransport({
    host: 'smtppro.zoho.com',
    port: 465,
    secure: true, // SSL
    auth: {
      user: process.env.ZOHO_EMAIL_USER || 'info@securesitescan.com',
      pass: process.env.ZOHO_EMAIL_PASSWORD,
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = getClientIP(request);
    if (!checkEmailRateLimit(clientIP)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { name, email, company, subject, message } = body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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

    // Validate field lengths
    if (name.length > 100 || email.length > 100 || message.length > 5000) {
      return NextResponse.json(
        { error: 'Field length exceeds maximum allowed' },
        { status: 400 }
      );
    }

    // Check if SMTP is configured
    if (!process.env.ZOHO_EMAIL_PASSWORD) {
      // In development, just log and return success
      if (process.env.NODE_ENV === 'development') {
        return NextResponse.json({ success: true, message: 'Email logged (dev mode)' });
      }
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      );
    }

    const transporter = createTransporter();

    // Subject mapping
    const subjectMap: Record<string, string> = {
      general: 'General Inquiry',
      support: 'Technical Support',
      sales: 'Sales / Enterprise',
      partnership: 'Partnership',
      feedback: 'Feedback',
    };

    const emailSubject = `[SecureSiteScan] ${subjectMap[subject] || subject}: from ${name}`;

    // Send email
    await transporter.sendMail({
      from: '"SecureSiteScan Contact" <info@securesitescan.com>',
      to: 'info@securesitescan.com',
      replyTo: email,
      subject: emailSubject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10b981;">New Contact Form Submission</h2>
          <hr style="border: 1px solid #e5e7eb;" />

          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px 0; font-weight: bold; width: 120px;">Name:</td>
              <td style="padding: 10px 0;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; font-weight: bold;">Email:</td>
              <td style="padding: 10px 0;"><a href="mailto:${email}">${email}</a></td>
            </tr>
            ${company ? `
            <tr>
              <td style="padding: 10px 0; font-weight: bold;">Company:</td>
              <td style="padding: 10px 0;">${company}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 10px 0; font-weight: bold;">Subject:</td>
              <td style="padding: 10px 0;">${subjectMap[subject] || subject}</td>
            </tr>
          </table>

          <h3 style="margin-top: 20px;">Message:</h3>
          <div style="background: #f9fafb; padding: 15px; border-radius: 8px; white-space: pre-wrap;">${message}</div>

          <hr style="border: 1px solid #e5e7eb; margin-top: 30px;" />
          <p style="color: #6b7280; font-size: 12px;">
            This email was sent from the SecureSiteScan contact form.
          </p>
        </div>
      `,
      text: `
New Contact Form Submission
----------------------------

Name: ${name}
Email: ${email}
${company ? `Company: ${company}` : ''}
Subject: ${subjectMap[subject] || subject}

Message:
${message}

---
This email was sent from the SecureSiteScan contact form.
      `,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Failed to send email. Please try again.' },
      { status: 500 }
    );
  }
}
