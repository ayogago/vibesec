import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { updateUser, findUserById } from "@/lib/db"

// This endpoint is called after GitHub OAuth to link the GitHub account to an existing user
export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
    }

    const { githubAccessToken } = await request.json()

    if (!githubAccessToken) {
      return NextResponse.json(
        { error: "GitHub access token required" },
        { status: 400 }
      )
    }

    // Verify the token works by making a test API call
    const githubResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${githubAccessToken}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "SecureSiteScan",
      },
    })

    if (!githubResponse.ok) {
      return NextResponse.json(
        { error: "Invalid GitHub token" },
        { status: 400 }
      )
    }

    // Update the user with the GitHub token
    const updatedUser = await updateUser(session.user.id, {
      github_access_token: githubAccessToken,
    })

    if (!updatedUser) {
      return NextResponse.json(
        { error: "Failed to link GitHub account" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "GitHub account linked successfully",
    })
  } catch (error) {
    console.error("Link GitHub error:", error)
    return NextResponse.json(
      { error: "Failed to link GitHub account" },
      { status: 500 }
    )
  }
}
