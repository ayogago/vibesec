import Link from 'next/link';
import Image from 'next/image';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';

const steps = [
  {
    number: '01',
    title: 'Paste Your GitHub URL',
    description: 'Simply paste any public GitHub repository URL into our scanner. No installation, no configuration, no signup required.',
    details: [
      'Supports any public GitHub repository',
      'Automatically detects project type and frameworks',
      'Works with monorepos and nested structures',
    ],
    icon: (
      <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
  },
  {
    number: '02',
    title: 'We Analyze Your Code',
    description: 'Our scanner fetches your repository and runs 40+ security checks in seconds, analyzing patterns commonly found in AI-generated code.',
    details: [
      'Static analysis without executing code',
      'Pattern matching for known vulnerabilities',
      'Framework-specific security checks',
      'Secrets and credential detection',
    ],
    icon: (
      <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    number: '03',
    title: 'Get Actionable Results',
    description: 'Receive a detailed report with findings categorized by severity, plus specific recommendations to fix each issue.',
    details: [
      'Clear severity ratings (Critical, High, Medium, Low)',
      'Exact file and line number locations',
      'Copy-paste fix suggestions',
      'Links to security best practices',
    ],
    icon: (
      <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
];

const categories = [
  {
    name: 'Secrets & Credentials',
    checks: ['API keys', 'Passwords', 'Private keys', 'Tokens', 'Connection strings'],
    color: 'red',
  },
  {
    name: 'Injection Attacks',
    checks: ['SQL injection', 'Command injection', 'XSS vulnerabilities', 'Path traversal'],
    color: 'orange',
  },
  {
    name: 'Authentication',
    checks: ['Missing auth', 'Weak sessions', 'CSRF protection', 'JWT issues'],
    color: 'yellow',
  },
  {
    name: 'Data Protection',
    checks: ['Insecure storage', 'Missing encryption', 'Exposed PII', 'Debug data'],
    color: 'blue',
  },
  {
    name: 'Configuration',
    checks: ['Debug mode', 'CORS settings', 'Security headers', 'Source maps'],
    color: 'purple',
  },
  {
    name: 'Dependencies',
    checks: ['Known CVEs', 'Outdated packages', 'Unsafe imports', 'Supply chain'],
    color: 'green',
  },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 md:py-28">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                How{' '}
                <span className="bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent">
                  VibeSec
                </span>{' '}
                Works
              </h1>
              <p className="mt-6 text-lg text-muted-foreground">
                From URL to security report in under 10 seconds. No installation, no configuration, no learning curve.
              </p>
            </div>
          </div>
        </section>

        {/* Steps Section */}
        <section className="pb-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              {steps.map((step, index) => (
                <div key={step.number} className="relative">
                  {/* Connector Line */}
                  {index < steps.length - 1 && (
                    <div className="absolute left-8 top-20 bottom-0 w-px bg-gradient-to-b from-green-500 to-green-500/0" />
                  )}

                  <div className="flex gap-8 pb-16">
                    {/* Icon */}
                    <div className="relative shrink-0">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 text-white shadow-lg shadow-green-500/20">
                        {step.icon}
                      </div>
                      <span className="absolute -bottom-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-background border-2 border-green-500 text-xs font-bold text-green-500">
                        {step.number}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 pt-2">
                      <h2 className="text-2xl font-bold">{step.title}</h2>
                      <p className="mt-3 text-muted-foreground">{step.description}</p>
                      <ul className="mt-4 space-y-2">
                        {step.details.map((detail, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <svg className="h-4 w-4 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            {detail}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What We Check Section */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-center">What We Check</h2>
              <p className="mt-4 text-center text-muted-foreground max-w-2xl mx-auto">
                VibeSec runs 40+ security checks across 6 major categories, covering the most common vulnerabilities found in AI-generated code.
              </p>

              <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((category) => (
                  <div
                    key={category.name}
                    className="bg-background rounded-xl p-6 border border-border/40 hover:border-green-500/40 transition-colors"
                  >
                    <h3 className="font-semibold">{category.name}</h3>
                    <ul className="mt-3 space-y-1.5">
                      {category.checks.map((check, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                          {check}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Technical Details Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-3xl font-bold text-center">Under the Hood</h2>
              <p className="mt-4 text-center text-muted-foreground max-w-2xl mx-auto">
                VibeSec uses static analysis to scan your code without executing it. Here&apos;s how we keep your code safe while analyzing it.
              </p>

              {/* Dashboard Image */}
              <div className="mt-12 relative rounded-xl overflow-hidden border border-border/50 shadow-2xl shadow-green-500/10">
                <Image
                  src="/images/dashboard.jpg"
                  alt="Security analytics dashboard"
                  width={800}
                  height={500}
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
              </div>

              <div className="mt-12 grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-500/10">
                      <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold">No Code Storage</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        We fetch and analyze your code in memory. Nothing is stored on our servers after the scan completes.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-500/10">
                      <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold">Edge Runtime</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Scans run on edge servers close to you for minimal latency. Most scans complete in under 10 seconds.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-500/10">
                      <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold">Pattern Matching</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        We use regex patterns and AST-like analysis to detect vulnerabilities without running your code.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-500/10">
                      <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold">Continuous Updates</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        We regularly update our detection rules based on new vulnerabilities and community feedback.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-t border-green-500/20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold">Ready to try it?</h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              Paste your GitHub URL and see VibeSec in action. It takes less than 10 seconds.
            </p>
            <Button asChild size="lg" className="mt-8 bg-green-600 hover:bg-green-700">
              <Link href="/#scanner">Scan Now</Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
