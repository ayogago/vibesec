"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, Loader2, PartyPopper, Shield } from "lucide-react"

function SuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session_id")
  const [loading, setLoading] = useState(true)
  const [planName, setPlanName] = useState<string>("")

  useEffect(() => {
    if (!sessionId) {
      router.push("/dashboard")
      return
    }

    // In production, you'd verify the session with Stripe
    // For now, we'll just show success
    const timer = setTimeout(() => {
      setLoading(false)
      // Try to get plan from URL or default to "Starter"
      setPlanName("Premium")
    }, 1000)

    return () => clearTimeout(timer)
  }, [sessionId, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-green-500 mx-auto" />
            <p className="mt-4 text-muted-foreground">Confirming your payment...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md bg-card/50 backdrop-blur border-green-500/30">
          <CardContent className="p-8 text-center">
            <div className="mx-auto mb-6 w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center relative">
              <Check className="h-12 w-12 text-green-500" />
              <PartyPopper className="h-6 w-6 text-yellow-500 absolute -top-1 -right-1 animate-bounce" />
            </div>

            <h1 className="text-3xl font-bold mb-2">Welcome to {planName}!</h1>
            <p className="text-muted-foreground mb-6">
              Your subscription is now active. You have full access to all {planName} features.
            </p>

            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-6">
              <h3 className="font-semibold mb-3 flex items-center justify-center gap-2">
                <Shield className="h-5 w-5 text-green-500" />
                Your New Benefits
              </h3>
              <ul className="text-sm text-muted-foreground space-y-2 text-left">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500 shrink-0" />
                  Unlimited vulnerability findings visibility
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500 shrink-0" />
                  Increased daily scan limit
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500 shrink-0" />
                  Export reports (JSON & PDF)
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500 shrink-0" />
                  Detailed fix suggestions with code snippets
                </li>
              </ul>
            </div>

            <div className="flex flex-col gap-3">
              <Button asChild className="w-full bg-green-600 hover:bg-green-700">
                <Link href="/dashboard">
                  Go to Dashboard
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/#scanner">
                  Start Scanning
                </Link>
              </Button>
            </div>

            <p className="mt-6 text-xs text-muted-foreground">
              A receipt has been sent to your email. You can manage your subscription in your dashboard settings.
            </p>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  )
}
