'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

const securityChecks = [
  { name: 'Supabase RLS', icon: '🔐' },
  { name: 'API Keys', icon: '🔑' },
  { name: 'SQL Injection', icon: '💉' },
  { name: 'XSS', icon: '🎭' },
  { name: 'Auth Issues', icon: '🚪' },
  { name: 'CORS', icon: '🌐' },
  { name: 'IDOR', icon: '🎯' },
  { name: 'Path Traversal', icon: '📁' },
];

const features = [
  {
    title: 'RLS Policy Detection',
    description: 'Automatically finds Supabase tables without Row Level Security enabled. AI tools often forget this critical step.',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    color: 'text-red-500 bg-red-500/10',
  },
  {
    title: 'Secret Detection',
    description: 'Finds hardcoded API keys, Stripe secrets, OpenAI keys, and 20+ other credential types before they leak.',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
      </svg>
    ),
    color: 'text-yellow-500 bg-yellow-500/10',
  },
  {
    title: 'Injection Prevention',
    description: 'Detects SQL injection, NoSQL injection, command injection, and XSS vulnerabilities in your code.',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    color: 'text-orange-500 bg-orange-500/10',
  },
  {
    title: 'Auth & Access Control',
    description: 'Finds unprotected API routes, missing authentication, and client-side security checks that can be bypassed.',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    color: 'text-blue-500 bg-blue-500/10',
  },
  {
    title: 'IDOR Detection',
    description: 'Catches insecure direct object references where users can access other users\' data by changing IDs.',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    color: 'text-purple-500 bg-purple-500/10',
  },
  {
    title: 'Dependency Audit',
    description: 'Checks package.json for known vulnerable dependencies and outdated packages with security issues.',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    color: 'text-green-500 bg-green-500/10',
  },
];

const testimonials = [
  {
    quote: "VibeSec caught a critical RLS vulnerability in my Bolt.new app that would have exposed all user data. Literally saved my startup.",
    author: "Sarah Chen",
    role: "Founder, Taskflow",
    avatar: "/images/avatars/sarah.jpg",
  },
  {
    quote: "I use v0 and Lovable for prototyping. VibeSec is now part of my workflow before every deployment. Essential tool.",
    author: "Marcus Rodriguez",
    role: "Senior Developer",
    avatar: "/images/avatars/marcus.jpg",
  },
  {
    quote: "Found three hardcoded API keys in a client project. The scan took 10 seconds. This should be mandatory for all AI-generated code.",
    author: "Alex Thompson",
    role: "Security Consultant",
    avatar: "/images/avatars/alex.jpg",
  },
];

const stats = [
  { value: '40+', label: 'Security Checks' },
  { value: '10K+', label: 'Repos Scanned' },
  { value: '50K+', label: 'Vulns Found' },
  { value: '<10s', label: 'Avg Scan Time' },
];

