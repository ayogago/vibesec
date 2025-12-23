'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

const securityChecks = [
  'RLS Policies',
  'API Keys',
  'SQL Injection',
  'XSS',
  'Auth Issues',
  'IDOR',
  'Secrets',
  'CSRF',
];

const features = [
  {
    title: 'Instant Analysis',
    description: 'Paste your repo URL and get results in seconds. No setup required.',
    icon: '⚡',
  },
  {
    title: 'AI-Aware Scanning',
    description: 'Tuned for Bolt, Lovable, v0, and Claude Code patterns.',
    icon: '🤖',
  },
  {
    title: 'Actionable Fixes',
    description: 'Get specific code suggestions with before/after examples.',
    icon: '🔧',
  },
  {
    title: '40+ Security Checks',
    description: 'RLS, secrets, injections, auth flaws, and more.',
    icon: '🛡️',
  },
];

const codeExample = `$ securesitescan https://github.com/user/repo

Scanning repository...

✓ Checking RLS policies
✓ Scanning for exposed secrets
✓ Analyzing SQL queries
✓ Reviewing authentication
✓ Detecting XSS vulnerabilities

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Security Score: 72/100

Found 3 issues:
  ⚠️  HIGH: API key exposed in .env.local
  ⚠️  MEDIUM: Missing RLS on 'users' table
  ⚠️  LOW: No rate limiting on /api/auth

View full report →`;

