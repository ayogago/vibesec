import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { cookies } from "next/headers"
import { signValue } from "@/lib/signed-cookie"

// Initiates GitHub OAuth flow for linking to existing account
export async function GET(request: Request) {
  try {
    // Check if GitHub OAuth is configured
    if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
      return NextResponse.redirect(new URL("/dashboard?error=github_not_configured", request.url))
    }

    const session = await auth()

    if (!session?.user) {
      return NextResponse.redirect(new URL("/login?callbackUrl=/dashboard", request.url))
    }

    if (!session.user.id) {
      return NextResponse.redirect(new URL("/dashboard?error=no_user_id", request.url))
    }

    // Store the signed user ID in a cookie for the callback
    // Signing prevents tampering with the user ID
    const cookieStore = await cookies()
    const signedUserId = signValue(session.user.id)
    cookieStore.set("github_link_user_id", signedUserId, {
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

    return NextResponse.redirect(githubAuthUrl.toString())
  } catch {
    return NextResponse.redirect(new URL("/dashboard?error=github_link_failed", request.url))
  }
}
