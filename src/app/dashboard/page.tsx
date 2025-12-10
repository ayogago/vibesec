"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Shield,
  Loader2,
  Search,
  GitBranch,
  Star,
  GitFork,
  Lock,
  Globe,
  ChevronRight,
  RefreshCw,
  History,
  Settings,
  BarChart3,
} from "lucide-react"

interface GitHubRepo {
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

interface ScanHistoryItem {
  id: string
  repoName: string
  repoUrl: string
  scannedAt: string
  securityScore: number
  totalFindings: number
  criticalCount: number
  highCount: number
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [repos, setRepos] = useState<GitHubRepo[]>([])
  const [filteredRepos, setFilteredRepos] = useState<GitHubRepo[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([])
  const [activeTab, setActiveTab] = useState<"repos" | "history">("repos")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/dashboard")
    }
  }, [status, router])

  useEffect(() => {
    if (status === "authenticated") {
      fetchRepos()
      loadScanHistory()
    }
  }, [status])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredRepos(repos)
    } else {
      const query = searchQuery.toLowerCase()
      setFilteredRepos(
        repos.filter(
          (repo) =>
            repo.name.toLowerCase().includes(query) ||
            repo.full_name.toLowerCase().includes(query) ||
            repo.description?.toLowerCase().includes(query) ||
            repo.language?.toLowerCase().includes(query)
        )
      )
    }
  }, [searchQuery, repos])

  const fetchRepos = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch("/api/github/repos")

      if (!response.ok) {
        throw new Error("Failed to fetch repositories")
      }

      const data = await response.json()
      setRepos(data.repos)
      setFilteredRepos(data.repos)
    } catch (err) {
      setError("Failed to load repositories. Please try again.")
      console.error("Error fetching repos:", err)
    } finally {
      setLoading(false)
    }
  }

  const loadScanHistory = () => {
    if (typeof window !== "undefined") {
      const history = localStorage.getItem("vibesec_scan_history")
      if (history) {
        try {
          setScanHistory(JSON.parse(history))
        } catch {
          setScanHistory([])
        }
      }
    }
  }

  const saveScanToHistory = (item: ScanHistoryItem) => {
    const newHistory = [item, ...scanHistory.filter(h => h.repoName !== item.repoName)].slice(0, 20)
    setScanHistory(newHistory)
    localStorage.setItem("vibesec_scan_history", JSON.stringify(newHistory))
  }

  const handleScanRepo = async (repo: GitHubRepo) => {
    setScanning(repo.full_name)

    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoUrl: repo.html_url,
          githubToken: session?.accessToken,
        }),
      })

      if (!response.ok) {
        throw new Error("Scan failed")
      }

      const result = await response.json()

      // Save to session storage for results page
      sessionStorage.setItem("scanResult", JSON.stringify(result))

      // Save to scan history
      saveScanToHistory({
        id: Date.now().toString(),
        repoName: repo.full_name,
        repoUrl: repo.html_url,
        scannedAt: new Date().toISOString(),
        securityScore: result.securityScore,
        totalFindings: result.findings.length,
        criticalCount: result.findings.filter((f: { severity: string }) => f.severity === "CRITICAL").length,
        highCount: result.findings.filter((f: { severity: string }) => f.severity === "HIGH").length,
      })

      // Navigate to results
      router.push("/results")
    } catch (err) {
      console.error("Scan error:", err)
      setError("Failed to scan repository. Please try again.")
    } finally {
      setScanning(null)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500"
    if (score >= 50) return "text-yellow-500"
    return "text-red-500"
  }

  const getLanguageColor = (language: string | null) => {
    const colors: Record<string, string> = {
      TypeScript: "bg-blue-500",
      JavaScript: "bg-yellow-500",
      Python: "bg-green-500",
      Go: "bg-cyan-500",
      Rust: "bg-orange-500",
      Java: "bg-red-500",
      Ruby: "bg-red-400",
      PHP: "bg-purple-500",
    }
    return colors[language || ""] || "bg-gray-500"
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return "Today"
    if (days === 1) return "Yesterday"
    if (days < 7) return `${days} days ago`
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`
    return date.toLocaleDateString()
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (status === "unauthenticated") {
    return null
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            {session?.user?.image && (
              <img
                src={session.user.image}
                alt={session.user.name || "User"}
                className="w-12 h-12 rounded-full border-2 border-primary/20"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold">
                Welcome back, {session?.user?.name?.split(" ")[0] || "User"}
              </h1>
              <p className="text-muted-foreground">
                Select a repository to scan for security vulnerabilities
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{scanHistory.length}</p>
                <p className="text-sm text-muted-foreground">Total Scans</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/10">
                <GitBranch className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{repos.length}</p>
                <p className="text-sm text-muted-foreground">Repositories</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/10">
                <BarChart3 className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {scanHistory.length > 0
                    ? Math.round(
                        scanHistory.reduce((acc, s) => acc + s.securityScore, 0) /
                          scanHistory.length
                      )
                    : "-"}
                </p>
                <p className="text-sm text-muted-foreground">Avg. Security Score</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === "repos" ? "default" : "outline"}
            onClick={() => setActiveTab("repos")}
            className="gap-2"
          >
            <GitBranch className="h-4 w-4" />
            Repositories
          </Button>
          <Button
            variant={activeTab === "history" ? "default" : "outline"}
            onClick={() => setActiveTab("history")}
            className="gap-2"
          >
            <History className="h-4 w-4" />
            Scan History
          </Button>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
            {error}
          </div>
        )}

        {activeTab === "repos" && (
          <>
            {/* Search and Refresh */}
            <div className="flex gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search repositories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background/50"
                />
              </div>
              <Button
                variant="outline"
                onClick={fetchRepos}
                disabled={loading}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>

            {/* Repository List */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-3 text-muted-foreground">Loading repositories...</span>
              </div>
            ) : filteredRepos.length === 0 ? (
              <div className="text-center py-12">
                <GitBranch className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery ? "No repositories match your search" : "No repositories found"}
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredRepos.map((repo) => (
                  <Card
                    key={repo.id}
                    className="bg-card/50 backdrop-blur border-border/50 hover:border-primary/50 transition-colors"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold truncate">{repo.name}</h3>
                            {repo.private ? (
                              <Badge variant="secondary" className="gap-1 text-xs">
                                <Lock className="h-3 w-3" />
                                Private
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="gap-1 text-xs">
                                <Globe className="h-3 w-3" />
                                Public
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate mb-2">
                            {repo.description || "No description"}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            {repo.language && (
                              <span className="flex items-center gap-1">
                                <span
                                  className={`w-2 h-2 rounded-full ${getLanguageColor(
                                    repo.language
                                  )}`}
                                />
                                {repo.language}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Star className="h-3 w-3" />
                              {repo.stargazers_count}
                            </span>
                            <span className="flex items-center gap-1">
                              <GitFork className="h-3 w-3" />
                              {repo.forks_count}
                            </span>
                            <span>Updated {formatDate(repo.updated_at)}</span>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleScanRepo(repo)}
                          disabled={scanning !== null}
                          className="gap-2 shrink-0"
                        >
                          {scanning === repo.full_name ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Scanning...
                            </>
                          ) : (
                            <>
                              <Shield className="h-4 w-4" />
                              Scan
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === "history" && (
          <>
            {scanHistory.length === 0 ? (
              <div className="text-center py-12">
                <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No scan history yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Scan a repository to see your history here
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {scanHistory.map((scan) => (
                  <Card
                    key={scan.id}
                    className="bg-card/50 backdrop-blur border-border/50 hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => {
                      // Re-scan the repo
                      const repo = repos.find((r) => r.full_name === scan.repoName)
                      if (repo) {
                        handleScanRepo(repo)
                      }
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate mb-1">{scan.repoName}</h3>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Scanned {formatDate(scan.scannedAt)}</span>
                            <span>{scan.totalFindings} findings</span>
                            {scan.criticalCount > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {scan.criticalCount} Critical
                              </Badge>
                            )}
                            {scan.highCount > 0 && (
                              <Badge className="text-xs bg-orange-500">
                                {scan.highCount} High
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className={`text-2xl font-bold ${getScoreColor(scan.securityScore)}`}>
                              {scan.securityScore}
                            </p>
                            <p className="text-xs text-muted-foreground">Security Score</p>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  )
}
