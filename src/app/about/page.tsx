import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 md:py-28">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                Security for the{' '}
                <span className="bg-gradient-to-r from-cyan-400 to-violet-600 bg-clip-text text-transparent">
                  Vibe Coding Era
                </span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
                We believe AI-assisted development should be fast AND secure. VibeSec was built to bridge the gap between rapid prototyping and production-ready security.
              </p>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-16 border-t border-border/40">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
              <div>
                <h2 className="text-3xl font-bold">Our Mission</h2>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  As AI coding assistants become the norm, developers are shipping faster than ever. But speed without security creates risk. Our mission is to make security scanning as effortless as the AI tools that write your code.
                </p>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  We&apos;re not here to slow you down—we&apos;re here to help you ship with confidence.
                </p>
              </div>
              <div className="bg-gradient-to-br from-cyan-500/10 to-violet-500/10 rounded-2xl p-8 border border-cyan-500/20">
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-500/20">
                      <svg className="h-5 w-5 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold">Fast</h3>
                      <p className="text-sm text-muted-foreground">Scan entire repos in seconds, not minutes</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/20">
                      <svg className="h-5 w-5 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold">Comprehensive</h3>
                      <p className="text-sm text-muted-foreground">40+ security checks covering OWASP Top 10 and more</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/20">
                      <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold">Actionable</h3>
                      <p className="text-sm text-muted-foreground">Clear fixes, not cryptic warnings</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Story Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-center">Our Story</h2>
              <div className="mt-8 space-y-6 text-muted-foreground leading-relaxed">
                <p>
                  VibeSec started from a simple observation: AI coding tools like Cursor, GitHub Copilot, and Claude are revolutionizing how we build software. Developers are shipping MVPs in hours instead of weeks. But with this speed comes a new challenge.
                </p>
                <p>
                  AI-generated code often contains subtle security vulnerabilities—hardcoded secrets, SQL injection risks, missing input validation, and more. Traditional security tools are too slow and complex for the rapid iteration cycle of modern development.
                </p>
                <p>
                  We built VibeSec to solve this problem. Just paste your GitHub URL, and in seconds you&apos;ll know exactly what security issues need attention before you ship.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center">Our Values</h2>
            <div className="mt-12 grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-cyan-500/10">
                  <svg className="h-7 w-7 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="mt-4 text-lg font-semibold">Developer First</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Security tools should enhance your workflow, not interrupt it. We optimize for developer experience.
                </p>
              </div>
              <div className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-violet-500/10">
                  <svg className="h-7 w-7 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="mt-4 text-lg font-semibold">Transparency</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Every finding comes with clear explanations. No black boxes, no security theater.
                </p>
              </div>
              <div className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-500/10">
                  <svg className="h-7 w-7 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="mt-4 text-lg font-semibold">Community Driven</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  We learn from the community and continuously improve our detection based on real-world feedback.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-br from-cyan-500/10 to-violet-500/10 border-t border-cyan-500/20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold">Ready to secure your code?</h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              Start scanning your repositories for free. No signup required.
            </p>
            <a
              href="/#scanner"
              className="mt-8 inline-flex items-center justify-center rounded-md bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-600 hover:to-violet-700 px-8 py-3 text-sm font-medium text-white shadow-lg shadow-cyan-500/25 transition-colors"
            >
              Scan Your Repo Now
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