export default function HomePage() {
  const { data: session } = useSession();
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
    <div className="min-h-screen bg-[#0a0a0a]">
      <Header />

      <main>
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
          {/* Background Effects */}
          <div className="absolute inset-0">
            {/* Gradient orbs */}
            <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[150px]" />
            <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-green-600/10 rounded-full blur-[120px]" />

            {/* Grid pattern */}
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                                  linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                backgroundSize: '60px 60px',
              }}
            />
          </div>

          <div className="container mx-auto px-4 py-20 relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              {/* Left Column - Text & Scanner */}
              <div className="space-y-8">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Now with 40+ security checks
                </div>

                {/* Headline */}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.1]">
                  Scan your AI-generated code for{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-300">
                    security issues
                  </span>
                </h1>

                {/* Subheadline */}
                <p className="text-lg text-zinc-400 max-w-lg leading-relaxed">
                  Instant security scanning built for code from{' '}
                  <span className="text-zinc-300">Bolt.new</span>,{' '}
                  <span className="text-zinc-300">Lovable</span>,{' '}
                  <span className="text-zinc-300">v0</span>, and{' '}
                  <span className="text-zinc-300">Claude Code</span>.
                  Find vulnerabilities before you deploy.
                </p>

                {/* Scanner Input */}
                <div id="scanner" className="space-y-4">
                  <form onSubmit={handleSubmit}>
                    <div className="flex gap-3">
                      <div className="flex-1 relative">
                        <input
                          type="url"
                          placeholder="https://github.com/username/repo"
                          value={repoUrl}
                          onChange={(e) => {
                            setRepoUrl(e.target.value);
                            setError('');
                          }}
                          className="w-full h-12 px-4 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                          disabled={isLoading}
                        />
                      </div>
                      <Button
                        type="submit"
                        size="lg"
                        className="h-12 px-6 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                        ) : (
                          'Scan Repository'
                        )}
                      </Button>
                    </div>

                    {error && (
                      <p className="mt-2 text-sm text-red-400 flex items-center gap-2">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {error}
                      </p>
                    )}
                  </form>

                  <div className="flex items-center gap-4 text-sm text-zinc-500">
                    <button
                      type="button"
                      onClick={() => setShowTokenInput(!showTokenInput)}
                      className="hover:text-zinc-300 transition-colors flex items-center gap-1"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                      {showTokenInput ? 'Hide' : 'Add'} GitHub token
                    </button>
                    <span className="text-zinc-600">•</span>
                    <span>Works with public repos</span>
                  </div>

                  {showTokenInput && (
                    <div className="space-y-2">
                      <input
                        type="password"
                        placeholder="ghp_xxxxxxxxxxxx"
                        value={githubToken}
                        onChange={(e) => setGithubToken(e.target.value)}
                        className="w-full h-10 px-3 rounded-lg bg-zinc-900 border border-zinc-800 text-sm font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50"
                        disabled={isLoading}
                      />
                      <p className="text-xs text-zinc-500">
                        <a
                          href="https://github.com/settings/tokens/new?scopes=repo&description=SecureSiteScan"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-400 hover:underline"
                        >
                          Create a token
                        </a>{' '}
                        to scan private repos
                      </p>
                    </div>
                  )}
                </div>

                {/* Security check tags */}
                <div className="flex flex-wrap gap-2">
                  {securityChecks.map((check) => (
                    <span
                      key={check}
                      className="px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-xs text-zinc-400"
                    >
                      {check}
                    </span>
                  ))}
                </div>
              </div>

              {/* Right Column - Terminal Demo */}
              <div className="relative">
                {/* Glow effect behind terminal */}
                <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/20 to-green-500/20 rounded-2xl blur-xl opacity-50" />

                {/* Terminal window */}
                <div className="relative rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 shadow-2xl">
                  {/* Terminal header */}
                  <div className="flex items-center gap-2 px-4 py-3 bg-zinc-900 border-b border-zinc-800">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500/80" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                      <div className="w-3 h-3 rounded-full bg-green-500/80" />
                    </div>
                    <span className="ml-2 text-xs text-zinc-500 font-mono">terminal</span>
                  </div>

                  {/* Terminal content */}
                  <div className="p-4 font-mono text-sm leading-relaxed">
                    <pre className="text-zinc-300 whitespace-pre-wrap">
                      <code>{codeExample}</code>
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20 border-y border-zinc-800/50 bg-zinc-900/30">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { value: '40+', label: 'Security Checks' },
                { value: '10K+', label: 'Repos Scanned' },
                { value: '50K+', label: 'Vulns Found' },
                { value: '<10s', label: 'Scan Time' },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-300">
                    {stat.value}
                  </div>
                  <div className="mt-1 text-sm text-zinc-500">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 relative">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/5 to-transparent" />

          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Built for the AI code generation era
              </h2>
              <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
                AI tools build fast but often skip critical security measures.
                SecureSiteScan catches what they miss.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="group p-6 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-all hover:bg-zinc-900/80"
                >
                  <div className="text-3xl mb-4">{feature.icon}</div>
                  <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-24 bg-zinc-900/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Scan in three steps
              </h2>
              <p className="text-lg text-zinc-400">
                No setup. No installation. No configuration.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {[
                {
                  step: '01',
                  title: 'Paste URL',
                  description: 'Enter any public GitHub repository URL into the scanner.',
                },
                {
                  step: '02',
                  title: 'We Analyze',
                  description: '40+ security checks run in parallel. Results in under 10 seconds.',
                },
                {
                  step: '03',
                  title: 'Fix Issues',
                  description: 'Get detailed findings with exact file locations and fix suggestions.',
                },
              ].map((item, index) => (
                <div key={item.step} className="relative text-center">
                  {index < 2 && (
                    <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-px bg-gradient-to-r from-zinc-700 to-transparent" />
                  )}
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-zinc-800 border border-zinc-700 mb-4">
                    <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-300">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-zinc-400">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Code Example Section */}
        <section className="py-24 relative overflow-hidden">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
              <div className="space-y-6">
                <h2 className="text-3xl md:text-4xl font-bold text-white">
                  Detailed reports with{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-300">
                    actionable fixes
                  </span>
                </h2>
                <p className="text-lg text-zinc-400 leading-relaxed">
                  Every vulnerability comes with a clear explanation, risk assessment,
                  and step-by-step fix instructions. No more guessing what to do next.
                </p>
                <ul className="space-y-3">
                  {[
                    'Exact file and line locations',
                    'Severity scoring (Critical, High, Medium, Low)',
                    'Code snippets with suggested fixes',
                    'Links to security best practices',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-zinc-300">
                      <svg className="h-5 w-5 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Sample vulnerability card */}
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-2xl blur-xl" />
                <div className="relative rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950">
                  <div className="px-4 py-3 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
                    <span className="text-sm font-medium text-white">Vulnerability Report</span>
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
                      HIGH
                    </span>
                  </div>
                  <div className="p-4 space-y-4">
                    <div>
                      <h4 className="text-white font-medium mb-1">API Key Exposed in Source</h4>
                      <p className="text-sm text-zinc-400">
                        A Supabase service role key was found in the source code.
                      </p>
                    </div>
                    <div className="rounded-lg bg-zinc-900 p-3 font-mono text-xs">
                      <div className="text-zinc-500 mb-1">// src/lib/supabase.ts:12</div>
                      <div className="text-red-400">- const key = "eyJhbGciOiJIUzI1NiIs..."</div>
                      <div className="text-emerald-400">+ const key = process.env.SUPABASE_KEY</div>
                    </div>
                    <div className="pt-2 border-t border-zinc-800">
                      <p className="text-xs text-zinc-500">
                        <span className="text-emerald-400">Fix:</span> Move sensitive keys to environment variables and add .env to .gitignore
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 relative overflow-hidden">
          {/* Background effect */}
          <div className="absolute inset-0">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-emerald-500/20 via-green-500/20 to-teal-500/20 rounded-full blur-[120px]" />
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to ship secure code?
              </h2>
              <p className="text-lg text-zinc-400 mb-8">
                Scan your first repository for free. No signup required.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="h-12 px-8 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium"
                  asChild
                >
                  <Link href="#scanner">
                    Start Scanning
                    <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 px-8 rounded-lg border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                  asChild
                >
                  <Link href="/pricing">View Pricing</Link>
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
