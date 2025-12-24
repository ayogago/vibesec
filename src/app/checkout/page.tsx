"use client"

import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { Badge } from "@/components/ui/badge"
import {
  CreditCard,
  Loader2,
  Check,
  Shield,
  Lock,
  ArrowLeft,
  Sparkles,
  AlertCircle,
} from "lucide-react"
import { SubscriptionTier, SUBSCRIPTION_LIMITS } from "@/lib/subscription"

function CheckoutContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedPlan = searchParams.get("plan") as SubscriptionTier | null
  const canceled = searchParams.get("canceled")

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/login?callbackUrl=/checkout?plan=${selectedPlan || "starter"}`)
    }
  }, [status, router, selectedPlan])

  // Redirect if no plan selected or invalid plan
  useEffect(() => {
    if (!selectedPlan || !["starter", "pro"].includes(selectedPlan)) {
      router.push("/pricing")
    }
  }, [selectedPlan, router])

  const planInfo = selectedPlan ? SUBSCRIPTION_LIMITS[selectedPlan] : null

  const handleCheckout = async () => {
    if (!selectedPlan) return

    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan: selectedPlan }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session")
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error("No checkout URL returned")
      }
    } catch (err) {
      console.error("Checkout error:", err)
      setError(err instanceof Error ? err.message : "Failed to start checkout")
      setLoading(false)
    }
  }

  const handleSkip = () => {
    router.push("/dashboard")
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (status === "unauthenticated" || !planInfo || !selectedPlan) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Redirecting...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl pt-28">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div>
            <h1 className="text-2xl font-bold mb-6">Complete Your Order</h1>

            {canceled && (
              <div className="mb-6 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <p className="text-sm text-yellow-600 dark:text-yellow-500">
                  Your previous checkout was canceled. Ready to try again?
                </p>
              </div>
            )}

            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{planInfo.name} Plan</span>
                  <Badge className="bg-green-600">${planInfo.price}/mo</Badge>
                </CardTitle>
                <CardDescription>
                  Unlock the full power of SecureSiteScan security scanning
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-sm">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>{planInfo.dailyScans} scans per day</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>View all vulnerability findings</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Detailed fix suggestions with code</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Export reports (JSON{selectedPlan === "pro" ? " & PDF" : ""})</span>
                  </li>
                  {selectedPlan === "pro" && (
                    <li className="flex items-center gap-3 text-sm">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Priority support</span>
                    </li>
                  )}
                </ul>

                <div className="mt-6 pt-6 border-t border-border">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${planInfo.price}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-4">
                    <span className="text-muted-foreground">Tax</span>
                    <span>Calculated at checkout</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>${planInfo.price}/month</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Skip option */}
            <div className="mt-4 text-center">
              <button
                onClick={handleSkip}
                className="text-sm text-muted-foreground hover:text-foreground underline"
              >
                Skip for now and use Free plan
              </button>
            </div>
          </div>

          {/* Payment Section */}
          <div>
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Secure Checkout
                </CardTitle>
                <CardDescription>
                  Powered by Stripe - your payment information is never stored on our servers
                </CardDescription>
              </CardHeader>
              <CardContent>
                {error && (
                  <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-6">
                  <div className="p-4 rounded-lg bg-muted/50 border border-border">
                    <p className="text-sm text-muted-foreground mb-4">
                      You&apos;ll be redirected to Stripe&apos;s secure checkout page to complete your payment.
                    </p>
                    <div className="flex items-center gap-3 justify-center">
                      <div className="w-12 h-8 bg-[#1a1f71] rounded flex items-center justify-center">
                        <span className="text-white text-xs font-bold italic">VISA</span>
                      </div>
                      <div className="w-12 h-8 bg-gradient-to-r from-[#eb001b] to-[#f79e1b] rounded flex items-center justify-center">
                        <div className="flex">
                          <div className="w-4 h-4 bg-[#eb001b] rounded-full opacity-80"></div>
                          <div className="w-4 h-4 bg-[#f79e1b] rounded-full -ml-2 opacity-80"></div>
                        </div>
                      </div>
                      <div className="w-12 h-8 bg-[#006fcf] rounded flex items-center justify-center">
                        <span className="text-white text-[10px] font-bold">AMEX</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleCheckout}
                    className="w-full bg-green-600 hover:bg-green-700"
                    size="lg"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Redirecting to Stripe...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Proceed to Payment - ${planInfo.price}/mo
                      </>
                    )}
                  </Button>

                  {/* Trust badges */}
                  <div className="pt-4 border-t border-border">
                    <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Lock className="h-3 w-3" />
                        <span>Secure Payment</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        <span>SSL Encrypted</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground text-center mt-3">
                      Cancel anytime. No long-term contracts.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Why Stripe */}
            <div className="mt-4 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-sm text-blue-600 dark:text-blue-400">
                <strong>Why Stripe?</strong> Stripe is trusted by millions of businesses worldwide
                and provides bank-level security for your payment information.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  )
}
