import Stripe from 'stripe';

// Initialize Stripe with the secret key
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
  typescript: true,
});

// Price IDs for each subscription tier (set these in your Stripe dashboard)
export const STRIPE_PRICE_IDS = {
  starter: process.env.STRIPE_STARTER_PRICE_ID || '',
  pro: process.env.STRIPE_PRO_PRICE_ID || '',
} as const;

// Product metadata
export const STRIPE_PRODUCTS = {
  starter: {
    name: 'Starter Plan',
    description: 'For indie hackers and solo developers',
    price: 1999, // $19.99 in cents
    features: [
      '10 scans per day',
      'View all findings',
      'Detailed fix suggestions',
      'JSON export',
    ],
  },
  pro: {
    name: 'Pro Plan',
    description: 'For teams and agencies shipping daily',
    price: 9900, // $99 in cents
    features: [
      '50 scans per day',
      'Everything in Starter',
      'PDF export',
      'Priority support',
    ],
  },
} as const;

// Helper to check if Stripe is configured
export function isStripeConfigured(): boolean {
  return !!(
    process.env.STRIPE_SECRET_KEY &&
    process.env.STRIPE_STARTER_PRICE_ID &&
    process.env.STRIPE_PRO_PRICE_ID
  );
}

// Get the base URL for redirects
export function getBaseUrl(): string {
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'http://localhost:3000';
}
