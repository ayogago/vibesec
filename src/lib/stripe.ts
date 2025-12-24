import Stripe from 'stripe';

// Lazy-initialize Stripe to avoid errors during build when env vars aren't set
let _stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-12-15.clover',
      typescript: true,
    });
  }
  return _stripe;
}

// Export stripe as a getter to ensure lazy initialization
export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    const stripeInstance = getStripe();
    return (stripeInstance as unknown as Record<string | symbol, unknown>)[prop];
  },
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
    price: 299, // $2.99 in cents
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
    price: 999, // $9.99 in cents
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
