'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { signInUser } from '@/lib/subscription';

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode?: 'signup' | 'upgrade';
}

export function SignupModal({ isOpen, onClose, onSuccess, mode = 'signup' }: SignupModalProps) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));

    signInUser(email);
    setIsSubmitting(false);
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <Card className="relative z-10 w-full max-w-md mx-4 shadow-2xl border-border/50">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-600 mb-4">
            <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <CardTitle className="text-2xl">
            {mode === 'upgrade' ? 'Upgrade to See All Findings' : 'Create Free Account'}
          </CardTitle>
          <CardDescription>
            {mode === 'upgrade'
              ? 'Sign up for free to see 2 findings, or upgrade for unlimited access'
              : 'Get started with SecureSiteScan - no credit card required'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12"
                disabled={isSubmitting}
              />
              {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-green-600 hover:bg-green-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating account...
                </>
              ) : (
                'Sign Up Free'
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/40" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or upgrade now</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-auto py-3 flex flex-col items-center gap-1"
                onClick={() => window.location.href = '/pricing'}
              >
                <span className="font-semibold">Starter</span>
                <span className="text-xs text-muted-foreground">$19.99/mo</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-auto py-3 flex flex-col items-center gap-1 border-green-500/50"
                onClick={() => window.location.href = '/pricing'}
              >
                <span className="font-semibold text-green-500">Pro</span>
                <span className="text-xs text-muted-foreground">$99/mo</span>
              </Button>
            </div>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-6">
            By signing up, you agree to our{' '}
            <a href="/terms" className="text-green-500 hover:underline">Terms</a> and{' '}
            <a href="/privacy" className="text-green-500 hover:underline">Privacy Policy</a>
          </p>
        </CardContent>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </Card>
    </div>
  );
}