export default function HomePage() {
  const [repoUrl, setRepoUrl] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const validateGitHubUrl = (url: string): boolean => {
    const pattern = /^https?:\/\/(www\.)?github\.com\/[^\/]+\/[^\/]+/;
    return pattern.test(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!repoUrl.trim()) {
      setError('Please enter a repository URL');
      return;
    }

    if (!validateGitHubUrl(repoUrl)) {
      setError('Please enter a valid GitHub repository URL');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl, githubToken: githubToken || undefined }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to scan repository');
      }

      sessionStorage.setItem('scanResult', JSON.stringify(data));
      router.push('/results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-b from-green-500/5 via-transparent to-transparent" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-green-500/10 rounded-full blur-3xl" />
          </div>

          <div className="container mx-auto px-4 pt-20 pb-24 md:pt-32 md:pb-32">
            <div className="mx-auto max-w-4xl text-center">
              {/* Badge */}
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-4 py-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
                </span>
                <span className="text-sm font-medium text-green-400">40+ Security Checks Available</span>
              </div>

              {/* Headline */}
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                Don&apos;t let your{' '}
                <span className="bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
                  Vibe Code
                </span>{' '}
                leak your data
              </h1>

              {/* Subheadline */}
              <p className="mt-6 text-lg text-muted-foreground md:text-xl max-w-2xl mx-auto">
                Instant security scanning for AI-generated apps. Built for{' '}
                <span className="text-foreground font-medium">Bolt.new</span>,{' '}
                <span className="text-foreground font-medium">Lovable</span>,{' '}
                <span className="text-foreground font-medium">v0</span>, and{' '}
                <span className="text-foreground font-medium">Claude Code</span>.
              </p>

              {/* Scanner Form */}
              <div id="scanner" className="mt-10 mx-auto max-w-2xl">
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-2xl shadow-green-500/5">
                  <CardContent className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="flex gap-3">
                        <div className="relative flex-1">
                          <svg
                            className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                          <Input
                            type="url"
                            placeholder="https://github.com/username/repo"
                            value={repoUrl}
                            onChange={(e) => {
                              setRepoUrl(e.target.value);
                              setError('');
                            }}
                            className="h-12 pl-10 bg-background/80 border-border/50 text-base"
                            disabled={isLoading}
                          />
                        </div>
                        <Button
                          type="submit"
                          size="lg"
                          className="h-12 px-8 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold shadow-lg shadow-green-500/25 transition-all hover:shadow-green-500/40"
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <span className="flex items-center gap-2">
                              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              Scanning...
                            </span>
                          ) : (
                            <span className="flex items-center gap-2">
                              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                              </svg>
                              Scan Now
                            </span>
                          )}
                        </Button>
                      </div>

                      {error && (
                        <div className="flex items-center gap-2 text-red-500 text-sm">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {error}
                        </div>
                      )}

                      {/* Token Input Toggle */}
                      <div className="pt-2 border-t border-border/30">
                        <button
                          type="button"
                          onClick={() => setShowTokenInput(!showTokenInput)}
                          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
                        >
                          <svg
                            className={`h-3 w-3 transition-transform ${showTokenInput ? 'rotate-90' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          {showTokenInput ? 'Hide' : 'Add'} GitHub Token (for rate limits)
                        </button>

                        {showTokenInput && (
                          <div className="mt-3 space-y-2">
                            <Input
                              type="password"
                              placeholder="ghp_xxxxxxxxxxxx"
                              value={githubToken}
                              onChange={(e) => setGithubToken(e.target.value)}
                              className="h-10 bg-background/80 border-border/50 text-sm font-mono"
                              disabled={isLoading}
                            />
                            <p className="text-xs text-muted-foreground">
                              Optional:{' '}
                              <a
                                href="https://github.com/settings/tokens/new?scopes=repo&description=VibeSec%20Scanner"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-green-500 hover:underline"
                              >
                                Create a token
                              </a>{' '}
                              to avoid rate limits. Never stored.
                            </p>
                          </div>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground text-center">
                        Public repositories only. Code analyzed in memory, never stored.
                      </p>
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* Security checks ticker */}
              <div className="mt-8 flex flex-wrap justify-center gap-2">
                {securityChecks.map((check) => (
                  <Badge
                    key={check.name}
                    variant="outline"
                    className="px-3 py-1.5 text-sm border-border/50 bg-background/50 backdrop-blur-sm"
                  >
                    <span className="mr-1.5">{check.icon}</span>
                    {check.name}
                  </Badge>
                ))}
              </div>

              {/* Hero Image */}
              <div className="mt-16 relative">
                <div className="relative mx-auto max-w-4xl rounded-xl overflow-hidden border border-border/50 shadow-2xl shadow-green-500/10">
                  <Image
                    src="/images/hero/security-dashboard.jpg"
                    alt="VibeSec Security Dashboard"
                    width={1200}
                    height={800}
                    className="w-full h-auto"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex items-center gap-2 text-sm text-white/90">
                      <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                      Scanning repositories in real-time
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="border-y border-border/40 bg-muted/30">
          <div className="container mx-auto px-4 py-12">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl font-bold text-foreground md:text-4xl">{stat.value}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 md:py-28">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl text-center mb-16">
              <Badge variant="outline" className="mb-4">Features</Badge>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Security issues AI tools miss
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                AI coding tools are great at building fast, but they often skip critical security measures.
                VibeSec catches what they miss.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <Card key={feature.title} className="border-border/50 bg-card/50 backdrop-blur-sm transition-all hover:shadow-lg hover:shadow-green-500/5 hover:border-green-500/20">
                  <CardContent className="p-6">
                    <div className={`inline-flex h-12 w-12 items-center justify-center rounded-lg ${feature.color}`}>
                      {feature.icon}
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 md:py-28 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl text-center mb-16">
              <Badge variant="outline" className="mb-4">How It Works</Badge>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Security scanning in seconds
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                No setup, no installation, no configuration. Just paste your repo URL.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3 max-w-4xl mx-auto">
              {[
                {
                  step: '1',
                  title: 'Paste Your Repo URL',
                  description: 'Enter any public GitHub repository URL. Works with any language or framework.',
                },
                {
                  step: '2',
                  title: 'We Scan Your Code',
                  description: '40+ security checks run in parallel. Results in under 10 seconds.',
                },
                {
                  step: '3',
                  title: 'Fix The Issues',
                  description: 'Get detailed findings with exact file locations and fix suggestions.',
                },
              ].map((item) => (
                <div key={item.step} className="relative text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-600 text-xl font-bold text-white shadow-lg shadow-green-500/25">
                    {item.step}
                  </div>
                  <h3 className="mt-6 text-lg font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 md:py-28">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl text-center mb-16">
              <Badge variant="outline" className="mb-4">Testimonials</Badge>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Trusted by developers
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
              {testimonials.map((testimonial) => (
                <Card key={testimonial.author} className="border-border/50 bg-card/50">
                  <CardContent className="p-6">
                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className="h-5 w-5 text-yellow-500 fill-current" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <p className="text-muted-foreground">&ldquo;{testimonial.quote}&rdquo;</p>
                    <div className="mt-6 flex items-center gap-3">
                      <Image
                        src={testimonial.avatar}
                        alt={testimonial.author}
                        width={40}
                        height={40}
                        className="rounded-full object-cover"
                      />
                      <div>
                        <div className="font-medium">{testimonial.author}</div>
                        <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 md:py-28 bg-gradient-to-b from-green-500/10 via-green-500/5 to-transparent">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Ready to secure your app?
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Scan your first repository for free. No signup required.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700" asChild>
                  <Link href="#scanner">Start Scanning</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/how-it-works">Learn More</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
