import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { cookies } from "next/headers"

// Initiates GitHub OAuth flow for linking to existing account
export async function GET(request: Request) {
  try {
    // Check if GitHub OAuth is configured
    if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
      console.error("GitHub OAuth not configured - missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET")
      return NextResponse.redirect(new URL("/dashboard?error=github_not_configured", request.url))
    }

    const session = await auth()

    console.log("GitHub link - session:", JSON.stringify(session, null, 2))

    if (!session?.user) {
      console.error("No session found for GitHub link")
      return NextResponse.redirect(new URL("/login?callbackUrl=/dashboard", request.url))
    }

    if (!session.user.id) {
      console.error("Session exists but no user ID - session.user:", JSON.stringify(session.user, null, 2))
      return NextResponse.redirect(new URL("/dashboard?error=no_user_id", request.url))
    }

    // Store the user ID in a cookie for the callback
    const cookieStore = await cookies()
    cookieStore.set("github_link_user_id", session.user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 300, // 5 minutes
      path: "/",
    })

    // Build GitHub OAuth URL
    const githubAuthUrl = new URL("https://github.com/login/oauth/authorize")
    githubAuthUrl.searchParams.set("client_id", process.env.GITHUB_CLIENT_ID)
    githubAuthUrl.searchParams.set("scope", "read:user user:email repo")
    githubAuthUrl.searchParams.set("state", crypto.randomUUID())

    // Use the callback URL configured in GitHub OAuth app
    const callbackUrl = new URL("/api/auth/callback/github", request.url).toString()
    githubAuthUrl.searchParams.set("redirect_uri", callbackUrl)

    console.log("Redirecting to GitHub OAuth:", githubAuthUrl.toString())

    return NextResponse.redirect(githubAuthUrl.toString())
  } catch (error) {
    console.error("GitHub link init error:", error)
    return NextResponse.redirect(new URL("/dashboard?error=github_link_failed", request.url))
  }
}
