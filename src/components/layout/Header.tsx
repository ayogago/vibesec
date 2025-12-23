'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';
import { LogOut, User, ChevronDown, LayoutDashboard, Settings } from 'lucide-react';

const navigation = [
  { name: 'Features', href: '/#features' },
  { name: 'How It Works', href: '/how-it-works' },
  { name: 'Pricing', href: '/pricing' },
  { name: 'About', href: '/about' },
];

const ADMIN_EMAILS = ["info@securesitescan.com", "owner@securesitescan.com"];

export function Header() {
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const isAdmin = session?.user?.email && ADMIN_EMAILS.includes(session.user.email);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/50'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Logo size="md" />

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:gap-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Desktop CTA / User Menu */}
          <div className="hidden md:flex md:items-center md:gap-3">
            {status === 'loading' ? (
              <div className="h-9 w-24 animate-pulse bg-zinc-800 rounded-lg" />
            ) : session ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 rounded-lg bg-zinc-900 px-3 py-2 border border-zinc-800 hover:border-zinc-700 transition-colors"
                >
                  {session.user?.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user.name || 'User'}
                      className="h-6 w-6 rounded-full"
                    />
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <User className="h-3.5 w-3.5 text-emerald-400" />
                    </div>
                  )}
                  <span className="text-sm text-zinc-300 max-w-[100px] truncate">
                    {session.user?.name?.split(' ')[0] || 'User'}
                  </span>
                  <ChevronDown className={`h-4 w-4 text-zinc-500 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-lg bg-zinc-900 border border-zinc-800 shadow-xl py-1 overflow-hidden">
                    <div className="px-4 py-3 border-b border-zinc-800">
                      <p className="text-sm font-medium text-white">{session.user?.name}</p>
                      <p className="text-xs text-zinc-500 truncate">{session.user?.email}</p>
                    </div>

                    <div className="py-1">
                      <Link
                        href="/dashboard"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <LayoutDashboard className="h-4 w-4 text-zinc-500" />
                        Dashboard
                      </Link>

                      {isAdmin && (
                        <Link
                          href="/admin"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <Settings className="h-4 w-4 text-zinc-500" />
                          Admin Dashboard
                        </Link>
                      )}
                    </div>

                    <div className="border-t border-zinc-800 py-1">
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          signOut({ callbackUrl: '/' });
                        }}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-zinc-800 transition-colors w-full text-left"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm" className="text-zinc-400 hover:text-white hover:bg-transparent">
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button asChild size="sm" className="rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white px-4">
                  <Link href="/signup">Get Started</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="sr-only">Open main menu</span>
            {mobileMenuOpen ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>
        </nav>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-zinc-950 border-b border-zinc-800">
          <div className="px-4 py-4 space-y-1">
            {session && (
              <div className="flex items-center gap-3 px-4 py-3 mb-3 bg-zinc-900 rounded-lg border border-zinc-800">
                {session.user?.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name || 'User'}
                    className="h-10 w-10 rounded-full"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <User className="h-5 w-5 text-emerald-400" />
                  </div>
                )}
                <div>
                  <p className="font-medium text-white">{session.user?.name}</p>
                  <p className="text-xs text-zinc-500">{session.user?.email}</p>
                </div>
              </div>
            )}

            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block rounded-lg px-4 py-2.5 text-base text-zinc-400 hover:bg-zinc-900 hover:text-white transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}

            {session && (
              <>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-base text-zinc-400 hover:bg-zinc-900 hover:text-white transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-base text-zinc-400 hover:bg-zinc-900 hover:text-white transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Settings className="h-4 w-4" />
                    Admin Dashboard
                  </Link>
                )}
              </>
            )}

            <div className="pt-4 border-t border-zinc-800 mt-4">
              {session ? (
                <Button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    signOut({ callbackUrl: '/' });
                  }}
                  variant="outline"
                  className="w-full border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-white"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              ) : (
                <div className="space-y-2">
                  <Button asChild variant="outline" className="w-full border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-white">
                    <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                      Sign In
                    </Link>
                  </Button>
                  <Button asChild className="w-full bg-emerald-500 hover:bg-emerald-600 text-white">
                    <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                      Get Started
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
