// Signed cookie helper to prevent tampering
// Uses HMAC-SHA256 for signature verification

import crypto from 'crypto';

// Get signing secret - falls back to AUTH_SECRET if COOKIE_SECRET not set
function getSecret(): string {
  const secret = process.env.COOKIE_SECRET || process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error('COOKIE_SECRET or AUTH_SECRET environment variable is required');
  }
  return secret;
}

// Sign a value with HMAC-SHA256
export function signValue(value: string): string {
  const secret = getSecret();
  const signature = crypto
    .createHmac('sha256', secret)
    .update(value)
    .digest('base64url');
  return `${value}.${signature}`;
}

// Verify and extract value from signed cookie
// Returns null if signature is invalid
export function verifySignedValue(signedValue: string): string | null {
  const secret = getSecret();
  const lastDotIndex = signedValue.lastIndexOf('.');

  if (lastDotIndex === -1) {
    return null;
  }

  const value = signedValue.slice(0, lastDotIndex);
  const signature = signedValue.slice(lastDotIndex + 1);

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(value)
    .digest('base64url');

  // Use timing-safe comparison to prevent timing attacks
  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (sigBuffer.length !== expectedBuffer.length) {
    return null;
  }

  if (!crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
    return null;
  }

  return value;
}
