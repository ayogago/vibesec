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
          <div style="text-align: center; margin-bottom: 20px; padding: 20px; background: linear-gradient(135deg, #064e3b 0%, #022c22 100%); border-radius: 12px;">
            <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
              <tr>
                <td style="vertical-align: middle; padding-right: 8px;">
                  <!-- Shield with Lock Icon -->
                  <div style="width: 40px; height: 44px; display: inline-block;">
                    <svg width="40" height="44" viewBox="0 0 44 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22 4L6 10v10c0 9 6.5 17.5 16 21 9.5-3.5 16-12 16-21V10L22 4z" fill="#064e3b" stroke="#34d399" stroke-width="2"/>
                      <rect x="14" y="19" width="16" height="12" rx="2" fill="#10b981"/>
                      <path d="M17 19v-4a5 5 0 0 1 10 0v4" stroke="#10b981" stroke-width="2.5" fill="none" stroke-linecap="round"/>
                      <circle cx="22" cy="24" r="2" fill="#022c22"/>
                      <path d="M22 25v3" stroke="#022c22" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                  </div>
                </td>
                <td style="vertical-align: middle;">
                  <span style="font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">
                    <span style="color: #ffffff;">Secure</span><span style="color: #10b981;">Site</span><span style="color: #ffffff;">Scan</span><span style="color: #9ca3af; font-size: 16px; font-weight: 500;">.com</span>
                  </span>
                </td>
              </tr>
            </table>
          </div>
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
