import { NextResponse } from "next/server"
import { updateUser, findUserById } from "@/lib/db"
import { cookies } from "next/headers"
import { verifySignedValue } from "@/lib/signed-cookie"

// This handles the callback after GitHub OAuth when linking to existing account
export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const code = url.searchParams.get("code")

    // Get the stored signed user ID from cookie and verify it
    const cookieStore = await cookies()
    const signedUserId = cookieStore.get("github_link_user_id")?.value

    if (!code) {
      return NextResponse.redirect(new URL("/dashboard?error=github_auth_failed", request.url))
    }

    if (!signedUserId) {
      // No linking intent - redirect to dashboard with error
      return NextResponse.redirect(new URL("/dashboard?error=no_link_session", request.url))
    }

    // Verify the signed cookie to prevent tampering
    const linkUserId = verifySignedValue(signedUserId)
    if (!linkUserId) {
      return NextResponse.redirect(new URL("/dashboard?error=invalid_link_session", request.url))
    }

    // Exchange code for access token
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    })

    const tokenData = await tokenResponse.json()

    if (tokenData.error || !tokenData.access_token) {
      return NextResponse.redirect(new URL("/dashboard?error=github_token_failed", request.url))
    }

    // Verify user still exists
    const user = await findUserById(linkUserId)
    if (!user) {
      return NextResponse.redirect(new URL("/dashboard?error=user_not_found", request.url))
    }

    // Update user with GitHub token
    const updatedUser = await updateUser(linkUserId, {
      github_access_token: tokenData.access_token,
    })

    if (!updatedUser) {
      return NextResponse.redirect(new URL("/dashboard?error=github_save_failed", request.url))
    }

    // Clear the linking cookie
    const response = NextResponse.redirect(new URL("/dashboard?github=linked", request.url))
    response.cookies.delete("github_link_user_id")

    return response
  } catch {
    return NextResponse.redirect(new URL("/dashboard?error=github_callback_failed", request.url))
  }
}
