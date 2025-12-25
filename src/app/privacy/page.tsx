import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 md:py-20 border-b border-border/40">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                Privacy Policy
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
            <div className="max-w-3xl mx-auto prose prose-neutral dark:prose-invert">
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold">Introduction</h2>
                  <p className="mt-4 text-muted-foreground leading-relaxed">
                    SecureSiteScan (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our security scanning service.
                  </p>
                  <p className="mt-4 text-muted-foreground leading-relaxed">
                    Please read this privacy policy carefully. By using SecureSiteScan, you agree to the collection and use of information in accordance with this policy.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold">Information We Collect</h2>

                  <h3 className="text-xl font-semibold mt-6">Information You Provide</h3>
                  <ul className="mt-4 space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                      <span><strong>Repository URLs:</strong> The GitHub repository URLs you submit for scanning.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                      <span><strong>GitHub Tokens:</strong> Optional personal access tokens you provide for scanning private repositories or avoiding rate limits.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                      <span><strong>Contact Information:</strong> Email address, name, and other details you provide when contacting us or signing up for an account.</span>
                    </li>
                  </ul>

                  <h3 className="text-xl font-semibold mt-6">Information Collected Automatically</h3>
                  <ul className="mt-4 space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                      <span><strong>Usage Data:</strong> Information about how you use our service, including scan requests and results.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                      <span><strong>Device Information:</strong> Browser type, operating system, and device identifiers.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                      <span><strong>Log Data:</strong> IP addresses, access times, and pages viewed.</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-2xl font-bold">How We Use Your Information</h2>
                  <p className="mt-4 text-muted-foreground leading-relaxed">
                    We use the information we collect for the following purposes:
                  </p>
                  <ul className="mt-4 space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                      <span>To provide and maintain our security scanning service</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                      <span>To analyze repository code for security vulnerabilities</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                      <span>To improve and optimize our detection algorithms</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                      <span>To communicate with you about your scans or account</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                      <span>To detect and prevent abuse or security threats</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-2xl font-bold">Code and Data Handling</h2>
                  <div className="mt-4 p-6 bg-green-500/10 rounded-lg border border-green-500/20">
                    <h3 className="font-semibold text-green-600 dark:text-green-400">Important: We Don&apos;t Store Your Code</h3>
                    <p className="mt-2 text-muted-foreground">
                      SecureSiteScan performs static analysis on your code in memory. We do not permanently store your source code on our servers. Code is fetched, analyzed, and immediately discarded after the scan completes.
                    </p>
                  </div>
                  <ul className="mt-4 space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                      <span>Repository code is processed in memory only during scans</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                      <span>Scan results (findings) are stored for 30 days on free plans</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                      <span>GitHub tokens are used only for the current scan and not stored</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                      <span>We never access repositories beyond what&apos;s needed for scanning</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-2xl font-bold">Data Sharing and Disclosure</h2>
                  <p className="mt-4 text-muted-foreground leading-relaxed">
                    We do not sell your personal information. We may share information in the following circumstances:
                  </p>
                  <ul className="mt-4 space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                      <span><strong>Service Providers:</strong> With third-party vendors who help us operate our service (hosting, analytics).</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                      <span><strong>Legal Requirements:</strong> When required by law or to protect our rights.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                      <span><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                      <span><strong>With Your Consent:</strong> When you have given us explicit permission.</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-2xl font-bold">Data Security</h2>
                  <p className="mt-4 text-muted-foreground leading-relaxed">
                    We implement appropriate technical and organizational measures to protect your information, including:
                  </p>
                  <ul className="mt-4 space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                      <span>Encryption of data in transit using TLS/SSL</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                      <span>Secure cloud infrastructure with regular security audits</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                      <span>Access controls and authentication for all systems</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                      <span>Regular security reviews of our own code</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-2xl font-bold">Your Rights</h2>
                  <p className="mt-4 text-muted-foreground leading-relaxed">
                    Depending on your location, you may have the following rights:
                  </p>
                  <ul className="mt-4 space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                      <span>Access, correct, or delete your personal information</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                      <span>Object to or restrict processing of your data</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                      <span>Data portability</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                      <span>Withdraw consent at any time</span>
                    </li>
                  </ul>
                  <p className="mt-4 text-muted-foreground leading-relaxed">
                    To exercise these rights, please contact us at{' '}
                    <a href="mailto:info@securesitescan.com" className="text-green-500 hover:underline">
                      info@securesitescan.com
                    </a>.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold">Cookies</h2>
                  <p className="mt-4 text-muted-foreground leading-relaxed">
                    We use cookies and similar technologies to improve your experience. For details, see our{' '}
                    <a href="/cookies" className="text-green-500 hover:underline">
                      Cookie Policy
                    </a>.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold">Changes to This Policy</h2>
                  <p className="mt-4 text-muted-foreground leading-relaxed">
                    We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold">Contact Us</h2>
                  <p className="mt-4 text-muted-foreground leading-relaxed">
                    If you have questions about this Privacy Policy, please contact us:
                  </p>
                  <ul className="mt-4 space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                      <span>Email: <a href="mailto:info@securesitescan.com" className="text-green-500 hover:underline">info@securesitescan.com</a></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                      <span>Contact form: <a href="/contact" className="text-green-500 hover:underline">securesitescan.com/contact</a></span>
                    </li>
                  </ul>
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
