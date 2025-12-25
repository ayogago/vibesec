import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { cookies } from "next/headers"

// Initiates GitHub OAuth flow for linking to existing account
export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.redirect(new URL("/login", request.url))
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
    githubAuthUrl.searchParams.set("client_id", process.env.GITHUB_CLIENT_ID!)
    githubAuthUrl.searchParams.set("scope", "read:user user:email repo")
    githubAuthUrl.searchParams.set("state", crypto.randomUUID())

    // Use our custom callback for linking
    const callbackUrl = new URL("/api/auth/github-callback", request.url).toString()
    githubAuthUrl.searchParams.set("redirect_uri", callbackUrl)

    return NextResponse.redirect(githubAuthUrl.toString())
  } catch (error) {
    console.error("GitHub link init error:", error)
    return NextResponse.redirect(new URL("/dashboard?error=github_link_failed", request.url))
  }
}
