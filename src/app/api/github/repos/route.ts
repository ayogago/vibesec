import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import { getGitHubToken } from "@/lib/db"

// Simple in-memory cache for repos (5 minute TTL)
const reposCache = new Map<string, { repos: FormattedRepo[]; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

interface FormattedRepo {
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

    // Check cache first
    const cacheKey = session.user.id
    const cached = reposCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({
        repos: cached.repos,
        githubConnected: true,
        total: cached.repos.length,
        cached: true,
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
            error: "GitHub token expired. Please reconnect your GitHub account."
          })
        }
        if (response.status === 403) {
          // Check for rate limit
          const rateLimitRemaining = response.headers.get("x-ratelimit-remaining")
          const rateLimitReset = response.headers.get("x-ratelimit-reset")

          if (rateLimitRemaining === "0" && rateLimitReset) {
            const resetTime = new Date(parseInt(rateLimitReset) * 1000)
            const minutesUntilReset = Math.ceil((resetTime.getTime() - Date.now()) / 60000)

            // Return cached data if available, even if stale
            if (cached) {
              return NextResponse.json({
                repos: cached.repos,
                githubConnected: true,
                total: cached.repos.length,
                cached: true,
                rateLimited: true,
                resetIn: minutesUntilReset,
              })
            }

            return NextResponse.json({
              repos: [],
              githubConnected: true,
              error: `GitHub API rate limit exceeded. Try again in ${minutesUntilReset} minute${minutesUntilReset === 1 ? '' : 's'}.`,
              rateLimited: true,
              resetIn: minutesUntilReset,
            })
          }
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

    // Return repos with consistent field names matching what dashboard expects
    const formattedRepos: FormattedRepo[] = repos.map((repo) => ({
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
    }))

    // Cache the results
    reposCache.set(cacheKey, { repos: formattedRepos, timestamp: Date.now() })

    return NextResponse.json({
      repos: formattedRepos,
      githubConnected: true,
      total: formattedRepos.length,
    })
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch repositories", githubConnected: false },
      { status: 500 }
    )
  }
}
