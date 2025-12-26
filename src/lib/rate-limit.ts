// Simple in-memory rate limiter for auth endpoints
// Note: For serverless, consider using Redis or Upstash for distributed rate limiting

interface RateLimitEntry {
  count: number;
  firstRequest: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up old entries periodically
const CLEANUP_INTERVAL = 60 * 1000; // 1 minute
let lastCleanup = Date.now();

function cleanup(windowMs: number): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;

  lastCleanup = now;
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now - entry.firstRequest > windowMs) {
      rateLimitStore.delete(key);
    }
  }
}

interface RateLimitOptions {
  windowMs?: number; // Time window in milliseconds (default: 15 minutes)
  max?: number; // Max requests per window (default: 5)
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
}

export function rateLimit(
  identifier: string,
  options: RateLimitOptions = {}
): RateLimitResult {
  const { windowMs = 15 * 60 * 1000, max = 5 } = options;

  cleanup(windowMs);

  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  if (!entry || now - entry.firstRequest > windowMs) {
    // First request or window expired
    rateLimitStore.set(identifier, { count: 1, firstRequest: now });
    return {
      success: true,
      remaining: max - 1,
      resetTime: now + windowMs,
    };
  }

  if (entry.count >= max) {
    // Rate limit exceeded
    return {
      success: false,
      remaining: 0,
      resetTime: entry.firstRequest + windowMs,
    };
  }

  // Increment counter
  entry.count++;
  return {
    success: true,
    remaining: max - entry.count,
    resetTime: entry.firstRequest + windowMs,
  };
}

// Get client IP from request headers
export function getClientIP(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  return 'unknown';
}

// Rate limit configurations for different endpoints
export const RATE_LIMITS = {
  login: { windowMs: 15 * 60 * 1000, max: 5 }, // 5 attempts per 15 minutes
  register: { windowMs: 60 * 60 * 1000, max: 3 }, // 3 registrations per hour
  forgotPassword: { windowMs: 60 * 60 * 1000, max: 3 }, // 3 requests per hour
  resetPassword: { windowMs: 60 * 60 * 1000, max: 5 }, // 5 attempts per hour
  changePassword: { windowMs: 15 * 60 * 1000, max: 5 }, // 5 attempts per 15 minutes
} as const;
