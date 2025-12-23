// Subscription tiers and limits
export type SubscriptionTier = 'anonymous' | 'free' | 'starter' | 'pro';

export interface SubscriptionLimits {
  visibleFindings: number; // How many findings can be viewed
  dailyScans: number; // How many scans per day
  price: number; // Monthly price in USD
  name: string;
}

export const SUBSCRIPTION_LIMITS: Record<SubscriptionTier, SubscriptionLimits> = {
  anonymous: {
    visibleFindings: 1,
    dailyScans: 1,
    price: 0,
    name: 'Guest',
  },
  free: {
    visibleFindings: 2,
    dailyScans: 1,
    price: 0,
    name: 'Free',
  },
  starter: {
    visibleFindings: Infinity,
    dailyScans: 10,
    price: 19.99,
    name: 'Starter',
  },
  pro: {
    visibleFindings: Infinity,
    dailyScans: 50,
    price: 99,
    name: 'Pro',
  },
};

// Get user's current subscription (mock for now - would be from auth/database)
export function getUserSubscription(): SubscriptionTier {
  if (typeof window === 'undefined') return 'anonymous';

  const stored = localStorage.getItem('securesitescan_subscription');
  if (stored && ['anonymous', 'free', 'starter', 'pro'].includes(stored)) {
    return stored as SubscriptionTier;
  }
  return 'anonymous';
}

// Set user's subscription (mock for now)
export function setUserSubscription(tier: SubscriptionTier): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('securesitescan_subscription', tier);
}

// Check if user is signed in
export function isUserSignedIn(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('securesitescan_user') !== null;
}

// Mock sign in
export function signInUser(email: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('securesitescan_user', JSON.stringify({ email, createdAt: new Date().toISOString() }));
  // New signups get free tier
  if (getUserSubscription() === 'anonymous') {
    setUserSubscription('free');
  }
}

// Mock sign out
export function signOutUser(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('securesitescan_user');
  setUserSubscription('anonymous');
}

// Get user email if signed in
export function getUserEmail(): string | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem('securesitescan_user');
  if (stored) {
    try {
      return JSON.parse(stored).email;
    } catch {
      return null;
    }
  }
  return null;
}

// Get daily scan count
export function getDailyScanCount(): number {
  if (typeof window === 'undefined') return 0;

  const today = new Date().toDateString();
  const stored = localStorage.getItem('securesitescan_scans');

  if (stored) {
    try {
      const data = JSON.parse(stored);
      if (data.date === today) {
        return data.count;
      }
    } catch {
      // Invalid data, reset
    }
  }
  return 0;
}

// Increment daily scan count
export function incrementScanCount(): void {
  if (typeof window === 'undefined') return;

  const today = new Date().toDateString();
  const current = getDailyScanCount();

  localStorage.setItem('securesitescan_scans', JSON.stringify({
    date: today,
    count: current + 1,
  }));
}

// Check if user can scan
export function canUserScan(): { allowed: boolean; reason?: string } {
  const tier = getUserSubscription();
  const limits = SUBSCRIPTION_LIMITS[tier];
  const scanCount = getDailyScanCount();

  if (scanCount >= limits.dailyScans) {
    return {
      allowed: false,
      reason: `You've reached your daily limit of ${limits.dailyScans} scan${limits.dailyScans === 1 ? '' : 's'}. Upgrade to scan more.`,
    };
  }

  return { allowed: true };
}
