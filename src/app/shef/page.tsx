"use client"

import { signIn, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Shield, Loader2, Mail, Lock, ArrowRight } from "lucide-react"
import { validateCredentials, setCurrentUser, initializeAdminUser } from "@/lib/users"

// Admin emails that are allowed to access the admin dashboard
const ADMIN_EMAILS = ["info@securesitescan.com", "owner@securesitescan.com"]

export default function ShefPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  // Initialize admin user on page load
  useEffect(() => {
    initializeAdminUser()
  }, [])

  useEffect(() => {
    if (status === "authenticated" && session?.user?.email) {
      // Check if user is admin
      if (ADMIN_EMAILS.includes(session.user.email)) {
        router.push("/admin")
      } else {
        // Not an admin, sign them out and show error
        setError("Access denied. Admin credentials required.")
      }
    }
  }, [status, session, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    if (!email || !password) {
      setError("Email and password are required")
      setLoading(false)
      return
    }

    // Check if email is in admin list
    if (!ADMIN_EMAILS.includes(email.toLowerCase())) {
      setError("Access denied. Admin credentials required.")
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

      // Redirect to admin dashboard
      router.push("/admin")
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

  if (status === "authenticated" && session?.user?.email && ADMIN_EMAILS.includes(session.user.email)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Redirecting to admin dashboard...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <Card className="w-full max-w-md bg-card/50 backdrop-blur border-border/50">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Admin Access</CardTitle>
          <CardDescription className="text-muted-foreground">
            Sign in with your admin credentials
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
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
                  Access Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="mt-8 text-xs text-muted-foreground">
        SecureSiteScan Admin Portal
      </p>
    </div>
  )
}
