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
import { Github, Shield, Loader2, Mail, Lock, ArrowRight } from "lucide-react"
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
  const [initialized, setInitialized] = useState(false)

  // Initialize admin user on mount
  useEffect(() => {
    initializeAdminUser()
    setInitialized(true)
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

    // Make sure admin user is initialized
    if (!initialized) {
      initializeAdminUser()
    }

    // Validate credentials
    const user = validateCredentials(email, password)

    if (!user) {
      setError("Invalid email or password. For admin access, use: admin@vibesec.dev / admin123")
      setLoading(false)
      return
    }

    // Set current user in localStorage
    setCurrentUser(user.id)

    // Sign in with credentials
    const signInResult = await signIn("credentials", {
      email: user.email,
      userId: user.id,
      userName: user.name,
      redirect: false,
    })

    if (signInResult?.error) {
      setError("Failed to sign in. Please try again.")
      setLoading(false)
      return
    }

    // Check if user has a pending plan or selected a new plan
    const redirectPlan = selectedPlan || user.pendingPlan
    if (redirectPlan && redirectPlan !== "free" && redirectPlan !== "anonymous" && user.subscription === "free") {
      router.push(`/checkout?plan=${redirectPlan}`)
    } else {
      router.push(callbackUrl)
    }
  }

  const handleGitHubSignIn = () => {
    const redirectUrl = selectedPlan && selectedPlan !== "free" && selectedPlan !== "anonymous"
      ? `/checkout?plan=${selectedPlan}`
      : callbackUrl
    signIn("github", { callbackUrl: redirectUrl })
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
              Sign in to your VibeSec account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(error || (authError && !error)) && (
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
                    : authError === "Configuration"
                    ? "Server configuration error. Please try again."
                    : "An error occurred. Please try again.")}
              </div>
            )}

            {/* Admin hint */}
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm">
              <strong>Admin access:</strong> admin@vibesec.dev / admin123
            </div>

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
                    onChange={(e) => {
                      setEmail(e.target.value)
                      setError("")
                    }}
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
                    onChange={(e) => {
                      setPassword(e.target.value)
                      setError("")
                    }}
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

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <Button
              onClick={handleGitHubSignIn}
              variant="outline"
              className="w-full"
              disabled={loading}
            >
              <Github className="mr-2 h-5 w-5" />
              Continue with GitHub
            </Button>

            <div className="text-center text-sm text-muted-foreground mt-4">
              Don&apos;t have an account?{" "}
              <Link
                href={selectedPlan ? `/signup?plan=${selectedPlan}` : "/signup"}
                className="text-primary hover:underline"
              >
                Sign up
              </Link>
            </div>

            {/* GitHub Benefits */}
            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-xs text-muted-foreground mb-3">Sign in with GitHub to:</p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-green-500 text-xs">✓</span>
                  </div>
                  <p>Access repositories directly from dashboard</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-green-500 text-xs">✓</span>
                  </div>
                  <p>Scan private repositories securely</p>
                </div>
              </div>
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
