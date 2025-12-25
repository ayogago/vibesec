"use client"

import { signIn, useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState, Suspense } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { Badge } from "@/components/ui/badge"
import {
  Shield,
  Loader2,
  Mail,
  Lock,
  User,
  Check,
  ArrowRight,
  Zap,
  Star,
  Clock,
  CreditCard,
  CheckCircle2,
  X,
} from "lucide-react"
import { SubscriptionTier, SUBSCRIPTION_LIMITS } from "@/lib/subscription"

const planFeatures = {
  free: {
    name: "Free",
    price: "$0",
    period: "forever",
    color: "gray",
    features: [
      "1 scan per day",
      "View 2 sample findings",
      "See total vulnerability count",
      "40+ security checks",
    ],
    notIncluded: [
      "Full finding details",
      "Fix suggestions",
      "Export reports",
    ],
  },
  starter: {
    name: "Starter",
    price: "$2.99",
    period: "/month",
    color: "green",
    popular: true,
    features: [
      "10 scans per day",
      "View ALL findings",
      "Detailed fix suggestions",
      "Full code snippets",
      "JSON export",
    ],
    notIncluded: [
      "PDF export",
      "Priority support",
    ],
  },
  pro: {
    name: "Pro",
    price: "$9.99",
    period: "/month",
    color: "purple",
    features: [
      "50 scans per day",
      "Everything in Starter",
      "PDF export",
      "Priority support",
      "Advanced analytics",
    ],
    notIncluded: [],
  },
}

function SignupContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const planParam = searchParams.get("plan") as SubscriptionTier | null
  const selectedPlan = planParam && ["free", "starter", "pro"].includes(planParam) ? planParam : "starter"
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [name, setName] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [step, setStep] = useState<"form" | "processing" | "redirecting">("form")

  const isPaidPlan = selectedPlan === "starter" || selectedPlan === "pro"
  const currentPlanInfo = planFeatures[selectedPlan as keyof typeof planFeatures]

  useEffect(() => {
    if (status === "authenticated") {
      if (isPaidPlan) {
        router.push(`/checkout?plan=${selectedPlan}`)
      } else {
        router.push(callbackUrl)
      }
    }
  }, [status, router, selectedPlan, callbackUrl, isPaidPlan])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    setStep("processing")

    // Validation
    if (!email || !password || !name) {
      setError("All fields are required")
      setLoading(false)
      setStep("form")
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      setLoading(false)
      setStep("form")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      setStep("form")
      return
    }

    try {
      // Register user via API
      const registerResponse = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          name,
          pendingPlan: isPaidPlan ? selectedPlan : undefined,
        }),
      })

      const registerData = await registerResponse.json()

      if (!registerResponse.ok) {
        throw new Error(registerData.error || "Failed to create account")
      }

      // Sign in with credentials
      const signInResult = await signIn("credentials", {
        email: registerData.user.email,
        userId: registerData.user.id,
        userName: registerData.user.name,
        redirect: false,
      })

      if (signInResult?.error) {
        throw new Error("Failed to sign in. Please try again.")
      }

      setStep("redirecting")

      // For paid plans, redirect to checkout
      if (isPaidPlan) {
        // Create Stripe checkout session
        const checkoutResponse = await fetch("/api/stripe/create-checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan: selectedPlan }),
        })

        const checkoutData = await checkoutResponse.json()

        if (checkoutResponse.ok && checkoutData.url) {
          window.location.href = checkoutData.url
        } else {
          // Fallback to checkout page if Stripe redirect fails
          router.push(`/checkout?plan=${selectedPlan}`)
        }
      } else {
        // Free plan - go to dashboard
        router.push(callbackUrl)
      }
    } catch (err) {
      console.error("Signup error:", err)
      setError(err instanceof Error ? err.message : "Something went wrong")
      setLoading(false)
      setStep("form")
    }
  }

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    setError("")
    try {
      await signIn("google", {
        callbackUrl: isPaidPlan ? `/checkout?plan=${selectedPlan}` : callbackUrl,
      })
    } catch (err) {
      console.error("Google sign-in error:", err)
      setError("Failed to sign in with Google. Please try again.")
      setGoogleLoading(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-500" />
      </div>
    )
  }

  if (status === "authenticated") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-green-500 mx-auto" />
          <p className="mt-4 text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 pt-20">
        <div className="container mx-auto px-4 py-8 md:py-12">
          {/* Hero Section */}
          <div className="text-center mb-8 md:mb-12">
            <Badge className="mb-4 bg-green-600/10 text-green-500 border-green-500/20">
              <Zap className="w-3 h-3 mr-1" />
              Start in 60 seconds
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              {isPaidPlan ? (
                <>
                  Get Started with{" "}
                  <span className="bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent">
                    {currentPlanInfo.name}
                  </span>
                </>
              ) : (
                <>
                  Create Your{" "}
                  <span className="bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent">
                    Free Account
                  </span>
                </>
              )}
            </h1>
            <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
              {isPaidPlan
                ? "Unlock full security scanning power. Cancel anytime."
                : "Start scanning your code for vulnerabilities today."}
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Left Column - Form */}
            <div>
              <Card className="bg-card/50 backdrop-blur border-border/50 overflow-hidden">
                {/* Progress indicator for paid plans */}
                {isPaidPlan && (
                  <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 px-6 py-3 border-b border-border/50">
                    <div className="flex items-center gap-3 text-sm">
                      <div className={`flex items-center gap-2 ${step === "form" ? "text-green-500" : "text-muted-foreground"}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${step === "form" ? "bg-green-500 text-white" : "bg-muted"}`}>
                          {step !== "form" ? <Check className="w-3 h-3" /> : "1"}
                        </div>
                        <span>Account</span>
                      </div>
                      <div className="flex-1 h-px bg-border" />
                      <div className={`flex items-center gap-2 ${step === "redirecting" ? "text-green-500" : "text-muted-foreground"}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${step === "redirecting" ? "bg-green-500 text-white" : "bg-muted"}`}>
                          2
                        </div>
                        <span>Payment</span>
                      </div>
                    </div>
                  </div>
                )}

                <CardContent className="p-6 md:p-8">
                  {error && (
                    <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-2">
                      <X className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  {step === "processing" || step === "redirecting" ? (
                    <div className="py-12 text-center">
                      <Loader2 className="h-10 w-10 animate-spin text-green-500 mx-auto" />
                      <p className="mt-4 text-lg font-medium">
                        {step === "processing" ? "Creating your account..." : "Redirecting to secure payment..."}
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {step === "processing" ? "This will only take a moment" : "You'll be able to complete payment securely"}
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="space-y-2">
                        <label htmlFor="name" className="text-sm font-medium">
                          Full Name
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="name"
                            type="text"
                            placeholder="John Doe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="pl-10 h-11"
                            required
                            autoComplete="name"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium">
                          Email Address
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="email"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="pl-10 h-11"
                            required
                            autoComplete="email"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="password" className="text-sm font-medium">
                          Password
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="password"
                            type="password"
                            placeholder="Min. 8 characters"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="pl-10 h-11"
                            required
                            minLength={8}
                            autoComplete="new-password"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="confirmPassword" className="text-sm font-medium">
                          Confirm Password
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="confirmPassword"
                            type="password"
                            placeholder="Confirm your password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="pl-10 h-11"
                            required
                            autoComplete="new-password"
                          />
                        </div>
                      </div>

                      <Button
                        type="submit"
                        className={`w-full h-12 text-base font-medium ${
                          isPaidPlan
                            ? "bg-green-600 hover:bg-green-700"
                            : ""
                        }`}
                        disabled={loading}
                        size="lg"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : isPaidPlan ? (
                          <>
                            <CreditCard className="mr-2 h-4 w-4" />
                            Continue to Payment - {currentPlanInfo.price}{currentPlanInfo.period}
                          </>
                        ) : (
                          <>
                            Create Free Account
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>

                      {isPaidPlan && (
                        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pt-2">
                          <div className="flex items-center gap-1">
                            <Lock className="h-3 w-3" />
                            <span>Secure checkout</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Shield className="h-3 w-3" />
                            <span>Cancel anytime</span>
                          </div>
                        </div>
                      )}

                      {/* Divider */}
                      <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-border"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                        </div>
                      </div>

                      {/* OAuth Sign-In Button */}
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={handleGoogleSignIn}
                        disabled={loading || googleLoading}
                      >
                        {googleLoading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                            <path
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                              fill="#4285F4"
                            />
                            <path
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                              fill="#34A853"
                            />
                            <path
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                              fill="#FBBC05"
                            />
                            <path
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                              fill="#EA4335"
                            />
                          </svg>
                        )}
                        Continue with Google
                      </Button>
                    </form>
                  )}

                  <div className="mt-6 text-center text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Link
                      href={selectedPlan ? `/login?plan=${selectedPlan}` : "/login"}
                      className="text-green-500 hover:text-green-400 font-medium"
                    >
                      Sign in
                    </Link>
                  </div>

                  {/* Plan switcher */}
                  {selectedPlan !== "free" && (
                    <div className="mt-4 text-center">
                      <Link
                        href="/signup?plan=free"
                        className="text-xs text-muted-foreground hover:text-foreground underline"
                      >
                        Or start with free plan
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Trust badges */}
              <div className="mt-6 flex items-center justify-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-500" />
                  <span>SSL Encrypted</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-green-500" />
                  <span>Setup in 60s</span>
                </div>
              </div>
            </div>

            {/* Right Column - Plan Benefits */}
            <div className="space-y-6">
              {/* Selected Plan Card */}
              <Card className={`bg-card/50 backdrop-blur border-2 ${
                selectedPlan === "starter" ? "border-green-500/50" :
                selectedPlan === "pro" ? "border-purple-500/50" :
                "border-border/50"
              }`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Selected Plan</p>
                      <h3 className="text-2xl font-bold">{currentPlanInfo.name}</h3>
                    </div>
                    <div className="text-right">
                      <span className="text-3xl font-bold">{currentPlanInfo.price}</span>
                      <span className="text-muted-foreground">{currentPlanInfo.period}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {currentPlanInfo.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                    {currentPlanInfo.notIncluded.map((feature, index) => (
                      <div key={index} className="flex items-center gap-3 opacity-50">
                        <X className="h-5 w-5 text-muted-foreground shrink-0" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {selectedPlan !== "pro" && (
                    <div className="mt-6 pt-4 border-t border-border">
                      <Link
                        href={`/signup?plan=${selectedPlan === "free" ? "starter" : "pro"}`}
                        className="text-sm text-green-500 hover:text-green-400 font-medium flex items-center gap-1"
                      >
                        {selectedPlan === "free" ? "Upgrade to Starter" : "Upgrade to Pro"}
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Social Proof */}
              <Card className="bg-gradient-to-br from-green-500/5 to-emerald-500/5 border-green-500/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    ))}
                  </div>
                  <blockquote className="text-sm italic text-muted-foreground mb-3">
                    &ldquo;Found 3 critical vulnerabilities in my first scan that I had no idea existed.
                    This tool paid for itself immediately.&rdquo;
                  </blockquote>
                  <p className="text-sm font-medium">— Alex K., Indie Developer</p>
                </CardContent>
              </Card>

              {/* What you get */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                  Why SecureSiteScan?
                </h4>
                <div className="grid gap-3">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                    <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                      <Zap className="h-4 w-4 text-green-500" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">AI-Powered Scanning</p>
                      <p className="text-xs text-muted-foreground">40+ security checks optimized for vibe-coded projects</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                    <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                      <Shield className="h-4 w-4 text-green-500" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Actionable Fixes</p>
                      <p className="text-xs text-muted-foreground">Get exact code snippets to fix each vulnerability</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                    <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                      <Clock className="h-4 w-4 text-green-500" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Scan in Seconds</p>
                      <p className="text-xs text-muted-foreground">Just paste your GitHub URL and get instant results</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-green-500" />
        </div>
      }
    >
      <SignupContent />
    </Suspense>
  )
}
