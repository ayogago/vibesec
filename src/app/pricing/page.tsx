import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const plans = [
  {
    name: 'Free',
    description: 'Try VibeSec and see what you\'re missing',
    price: '$0',
    period: 'forever',
    tier: 'free',
    features: [
      '1 scan per day',
      'View 1 finding per scan (sample)',
      'See total vulnerability count',
      '40+ security checks',
      'Basic severity breakdown',
    ],
    limitations: [
      'Limited finding visibility',
      'No export options',
    ],
    cta: 'Get Started Free',
    href: '/signup?plan=free',
    popular: false,
  },
  {
    name: 'Starter',
    description: 'For indie hackers and solo developers',
    price: '$19.99',
    period: '/month',
    tier: 'starter',
    features: [
      '10 scans per day',
      'View ALL findings',
      'Detailed fix suggestions',
      'Full code snippets',
      'Export reports (JSON)',
      'Email support',
    ],
    limitations: [],
    cta: 'Start Starter Plan',
    href: '/signup?plan=starter',
    popular: true,
  },
  {
    name: 'Pro',
    description: 'For teams and agencies shipping daily',
    price: '$99',
    period: '/month',
    tier: 'pro',
    features: [
      '50 scans per day',
      'Everything in Starter, plus:',
      'Priority scan queue',
      'API access',
      'CI/CD integration',
      'PDF & SARIF export',
      'Private repo scanning',
      'Priority support',
    ],
    limitations: [],
    cta: 'Go Pro',
    href: '/signup?plan=pro',
    popular: false,
  },
];

const comparisonFeatures = [
  { name: 'Daily scans', free: '1', starter: '10', pro: '50' },
  { name: 'Visible findings per scan', free: '1 (sample)', starter: 'Unlimited', pro: 'Unlimited' },
  { name: 'Total finding count', free: true, starter: true, pro: true },
  { name: 'Security score', free: true, starter: true, pro: true },
  { name: 'Severity breakdown', free: true, starter: true, pro: true },
  { name: 'Detailed fix suggestions', free: false, starter: true, pro: true },
  { name: 'Code snippets', free: false, starter: true, pro: true },
  { name: 'JSON export', free: false, starter: true, pro: true },
  { name: 'PDF export', free: false, starter: false, pro: true },
  { name: 'SARIF export (GitHub)', free: false, starter: false, pro: true },
  { name: 'Private repositories', free: false, starter: false, pro: true },
  { name: 'API access', free: false, starter: false, pro: true },
  { name: 'CI/CD integration', free: false, starter: false, pro: true },
  { name: 'Priority queue', free: false, starter: false, pro: true },
  { name: 'Email support', free: false, starter: true, pro: true },
  { name: 'Priority support', free: false, starter: false, pro: true },
];

const faqs = [
  {
    question: 'What counts as a "scan"?',
    answer: 'Each time you analyze a repository, it counts as one scan. Re-scanning the same repository also counts as a new scan. Scans reset daily at midnight UTC.',
  },
  {
    question: 'Can I see how many vulnerabilities my repo has on the free plan?',
    answer: 'Yes! The free plan shows you the total count and severity breakdown of all findings. You just need to upgrade to see the full details of each vulnerability beyond the first sample.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, Mastercard, American Express) and PayPal. All payments are processed securely through Stripe.',
  },
  {
    question: 'Can I cancel anytime?',
    answer: 'Absolutely. There are no long-term contracts. Cancel your subscription at any time and continue using the service until the end of your billing period.',
  },
  {
    question: 'Do scans roll over if I don\'t use them?',
    answer: 'No, daily scan limits reset each day at midnight UTC. Unused scans don\'t carry over to the next day.',
  },
  {
    question: 'Do you offer annual billing?',
    answer: 'Yes! Contact us for annual billing with 2 months free (pay for 10, get 12).',
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 md:py-28">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                Simple, transparent{' '}
                <span className="bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent">
                  pricing
                </span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground">
                Start free, see what vulnerabilities exist, then upgrade to unlock full details and more scans.
              </p>
            </div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="pb-20">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {plans.map((plan) => (
                <Card
                  key={plan.name}
                  className={`relative flex flex-col ${plan.popular ? 'border-green-500 shadow-lg shadow-green-500/10' : ''}`}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600 hover:bg-green-600">
                      Most Popular
                    </Badge>
                  )}
                  <CardHeader>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground">{plan.period}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <ul className="space-y-3">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <svg
                            className="h-5 w-5 text-green-500 shrink-0 mt-0.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          <span className="text-sm text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                      {plan.limitations.map((limitation, index) => (
                        <li key={`limit-${index}`} className="flex items-start gap-3">
                          <svg
                            className="h-5 w-5 text-muted-foreground/50 shrink-0 mt-0.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                          <span className="text-sm text-muted-foreground/70">{limitation}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button
                      asChild
                      className={`w-full ${plan.popular ? 'bg-green-600 hover:bg-green-700' : ''}`}
                      variant={plan.popular ? 'default' : 'outline'}
                    >
                      <Link href={plan.href}>{plan.cta}</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Feature Comparison Table */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Compare Plans</h2>
            <div className="max-w-4xl mx-auto overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-4 pr-4 font-medium">Feature</th>
                    <th className="text-center py-4 px-4 font-medium">Free</th>
                    <th className="text-center py-4 px-4 font-medium text-green-500">Starter</th>
                    <th className="text-center py-4 px-4 font-medium">Pro</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((feature, index) => (
                    <tr key={index} className="border-b border-border/50">
                      <td className="py-3 pr-4 text-sm">{feature.name}</td>
                      <td className="py-3 px-4 text-center">
                        {typeof feature.free === 'boolean' ? (
                          feature.free ? (
                            <svg className="h-5 w-5 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="h-5 w-5 text-muted-foreground/30 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          )
                        ) : (
                          <span className="text-sm text-muted-foreground">{feature.free}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center bg-green-500/5">
                        {typeof feature.starter === 'boolean' ? (
                          feature.starter ? (
                            <svg className="h-5 w-5 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="h-5 w-5 text-muted-foreground/30 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          )
                        ) : (
                          <span className="text-sm font-medium">{feature.starter}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {typeof feature.pro === 'boolean' ? (
                          feature.pro ? (
                            <svg className="h-5 w-5 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="h-5 w-5 text-muted-foreground/30 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          )
                        ) : (
                          <span className="text-sm font-medium">{feature.pro}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Enterprise Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl p-8 md:p-12 border border-green-500/20">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <h2 className="text-2xl font-bold">Enterprise</h2>
                  <p className="mt-2 text-muted-foreground max-w-lg">
                    Need unlimited scans, custom integrations, SSO, or on-premise deployment? Let&apos;s talk about your requirements.
                  </p>
                </div>
                <Button asChild size="lg" variant="outline">
                  <Link href="/contact">Contact Sales</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center">Frequently Asked Questions</h2>
            <div className="mt-12 max-w-3xl mx-auto">
              <div className="space-y-6">
                {faqs.map((faq, index) => (
                  <div key={index} className="border-b border-border/40 pb-6">
                    <h3 className="font-semibold">{faq.question}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-t border-green-500/20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold">Ready to secure your code?</h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              Start with a free scan and see exactly how many vulnerabilities are hiding in your codebase.
            </p>
            <Button asChild size="lg" className="mt-8 bg-green-600 hover:bg-green-700">
              <Link href="/#scanner">Scan Free Now</Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
