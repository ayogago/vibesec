import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 md:py-20 border-b border-border/40">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                Cookie Policy
              </h1>
              <p className="mt-4 text-muted-foreground">
                Last updated: December 6, 2024
              </p>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold">What Are Cookies?</h2>
                  <p className="mt-4 text-muted-foreground leading-relaxed">
                    Cookies are small text files that are stored on your device when you visit a website. They are widely used to make websites work more efficiently and to provide information to website owners.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold">How We Use Cookies</h2>
                  <p className="mt-4 text-muted-foreground leading-relaxed">
                    SecureSiteScan uses cookies and similar technologies for the following purposes:
                  </p>

                  <div className="mt-6 space-y-6">
                    <div className="p-6 bg-muted/50 rounded-lg border border-border/40">
                      <h3 className="font-semibold flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10">
                          <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </span>
                        Essential Cookies
                      </h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        These cookies are necessary for the website to function properly. They enable core functionality such as security, session management, and accessibility. You cannot opt out of these cookies.
                      </p>
                      <div className="mt-4">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border/40">
                              <th className="text-left py-2 font-medium">Cookie</th>
                              <th className="text-left py-2 font-medium">Purpose</th>
                              <th className="text-left py-2 font-medium">Duration</th>
                            </tr>
                          </thead>
                          <tbody className="text-muted-foreground">
                            <tr className="border-b border-border/40">
                              <td className="py-2">session_id</td>
                              <td className="py-2">Maintains your session</td>
                              <td className="py-2">Session</td>
                            </tr>
                            <tr>
                              <td className="py-2">csrf_token</td>
                              <td className="py-2">Security protection</td>
                              <td className="py-2">Session</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="p-6 bg-muted/50 rounded-lg border border-border/40">
                      <h3 className="font-semibold flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                          <svg className="h-4 w-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </span>
                        Analytics Cookies
                      </h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        These cookies help us understand how visitors interact with our website. We use this information to improve our service and user experience.
                      </p>
                      <div className="mt-4">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border/40">
                              <th className="text-left py-2 font-medium">Cookie</th>
                              <th className="text-left py-2 font-medium">Purpose</th>
                              <th className="text-left py-2 font-medium">Duration</th>
                            </tr>
                          </thead>
                          <tbody className="text-muted-foreground">
                            <tr className="border-b border-border/40">
                              <td className="py-2">_ga</td>
                              <td className="py-2">Google Analytics visitor ID</td>
                              <td className="py-2">2 years</td>
                            </tr>
                            <tr>
                              <td className="py-2">_gid</td>
                              <td className="py-2">Google Analytics session ID</td>
                              <td className="py-2">24 hours</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="p-6 bg-muted/50 rounded-lg border border-border/40">
                      <h3 className="font-semibold flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10">
                          <svg className="h-4 w-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </span>
                        Preference Cookies
                      </h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        These cookies remember your preferences and settings to provide a more personalized experience.
                      </p>
                      <div className="mt-4">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border/40">
                              <th className="text-left py-2 font-medium">Cookie</th>
                              <th className="text-left py-2 font-medium">Purpose</th>
                              <th className="text-left py-2 font-medium">Duration</th>
                            </tr>
                          </thead>
                          <tbody className="text-muted-foreground">
                            <tr className="border-b border-border/40">
                              <td className="py-2">theme</td>
                              <td className="py-2">Dark/light mode preference</td>
                              <td className="py-2">1 year</td>
                            </tr>
                            <tr>
                              <td className="py-2">dismissed_banners</td>
                              <td className="py-2">Tracks dismissed notifications</td>
                              <td className="py-2">30 days</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-2xl font-bold">Managing Cookies</h2>
                  <p className="mt-4 text-muted-foreground leading-relaxed">
                    Most web browsers allow you to control cookies through their settings. You can:
                  </p>
                  <ul className="mt-4 space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                      <span>View and delete cookies stored on your device</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                      <span>Block all or certain types of cookies</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                      <span>Set your browser to notify you when a cookie is being set</span>
                    </li>
                  </ul>
                  <p className="mt-4 text-muted-foreground leading-relaxed">
                    Please note that blocking certain cookies may affect the functionality of our website.
                  </p>

                  <div className="mt-6 p-6 bg-muted/50 rounded-lg border border-border/40">
                    <h3 className="font-semibold">Browser Cookie Settings</h3>
                    <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                        <span><strong>Chrome:</strong> Settings &gt; Privacy and security &gt; Cookies</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                        <span><strong>Firefox:</strong> Settings &gt; Privacy &amp; Security &gt; Cookies</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                        <span><strong>Safari:</strong> Preferences &gt; Privacy &gt; Cookies</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                        <span><strong>Edge:</strong> Settings &gt; Cookies and site permissions</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div>
                  <h2 className="text-2xl font-bold">Third-Party Cookies</h2>
                  <p className="mt-4 text-muted-foreground leading-relaxed">
                    We may use third-party services that set their own cookies. These include:
                  </p>
                  <ul className="mt-4 space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                      <span><strong>Google Analytics:</strong> For understanding website usage and performance</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                      <span><strong>Stripe:</strong> For payment processing (if applicable)</span>
                    </li>
                  </ul>
                  <p className="mt-4 text-muted-foreground leading-relaxed">
                    These third parties have their own privacy policies governing the use of their cookies.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold">Updates to This Policy</h2>
                  <p className="mt-4 text-muted-foreground leading-relaxed">
                    We may update this Cookie Policy from time to time. Any changes will be posted on this page with an updated revision date.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold">Contact Us</h2>
                  <p className="mt-4 text-muted-foreground leading-relaxed">
                    If you have questions about our use of cookies, please contact us at{' '}
                    <a href="mailto:info@securesitescan.com" className="text-green-500 hover:underline">
                      info@securesitescan.com
                    </a>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
