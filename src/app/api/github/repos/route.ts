import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export interface GitHubRepo {
  id: number
  name: string
  full_name: string
  description: string | null
  private: boolean
  html_url: string
  updated_at: string
  language: string | null
  default_branch: string
  stargazers_count: number
  forks_count: number
  owner: {
    login: string
    avatar_url: string
  }
}

export async function GET() {
  try {
    const session = await auth()

    if (!session || !session.accessToken) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in with GitHub." },
        { status: 401 }
      )
    }

    // Fetch user's repos from GitHub
    const response = await fetch(
      "https://api.github.com/user/repos?sort=updated&per_page=100&type=all",
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    )

    if (!response.ok) {
      const error = await response.text()
      console.error("GitHub API error:", error)
      return NextResponse.json(
        { error: "Failed to fetch repositories from GitHub" },
        { status: response.status }
      )
    }

    const repos: GitHubRepo[] = await response.json()

    // Return repos sorted by most recently updated
    return NextResponse.json({
      repos: repos.map((repo) => ({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description,
        private: repo.private,
        html_url: repo.html_url,
        updated_at: repo.updated_at,
        language: repo.language,
        default_branch: repo.default_branch,
        stargazers_count: repo.stargazers_count,
        forks_count: repo.forks_count,
        owner: {
          login: repo.owner.login,
          avatar_url: repo.owner.avatar_url,
        },
      })),
    })
  } catch (error) {
    console.error("Error fetching repos:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
