"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
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
  CreditCard,
  BarChart3,
  Crown,
  Zap,
  Check,
  AlertTriangle,
  Calendar,
  ExternalLink,
  TrendingUp,
  TrendingDown,
} from "lucide-react"
import { getCurrentUser, getScanHistory, addScanToHistory, ScanHistoryItem } from "@/lib/users"
import { SUBSCRIPTION_LIMITS, SubscriptionTier } from "@/lib/subscription"

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
  const [activeTab, setActiveTab] = useState<"repos" | "history" | "subscription">("repos")
  const [userSubscription, setUserSubscription] = useState<SubscriptionTier>("free")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/dashboard")
    }
  }, [status, router])

  useEffect(() => {
    if (status === "authenticated") {
      fetchRepos()
      loadUserData()
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
        // If GitHub repos fail, just show empty state
        setRepos([])
        setFilteredRepos([])
        return
      }

      const data = await response.json()
      setRepos(data.repos || [])
      setFilteredRepos(data.repos || [])
    } catch (err) {
      console.error("Error fetching repos:", err)
      setRepos([])
      setFilteredRepos([])
    } finally {
      setLoading(false)
    }
  }

  const loadUserData = () => {
    const user = getCurrentUser()
    if (user) {
      setUserSubscription(user.subscription)
      setScanHistory(getScanHistory(user.id))
    } else {
      // Fallback to localStorage for non-credential users
      if (typeof window !== "undefined") {
        const history = localStorage.getItem("securesitescan_scan_history")
        if (history) {
          try {
            setScanHistory(JSON.parse(history))
          } catch {
            setScanHistory([])
          }
        }
        const sub = localStorage.getItem("securesitescan_subscription") as SubscriptionTier
        if (sub) {
          setUserSubscription(sub)
        }
      }
    }
  }

  const saveScanToHistory = (scan: Omit<ScanHistoryItem, "id">) => {
    const user = getCurrentUser()
    if (user) {
      const newScan = addScanToHistory(user.id, scan)
      setScanHistory([newScan, ...scanHistory.filter(h => h.repoName !== scan.repoName)].slice(0, 50))
    } else {
      // Fallback for non-credential users
      const newScan: ScanHistoryItem = {
        ...scan,
        id: `scan_${Date.now()}`,
      }
      const newHistory = [newScan, ...scanHistory.filter(h => h.repoName !== scan.repoName)].slice(0, 50)
      setScanHistory(newHistory)
      localStorage.setItem("securesitescan_scan_history", JSON.stringify(newHistory))
    }
  }

  const handleScanRepo = async (repo: GitHubRepo) => {
    setScanning(repo.full_name)

    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoUrl: repo.html_url,
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
        repoName: repo.full_name,
        repoUrl: repo.html_url,
        scannedAt: new Date().toISOString(),
        securityScore: result.securityScore,
        totalFindings: result.findings.length,
        criticalCount: result.findings.filter((f: { severity: string }) => f.severity === "CRITICAL").length,
        highCount: result.findings.filter((f: { severity: string }) => f.severity === "HIGH").length,
        mediumCount: result.findings.filter((f: { severity: string }) => f.severity === "MEDIUM").length,
        lowCount: result.findings.filter((f: { severity: string }) => f.severity === "LOW").length,
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

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-green-500"
    if (score >= 50) return "bg-yellow-500"
    return "bg-red-500"
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

  const formatFullDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const subscriptionLimits = SUBSCRIPTION_LIMITS[userSubscription]

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
      <main className="flex-1 container mx-auto px-4 pt-24 pb-8 max-w-6xl">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {session?.user?.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  className="w-12 h-12 rounded-full border-2 border-primary/20"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-lg font-semibold">
                    {session?.user?.name?.charAt(0) || session?.user?.email?.charAt(0) || "U"}
                  </span>
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold">
                    Welcome back, {session?.user?.name?.split(" ")[0] || "User"}
                  </h1>
                  <Badge
                    className={
                      userSubscription === "pro"
                        ? "bg-gradient-to-r from-purple-500 to-pink-500"
                        : userSubscription === "starter"
                        ? "bg-blue-500"
                        : "bg-muted"
                    }
                  >
                    {subscriptionLimits.name}
                  </Badge>
                </div>
                <p className="text-muted-foreground">
                  {session?.user?.email}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
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
                <p className={`text-2xl font-bold ${scanHistory.length > 0 ? getScoreColor(
                  Math.round(scanHistory.reduce((acc, s) => acc + s.securityScore, 0) / scanHistory.length)
                ) : ""}`}>
                  {scanHistory.length > 0
                    ? Math.round(
                        scanHistory.reduce((acc, s) => acc + s.securityScore, 0) /
                          scanHistory.length
                      )
                    : "-"}
                </p>
                <p className="text-sm text-muted-foreground">Avg. Score</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-500/10">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {scanHistory.reduce((acc, s) => acc + s.criticalCount + s.highCount, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Critical/High Issues</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
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
          <Button
            variant={activeTab === "subscription" ? "default" : "outline"}
            onClick={() => setActiveTab("subscription")}
            className="gap-2"
          >
            <CreditCard className="h-4 w-4" />
            Subscription
          </Button>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
            {error}
            <button onClick={() => setError(null)} className="ml-2 underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Repositories Tab */}
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

            {/* Note for users */}
            {repos.length === 0 && !loading && (
              <div className="mb-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400">
                <p className="text-sm">
                  <strong>Tip:</strong> Scan any public repository by going to the{" "}
                  <Link href="/" className="underline">homepage</Link> and entering a GitHub URL.
                </p>
              </div>
            )}

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
                <p className="text-sm text-muted-foreground mt-2">
                  You can still scan any public repository from the{" "}
                  <Link href="/" className="text-primary underline">homepage</Link>
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

        {/* Scan History Tab */}
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
              <div className="space-y-4">
                {/* Summary Card */}
                <Card className="bg-card/50 backdrop-blur border-border/50">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold">{scanHistory.length}</p>
                        <p className="text-xs text-muted-foreground">Total Scans</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-red-500">
                          {scanHistory.reduce((acc, s) => acc + s.criticalCount, 0)}
                        </p>
                        <p className="text-xs text-muted-foreground">Critical Issues</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-orange-500">
                          {scanHistory.reduce((acc, s) => acc + s.highCount, 0)}
                        </p>
                        <p className="text-xs text-muted-foreground">High Issues</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-yellow-500">
                          {scanHistory.reduce((acc, s) => acc + s.mediumCount, 0)}
                        </p>
                        <p className="text-xs text-muted-foreground">Medium Issues</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* History List */}
                <div className="grid gap-4">
                  {scanHistory.map((scan, index) => {
                    const prevScan = scanHistory.find(
                      (s, i) => i > index && s.repoName === scan.repoName
                    )
                    const scoreDiff = prevScan
                      ? scan.securityScore - prevScan.securityScore
                      : null

                    return (
                      <Card
                        key={scan.id}
                        className="bg-card/50 backdrop-blur border-border/50 hover:border-primary/50 transition-colors"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold truncate">{scan.repoName}</h3>
                                <a
                                  href={scan.repoUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-muted-foreground hover:text-primary"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                                <Calendar className="h-3 w-3" />
                                <span>{formatFullDate(scan.scannedAt)}</span>
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {scan.totalFindings} findings
                                </Badge>
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
                                {scan.mediumCount > 0 && (
                                  <Badge className="text-xs bg-yellow-500 text-black">
                                    {scan.mediumCount} Medium
                                  </Badge>
                                )}
                                {scan.lowCount > 0 && (
                                  <Badge variant="secondary" className="text-xs">
                                    {scan.lowCount} Low
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className="flex items-center gap-2 justify-end">
                                  <p className={`text-2xl font-bold ${getScoreColor(scan.securityScore)}`}>
                                    {scan.securityScore}
                                  </p>
                                  {scoreDiff !== null && scoreDiff !== 0 && (
                                    <div className={`flex items-center text-xs ${scoreDiff > 0 ? "text-green-500" : "text-red-500"}`}>
                                      {scoreDiff > 0 ? (
                                        <TrendingUp className="h-3 w-3 mr-0.5" />
                                      ) : (
                                        <TrendingDown className="h-3 w-3 mr-0.5" />
                                      )}
                                      {scoreDiff > 0 ? "+" : ""}{scoreDiff}
                                    </div>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">Security Score</p>
                                <div className="w-24 h-1.5 bg-muted rounded-full mt-1">
                                  <div
                                    className={`h-full rounded-full ${getScoreBgColor(scan.securityScore)}`}
                                    style={{ width: `${scan.securityScore}%` }}
                                  />
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const repo = repos.find((r) => r.full_name === scan.repoName)
                                  if (repo) {
                                    handleScanRepo(repo)
                                  }
                                }}
                                disabled={scanning !== null}
                              >
                                Rescan
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* Subscription Tab */}
        {activeTab === "subscription" && (
          <div className="space-y-6">
            {/* Current Plan Card */}
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className={userSubscription === "pro" ? "h-5 w-5 text-purple-500" : userSubscription === "starter" ? "h-5 w-5 text-blue-500" : "h-5 w-5 text-muted-foreground"} />
                  Current Plan
                </CardTitle>
                <CardDescription>Manage your SecureSiteScan subscription</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-2xl font-bold">{subscriptionLimits.name}</h3>
                      <Badge className={
                        userSubscription === "pro"
                          ? "bg-gradient-to-r from-purple-500 to-pink-500"
                          : userSubscription === "starter"
                          ? "bg-blue-500"
                          : "bg-muted"
                      }>
                        ${subscriptionLimits.price}/month
                      </Badge>
                    </div>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        {subscriptionLimits.dailyScans} scans per day
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        {subscriptionLimits.visibleFindings === Infinity
                          ? "View all findings"
                          : `View ${subscriptionLimits.visibleFindings} finding${subscriptionLimits.visibleFindings > 1 ? "s" : ""} per scan`}
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        40+ security checks
                      </li>
                      {userSubscription !== "free" && userSubscription !== "anonymous" && (
                        <>
                          <li className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-500" />
                            Detailed fix suggestions
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-500" />
                            Export reports
                          </li>
                        </>
                      )}
                      {userSubscription === "pro" && (
                        <>
                          <li className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-500" />
                            API access
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-500" />
                            Priority support
                          </li>
                        </>
                      )}
                    </ul>
                  </div>
                  {(userSubscription === "free" || userSubscription === "anonymous") && (
                    <Button asChild className="bg-green-600 hover:bg-green-700">
                      <Link href="/pricing">
                        <Zap className="h-4 w-4 mr-2" />
                        Upgrade Plan
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Upgrade Options */}
            {(userSubscription === "free" || userSubscription === "anonymous" || userSubscription === "starter") && (
              <div className="grid md:grid-cols-2 gap-4">
                {userSubscription !== "starter" && (
                  <Card className="bg-card/50 backdrop-blur border-blue-500/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Zap className="h-5 w-5 text-blue-500" />
                        Starter Plan
                      </CardTitle>
                      <CardDescription>For indie hackers and solo developers</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4">
                        <span className="text-3xl font-bold">$2.99</span>
                        <span className="text-muted-foreground">/month</span>
                      </div>
                      <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          10 scans per day
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          View ALL findings
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          Export reports (JSON)
                        </li>
                      </ul>
                      <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
                        <Link href="/checkout?plan=starter">Upgrade to Starter</Link>
                      </Button>
                    </CardContent>
                  </Card>
                )}

                <Card className="bg-card/50 backdrop-blur border-purple-500/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Crown className="h-5 w-5 text-purple-500" />
                      Pro Plan
                    </CardTitle>
                    <CardDescription>For teams and agencies shipping daily</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <span className="text-3xl font-bold">$9.99</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                    <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        50 scans per day
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        API access & CI/CD
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        Priority support
                      </li>
                    </ul>
                    <Button asChild className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                      <Link href="/checkout?plan=pro">Upgrade to Pro</Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Usage Stats */}
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Usage This Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Scans Used Today</p>
                    <div className="flex items-end gap-2">
                      <span className="text-2xl font-bold">
                        {scanHistory.filter(s => {
                          const scanDate = new Date(s.scannedAt)
                          const today = new Date()
                          return scanDate.toDateString() === today.toDateString()
                        }).length}
                      </span>
                      <span className="text-muted-foreground">/ {subscriptionLimits.dailyScans}</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full mt-2">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{
                          width: `${Math.min(
                            (scanHistory.filter(s => {
                              const scanDate = new Date(s.scannedAt)
                              const today = new Date()
                              return scanDate.toDateString() === today.toDateString()
                            }).length / subscriptionLimits.dailyScans) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Scans</p>
                    <span className="text-2xl font-bold">{scanHistory.length}</span>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Repositories Scanned</p>
                    <span className="text-2xl font-bold">
                      {new Set(scanHistory.map(s => s.repoName)).size}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
