import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import { getGitHubToken } from "@/lib/db"

export interface GitHubRepo {
  id: number
  name: string
  full_name: string
  description: string | null
  private: boolean
  html_url: string
  updated_at: string
  pushed_at: string
  language: string | null
  default_branch: string
  stargazers_count: number
  forks_count: number
  fork: boolean
  owner: {
    login: string
    avatar_url: string
  }
}

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in.", githubConnected: false },
        { status: 401 }
      )
    }

    // Get the user's GitHub token from database
    const githubToken = await getGitHubToken(session.user.id)

    if (!githubToken) {
      return NextResponse.json({
        repos: [],
        githubConnected: false,
        message: "Connect your GitHub account to scan private repositories."
      })
    }

    // Fetch user's repositories from GitHub
    const repos: GitHubRepo[] = []
    let page = 1
    const perPage = 100

    while (true) {
      const response = await fetch(
        `https://api.github.com/user/repos?sort=pushed&per_page=${perPage}&page=${page}&affiliation=owner,collaborator,organization_member`,
        {
          headers: {
            Authorization: `Bearer ${githubToken}`,
            Accept: "application/vnd.github.v3+json",
            "User-Agent": "SecureSiteScan",
          },
        }
      )

      if (!response.ok) {
        if (response.status === 401) {
          return NextResponse.json({
            repos: [],
            githubConnected: false,
            error: "GitHub token expired. Please sign in with GitHub again."
          })
        }
        throw new Error(`GitHub API error: ${response.status}`)
      }

      const pageRepos: GitHubRepo[] = await response.json()

      if (pageRepos.length === 0) {
        break
      }

      repos.push(...pageRepos)

      // Limit to 500 repos to avoid performance issues
      if (repos.length >= 500 || pageRepos.length < perPage) {
        break
      }

      page++
    }

    // Format repos for the frontend
    const formattedRepos = repos.map((repo) => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      private: repo.private,
      url: repo.html_url,
      description: repo.description,
      defaultBranch: repo.default_branch,
      updatedAt: repo.updated_at,
      pushedAt: repo.pushed_at,
      language: repo.language,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      fork: repo.fork,
      owner: repo.owner.login,
      ownerAvatar: repo.owner.avatar_url,
    }))

    return NextResponse.json({
      repos: formattedRepos,
      githubConnected: true,
      total: formattedRepos.length,
    })
  } catch (error) {
    console.error("GitHub repos error:", error)
    return NextResponse.json(
      { error: "Failed to fetch repositories", githubConnected: false },
      { status: 500 }
    )
  }
}
