import { NextRequest, NextResponse } from 'next/server';
import { scanRepository, parseGitHubUrl } from '@/lib/scanner';

export const runtime = 'edge';

// Simple in-memory rate limiter for edge runtime
// In production, use Redis or similar
const rateLimit = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 10; // 10 requests per minute per IP

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimit.get(ip);

  // Clean up old entries periodically
  if (rateLimit.size > 10000) {
    for (const [key, value] of rateLimit.entries()) {
      if (value.resetTime < now) {
        rateLimit.delete(key);
      }
    }
  }

  if (!record || record.resetTime < now) {
    rateLimit.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: MAX_REQUESTS - 1 };
  }

  if (record.count >= MAX_REQUESTS) {
    return { allowed: false, remaining: 0 };
  }

  record.count++;
  return { allowed: true, remaining: MAX_REQUESTS - record.count };
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  return 'unknown';
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = getClientIP(request);
    const { allowed, remaining } = checkRateLimit(clientIP);

    if (!allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait a minute before trying again.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': MAX_REQUESTS.toString(),
            'X-RateLimit-Remaining': '0',
            'Retry-After': '60',
          }
        }
      );
    }

    const body = await request.json();
    const { repoUrl, githubToken: userToken } = body;

    if (!repoUrl) {
      return NextResponse.json(
        { error: 'Repository URL is required' },
        { status: 400 }
      );
    }

    // Validate URL format and length
    if (typeof repoUrl !== 'string' || repoUrl.length > 500) {
      return NextResponse.json(
        { error: 'Invalid repository URL format' },
        { status: 400 }
      );
    }

    // Validate GitHub URL format
    const parsed = parseGitHubUrl(repoUrl);
    if (!parsed) {
      return NextResponse.json(
        { error: 'Invalid GitHub URL. Please provide a valid public repository URL.' },
        { status: 400 }
      );
    }

    // Validate token format if provided
    if (userToken && (typeof userToken !== 'string' || userToken.length > 200)) {
      return NextResponse.json(
        { error: 'Invalid GitHub token format' },
        { status: 400 }
      );
    }

    // Use user-provided token first, then fall back to environment token
    const githubToken = userToken || process.env.GITHUB_TOKEN;

    // Perform the scan
    const result = await scanRepository(repoUrl, githubToken);

    return NextResponse.json(result, {
      headers: {
        'X-RateLimit-Limit': MAX_REQUESTS.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
      }
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'An unexpected error occurred';

    // Handle specific error cases
    if (errorMessage.includes('private') || errorMessage.includes('not found')) {
      return NextResponse.json(
        {
          error:
            'This repo appears to be private or inaccessible. For now, SecureSiteScan only supports public repositories.',
        },
        { status: 404 }
      );
    }

    if (errorMessage.includes('Rate limit')) {
      return NextResponse.json(
        {
          error:
            'GitHub API rate limit exceeded. Please try again in a few minutes or add a GitHub token.',
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: 'An error occurred while scanning. Please try again.' },
      { status: 500 }
    );
  }
}
