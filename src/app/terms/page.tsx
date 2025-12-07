import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 md:py-20 border-b border-border/40">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                Terms of Service
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
                  <h2 className="text-2xl font-bold">1. Acceptance of Terms</h2>
                  <p className="mt-4 text-muted-foreground leading-relaxed">
                    By accessing or using VibeSec (&quot;the Service&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms, please do not use the Service.
                  </p>
                  <p className="mt-4 text-muted-foreground leading-relaxed">
                    We reserve the right to modify these Terms at any time. Continued use of the Service after any modifications constitutes your acceptance of the revised Terms.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold">2. Description of Service</h2>
                  <p className="mt-4 text-muted-foreground leading-relaxed">
                    VibeSec is a security scanning service that analyzes GitHub repositories for potential security vulnerabilities. The Service performs static analysis on code and provides reports on detected issues.
                  </p>
                  <p className="mt-4 text-muted-foreground leading-relaxed">
                    The Service is provided &quot;as is&quot; and is intended to assist in identifying potential security issues. It is not a substitute for comprehensive security audits or professional security consulting.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold">3. User Responsibilities</h2>
                  <p className="mt-4 text-muted-foreground leading-relaxed">
                    By using VibeSec, you agree to:
                  </p>
                  <ul className="mt-4 space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                      <span>Only scan repositories you have permission to analyze</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                      <span>Not use the Service for malicious purposes or to harm others</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                      <span>Not attempt to circumvent rate limits or abuse the Service</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                      <span>Provide accurate information when creating an account</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                      <span>Keep your account credentials secure</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                      <span>Comply with GitHub&apos;s Terms of Service when using GitHub tokens</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-2xl font-bold">4. Prohibited Uses</h2>
                  <p className="mt-4 text-muted-foreground leading-relaxed">
                    You may not use the Service to:
                  </p>
                  <ul className="mt-4 space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500 mt-2 shrink-0" />
                      <span>Scan repositories without authorization from the repository owner</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500 mt-2 shrink-0" />
                      <span>Conduct security research on systems you don&apos;t own without permission</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500 mt-2 shrink-0" />
                      <span>Use scan results to exploit vulnerabilities in others&apos; systems</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500 mt-2 shrink-0" />
                      <span>Distribute malware or engage in hacking activities</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500 mt-2 shrink-0" />
                      <span>Violate any applicable laws or regulations</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-2xl font-bold">5. Intellectual Property</h2>
                  <p className="mt-4 text-muted-foreground leading-relaxed">
                    The Service, including its original content, features, and functionality, is owned by VibeSec and is protected by international copyright, trademark, and other intellectual property laws.
                  </p>
                  <p className="mt-4 text-muted-foreground leading-relaxed">
                    You retain all rights to the code you submit for scanning. We do not claim any ownership of your code or repositories.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold">6. Payment and Subscriptions</h2>
                  <p className="mt-4 text-muted-foreground leading-relaxed">
                    Some features of VibeSec require a paid subscription. By subscribing to a paid plan:
                  </p>
                  <ul className="mt-4 space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                      <span>You authorize us to charge your payment method on a recurring basis</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                      <span>Subscriptions automatically renew unless cancelled before the renewal date</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                      <span>Refunds are provided at our discretion and in accordance with applicable law</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                      <span>Prices may change with notice provided before your next billing cycle</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-2xl font-bold">7. Disclaimer of Warranties</h2>
                  <div className="mt-4 p-6 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                    <p className="text-muted-foreground leading-relaxed">
                      THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR COMPLETELY SECURE.
                    </p>
                    <p className="mt-4 text-muted-foreground leading-relaxed">
                      WE DO NOT GUARANTEE THAT OUR SCANS WILL DETECT ALL SECURITY VULNERABILITIES. THE SERVICE IS A TOOL TO ASSIST IN SECURITY REVIEW, NOT A REPLACEMENT FOR COMPREHENSIVE SECURITY AUDITS.
                    </p>
                  </div>
                </div>

                <div>
                  <h2 className="text-2xl font-bold">8. Limitation of Liability</h2>
                  <p className="mt-4 text-muted-foreground leading-relaxed">
                    TO THE MAXIMUM EXTENT PERMITTED BY LAW, VIBESEC SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO:
                  </p>
                  <ul className="mt-4 space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                      <span>Loss of profits, data, or business opportunities</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                      <span>Security breaches or vulnerabilities not detected by our scans</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                      <span>Actions taken based on scan results</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                      <span>Service interruptions or downtime</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-2xl font-bold">9. Indemnification</h2>
                  <p className="mt-4 text-muted-foreground leading-relaxed">
                    You agree to indemnify and hold harmless VibeSec, its officers, directors, employees, and agents from any claims, damages, losses, or expenses arising from your use of the Service or violation of these Terms.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold">10. Termination</h2>
                  <p className="mt-4 text-muted-foreground leading-relaxed">
                    We may terminate or suspend your access to the Service immediately, without prior notice, for any reason, including breach of these Terms. Upon termination:
                  </p>
                  <ul className="mt-4 space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                      <span>Your right to use the Service will cease immediately</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                      <span>We may delete your account and associated data</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                      <span>Provisions that by their nature should survive termination will survive</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-2xl font-bold">11. Governing Law</h2>
                  <p className="mt-4 text-muted-foreground leading-relaxed">
                    These Terms shall be governed by and construed in accordance with the laws of the State of California, United States, without regard to its conflict of law provisions.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold">12. Changes to Terms</h2>
                  <p className="mt-4 text-muted-foreground leading-relaxed">
                    We reserve the right to modify these Terms at any time. We will provide notice of significant changes by posting the updated Terms on this page and updating the &quot;Last updated&quot; date. Your continued use of the Service after changes take effect constitutes acceptance of the new Terms.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold">13. Contact Information</h2>
                  <p className="mt-4 text-muted-foreground leading-relaxed">
                    If you have questions about these Terms, please contact us:
                  </p>
                  <ul className="mt-4 space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                      <span>Email: <a href="mailto:legal@vibesec.dev" className="text-green-500 hover:underline">legal@vibesec.dev</a></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                      <span>Contact form: <a href="/contact" className="text-green-500 hover:underline">vibesec.dev/contact</a></span>
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
