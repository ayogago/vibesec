"use client"

import { signIn, useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState, Suspense } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { Shield, Loader2, Mail, Lock, ArrowRight } from "lucide-react"
import { validateCredentials, setCurrentUser, initializeAdminUser } from "@/lib/users"
import { SubscriptionTier } from "@/lib/subscription"

function LoginContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const authError = searchParams.get("error")
  const selectedPlan = searchParams.get("plan") as SubscriptionTier | null
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  // Initialize admin user on page load
  useEffect(() => {
    initializeAdminUser()
  }, [])

  useEffect(() => {
    if (status === "authenticated") {
      if (selectedPlan && selectedPlan !== "free" && selectedPlan !== "anonymous") {
        router.push(`/checkout?plan=${selectedPlan}`)
      } else {
        router.push(callbackUrl)
      }
    }
  }, [status, router, selectedPlan, callbackUrl])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    if (!email || !password) {
      setError("Email and password are required")
      setLoading(false)
      return
    }

    try {
      // First try to validate against the database
      let user = null
      let userId = ""
      let userName = ""

      try {
        const dbResponse = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        })

        if (dbResponse.ok) {
          const data = await dbResponse.json()
          user = data.user
          userId = user.id
          userName = user.name
        }
      } catch {
        // Database not available, fall back to localStorage
      }

      // If database validation failed, try localStorage
      if (!user) {
        const localUser = validateCredentials(email, password)
        if (localUser) {
          user = localUser
          userId = localUser.id
          userName = localUser.name
        }
      }

      if (!user) {
        setError("Invalid email or password")
        setLoading(false)
        return
      }

      // Set current user in localStorage
      setCurrentUser(userId)

      // Sign in with credentials
      const signInResult = await signIn("credentials", {
        email: user.email,
        userId: userId,
        userName: userName,
        redirect: false,
      })

      if (signInResult?.error) {
        console.error("SignIn error:", signInResult.error)
        setError("Failed to sign in. Please try again.")
        setLoading(false)
        return
      }

      // Check if user has a pending plan or selected a new plan
      const pendingPlan = user.pendingPlan || user.pending_plan
      const subscription = user.subscription
      const redirectPlan = selectedPlan || pendingPlan
      if (redirectPlan && redirectPlan !== "free" && redirectPlan !== "anonymous" && subscription === "free") {
        router.push(`/checkout?plan=${redirectPlan}`)
      } else {
        router.push(callbackUrl)
      }
    } catch (err) {
      console.error("Login error:", err)
      setError("An unexpected error occurred. Please try again.")
      setLoading(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (status === "authenticated") {
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
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md bg-card/50 backdrop-blur border-border/50">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Welcome Back</CardTitle>
            <CardDescription className="text-muted-foreground">
              Sign in to your SecureSiteScan account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(error || authError) && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {error ||
                  (authError === "OAuthAccountNotLinked"
                    ? "This email is already associated with another account."
                    : authError === "OAuthSignin"
                    ? "Error occurred during sign in. Please try again."
                    : authError === "OAuthCallback"
                    ? "Error occurred during callback. Please try again."
                    : authError === "CredentialsSignin"
                    ? "Invalid email or password."
                    : "An error occurred. Please try again.")}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
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
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-sm font-medium">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="text-center text-sm text-muted-foreground mt-4">
              Don&apos;t have an account?{" "}
              <Link
                href={selectedPlan ? `/signup?plan=${selectedPlan}` : "/signup"}
                className="text-primary hover:underline"
              >
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
