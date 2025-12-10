"use client"

import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState, Suspense } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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
} from "lucide-react"
import { SubscriptionTier, SUBSCRIPTION_LIMITS } from "@/lib/subscription"
import { getCurrentUser, updateUser, activateSubscription } from "@/lib/users"

function CheckoutContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedPlan = searchParams.get("plan") as SubscriptionTier | null

  const [cardNumber, setCardNumber] = useState("")
  const [expiry, setExpiry] = useState("")
  const [cvc, setCvc] = useState("")
  const [cardName, setCardName] = useState("")
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/login?plan=${selectedPlan || "starter"}`)
    }
  }, [status, router, selectedPlan])

  // Redirect if no plan selected or invalid plan
  useEffect(() => {
    if (!selectedPlan || !["starter", "pro"].includes(selectedPlan)) {
      router.push("/pricing")
    }
  }, [selectedPlan, router])

  const planInfo = selectedPlan ? SUBSCRIPTION_LIMITS[selectedPlan] : null

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "")
    const matches = v.match(/\d{4,16}/g)
    const match = (matches && matches[0]) || ""
    const parts = []
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }
    if (parts.length) {
      return parts.join(" ")
    } else {
      return value
    }
  }

  // Format expiry date
  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "")
    if (v.length >= 2) {
      return v.substring(0, 2) + "/" + v.substring(2, 4)
    }
    return v
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setProcessing(true)

    // Basic validation
    if (!cardNumber || cardNumber.replace(/\s/g, "").length < 16) {
      setError("Please enter a valid card number")
      setProcessing(false)
      return
    }

    if (!expiry || expiry.length < 5) {
      setError("Please enter a valid expiry date")
      setProcessing(false)
      return
    }

    if (!cvc || cvc.length < 3) {
      setError("Please enter a valid CVC")
      setProcessing(false)
      return
    }

    if (!cardName) {
      setError("Please enter the name on your card")
      setProcessing(false)
      return
    }

    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // In production, you would:
    // 1. Send card details to Stripe/payment processor
    // 2. Create a subscription
    // 3. Update the user's subscription in the database

    // For demo, we'll just update the local user's subscription
    const currentUser = getCurrentUser()
    if (currentUser && selectedPlan) {
      activateSubscription(currentUser.id, selectedPlan)
    }

    setSuccess(true)
    setProcessing(false)

    // Redirect to dashboard after 2 seconds
    setTimeout(() => {
      router.push("/dashboard")
    }, 2000)
  }

  const handleSkip = () => {
    // Clear pending plan and go to dashboard with free tier
    const currentUser = getCurrentUser()
    if (currentUser) {
      updateUser(currentUser.id, { pendingPlan: undefined })
    }
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

  if (success) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <Card className="w-full max-w-md bg-card/50 backdrop-blur border-border/50">
            <CardContent className="p-8 text-center">
              <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center">
                <Check className="h-10 w-10 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
              <p className="text-muted-foreground mb-4">
                Welcome to VibeSec {planInfo.name}! You now have access to all{" "}
                {planInfo.name} features.
              </p>
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 mb-6">
                <p className="text-sm font-medium">Your new benefits:</p>
                <ul className="mt-2 text-sm text-muted-foreground space-y-1">
                  <li>{planInfo.dailyScans} scans per day</li>
                  <li>View all findings</li>
                  <li>Detailed fix suggestions</li>
                </ul>
              </div>
              <p className="text-sm text-muted-foreground">
                Redirecting to dashboard...
              </p>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
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

            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{planInfo.name} Plan</span>
                  <Badge className="bg-green-600">${planInfo.price}/mo</Badge>
                </CardTitle>
                <CardDescription>
                  Unlock the full power of VibeSec security scanning
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
                    <span>Export reports (JSON{selectedPlan === "pro" ? ", PDF, SARIF" : ""})</span>
                  </li>
                  {selectedPlan === "pro" && (
                    <>
                      <li className="flex items-center gap-3 text-sm">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>API access & CI/CD integration</span>
                      </li>
                      <li className="flex items-center gap-3 text-sm">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>Priority support</span>
                      </li>
                    </>
                  )}
                </ul>

                <div className="mt-6 pt-6 border-t border-border">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${planInfo.price}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-4">
                    <span className="text-muted-foreground">Tax</span>
                    <span>$0.00</span>
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

          {/* Payment Form */}
          <div>
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Details
                </CardTitle>
                <CardDescription>
                  Your payment is secured with 256-bit encryption
                </CardDescription>
              </CardHeader>
              <CardContent>
                {error && (
                  <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="cardName" className="text-sm font-medium">
                      Name on Card
                    </label>
                    <Input
                      id="cardName"
                      type="text"
                      placeholder="John Doe"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="cardNumber" className="text-sm font-medium">
                      Card Number
                    </label>
                    <div className="relative">
                      <Input
                        id="cardNumber"
                        type="text"
                        placeholder="1234 5678 9012 3456"
                        value={cardNumber}
                        onChange={(e) =>
                          setCardNumber(formatCardNumber(e.target.value))
                        }
                        maxLength={19}
                        required
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                        <div className="w-8 h-5 bg-blue-600 rounded text-[8px] text-white flex items-center justify-center font-bold">
                          VISA
                        </div>
                        <div className="w-8 h-5 bg-red-500 rounded text-[8px] text-white flex items-center justify-center font-bold">
                          MC
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="expiry" className="text-sm font-medium">
                        Expiry Date
                      </label>
                      <Input
                        id="expiry"
                        type="text"
                        placeholder="MM/YY"
                        value={expiry}
                        onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                        maxLength={5}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="cvc" className="text-sm font-medium">
                        CVC
                      </label>
                      <Input
                        id="cvc"
                        type="text"
                        placeholder="123"
                        value={cvc}
                        onChange={(e) =>
                          setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))
                        }
                        maxLength={4}
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-green-600 hover:bg-green-700"
                    size="lg"
                    disabled={processing}
                  >
                    {processing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Pay ${planInfo.price}/month
                      </>
                    )}
                  </Button>
                </form>

                {/* Trust badges */}
                <div className="mt-6 pt-6 border-t border-border">
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
              </CardContent>
            </Card>

            {/* Demo Notice */}
            <div className="mt-4 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <p className="text-sm text-yellow-600 dark:text-yellow-500">
                <strong>Demo Mode:</strong> This is a demonstration. No real payment will be processed.
                Use any test card number (e.g., 4242 4242 4242 4242).
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
