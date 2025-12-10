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
  Users,
  BarChart3,
  Activity,
  AlertTriangle,
  Crown,
  Ban,
  CheckCircle,
  Settings,
  TrendingUp,
  Calendar,
  Clock,
  Eye,
  Mail,
} from "lucide-react"

// Admin emails that have access to the admin dashboard
const ADMIN_EMAILS = ["admin@vibesec.dev", "owner@vibesec.dev"]

interface UserData {
  id: string
  email: string
  name: string
  image: string | null
  subscription: "anonymous" | "free" | "starter" | "pro"
  totalScans: number
  lastScan: string | null
  createdAt: string
  status: "active" | "suspended"
}

interface ScanData {
  id: string
  userId: string
  userEmail: string
  repoName: string
  repoUrl: string
  securityScore: number
  totalFindings: number
  criticalCount: number
  highCount: number
  scannedAt: string
}

interface Analytics {
  totalUsers: number
  activeUsers: number
  totalScans: number
  scansToday: number
  avgSecurityScore: number
  criticalFindingsTotal: number
  revenueMonthly: number
  conversionRate: number
}

// Mock data for demonstration - in production this would come from a database
const mockUsers: UserData[] = [
  {
    id: "1",
    email: "john@example.com",
    name: "John Doe",
    image: "https://avatars.githubusercontent.com/u/1?v=4",
    subscription: "pro",
    totalScans: 45,
    lastScan: "2024-01-15T10:30:00Z",
    createdAt: "2023-11-01T08:00:00Z",
    status: "active",
  },
  {
    id: "2",
    email: "jane@example.com",
    name: "Jane Smith",
    image: "https://avatars.githubusercontent.com/u/2?v=4",
    subscription: "starter",
    totalScans: 23,
    lastScan: "2024-01-14T15:45:00Z",
    createdAt: "2023-12-15T12:00:00Z",
    status: "active",
  },
  {
    id: "3",
    email: "bob@example.com",
    name: "Bob Wilson",
    image: null,
    subscription: "free",
    totalScans: 5,
    lastScan: "2024-01-10T09:00:00Z",
    createdAt: "2024-01-05T14:30:00Z",
    status: "active",
  },
  {
    id: "4",
    email: "alice@example.com",
    name: "Alice Brown",
    image: "https://avatars.githubusercontent.com/u/4?v=4",
    subscription: "free",
    totalScans: 2,
    lastScan: "2024-01-08T11:20:00Z",
    createdAt: "2024-01-07T16:00:00Z",
    status: "suspended",
  },
  {
    id: "5",
    email: "charlie@example.com",
    name: "Charlie Davis",
    image: "https://avatars.githubusercontent.com/u/5?v=4",
    subscription: "pro",
    totalScans: 78,
    lastScan: "2024-01-15T14:00:00Z",
    createdAt: "2023-10-20T10:00:00Z",
    status: "active",
  },
]

const mockScans: ScanData[] = [
  {
    id: "s1",
    userId: "1",
    userEmail: "john@example.com",
    repoName: "my-app",
    repoUrl: "https://github.com/john/my-app",
    securityScore: 72,
    totalFindings: 15,
    criticalCount: 2,
    highCount: 5,
    scannedAt: "2024-01-15T10:30:00Z",
  },
  {
    id: "s2",
    userId: "2",
    userEmail: "jane@example.com",
    repoName: "web-store",
    repoUrl: "https://github.com/jane/web-store",
    securityScore: 85,
    totalFindings: 8,
    criticalCount: 0,
    highCount: 3,
    scannedAt: "2024-01-14T15:45:00Z",
  },
  {
    id: "s3",
    userId: "5",
    userEmail: "charlie@example.com",
    repoName: "api-service",
    repoUrl: "https://github.com/charlie/api-service",
    securityScore: 45,
    totalFindings: 32,
    criticalCount: 5,
    highCount: 12,
    scannedAt: "2024-01-15T14:00:00Z",
  },
  {
    id: "s4",
    userId: "3",
    userEmail: "bob@example.com",
    repoName: "portfolio",
    repoUrl: "https://github.com/bob/portfolio",
    securityScore: 92,
    totalFindings: 3,
    criticalCount: 0,
    highCount: 1,
    scannedAt: "2024-01-10T09:00:00Z",
  },
  {
    id: "s5",
    userId: "1",
    userEmail: "john@example.com",
    repoName: "backend-api",
    repoUrl: "https://github.com/john/backend-api",
    securityScore: 58,
    totalFindings: 22,
    criticalCount: 3,
    highCount: 8,
    scannedAt: "2024-01-13T11:20:00Z",
  },
]

const mockAnalytics: Analytics = {
  totalUsers: 1247,
  activeUsers: 892,
  totalScans: 15678,
  scansToday: 342,
  avgSecurityScore: 68,
  criticalFindingsTotal: 2341,
  revenueMonthly: 12450,
  conversionRate: 8.5,
}

export default function AdminDashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "scans">("overview")
  const [searchQuery, setSearchQuery] = useState("")
  const [users, setUsers] = useState<UserData[]>(mockUsers)
  const [scans, setScans] = useState<ScanData[]>(mockScans)
  const [analytics] = useState<Analytics>(mockAnalytics)

  // Check if user is admin
  const isAdmin = session?.user?.email && ADMIN_EMAILS.includes(session.user.email)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/admin")
    }
  }, [status, router])

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredScans = scans.filter(
    (scan) =>
      scan.repoName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scan.userEmail.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never"
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getSubscriptionBadge = (subscription: UserData["subscription"]) => {
    const badges = {
      anonymous: <Badge variant="secondary">Guest</Badge>,
      free: <Badge variant="outline">Free</Badge>,
      starter: <Badge className="bg-blue-500">Starter</Badge>,
      pro: (
        <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 gap-1">
          <Crown className="h-3 w-3" />
          Pro
        </Badge>
      ),
    }
    return badges[subscription]
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500"
    if (score >= 50) return "text-yellow-500"
    return "text-red-500"
  }

  const handleToggleUserStatus = (userId: string) => {
    setUsers(
      users.map((user) =>
        user.id === userId
          ? { ...user, status: user.status === "active" ? "suspended" : "active" }
          : user
      )
    )
  }

  const handleUpgradeUser = (userId: string) => {
    setUsers(
      users.map((user) => {
        if (user.id !== userId) return user
        const tiers: UserData["subscription"][] = ["anonymous", "free", "starter", "pro"]
        const currentIndex = tiers.indexOf(user.subscription)
        const nextTier = tiers[Math.min(currentIndex + 1, tiers.length - 1)]
        return { ...user, subscription: nextTier }
      })
    )
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

  // Show access denied for non-admin users
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4">
          <Card className="w-full max-w-md bg-card/50 backdrop-blur border-border/50">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <Ban className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle className="text-2xl">Access Denied</CardTitle>
              <CardDescription>
                You don&apos;t have permission to access the admin dashboard.
                <br />
                <span className="text-xs mt-2 block text-muted-foreground">
                  Contact support if you believe this is an error.
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => router.push("/dashboard")}>
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Settings className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          </div>
          <p className="text-muted-foreground">
            Manage users, view analytics, and monitor security scans
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-6 border-b border-border pb-4">
          <Button
            variant={activeTab === "overview" ? "default" : "ghost"}
            onClick={() => setActiveTab("overview")}
            className="gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            Overview
          </Button>
          <Button
            variant={activeTab === "users" ? "default" : "ghost"}
            onClick={() => setActiveTab("users")}
            className="gap-2"
          >
            <Users className="h-4 w-4" />
            Users
          </Button>
          <Button
            variant={activeTab === "scans" ? "default" : "ghost"}
            onClick={() => setActiveTab("scans")}
            className="gap-2"
          >
            <Shield className="h-4 w-4" />
            Scans
          </Button>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card className="bg-card/50 backdrop-blur border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Users</p>
                      <p className="text-2xl font-bold">{analytics.totalUsers.toLocaleString()}</p>
                    </div>
                    <div className="p-3 rounded-full bg-blue-500/10">
                      <Users className="h-6 w-6 text-blue-500" />
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mt-2 text-xs text-green-500">
                    <TrendingUp className="h-3 w-3" />
                    <span>+12% this month</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Scans</p>
                      <p className="text-2xl font-bold">{analytics.totalScans.toLocaleString()}</p>
                    </div>
                    <div className="p-3 rounded-full bg-primary/10">
                      <Shield className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{analytics.scansToday} today</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Avg. Security Score</p>
                      <p className={`text-2xl font-bold ${getScoreColor(analytics.avgSecurityScore)}`}>
                        {analytics.avgSecurityScore}
                      </p>
                    </div>
                    <div className="p-3 rounded-full bg-yellow-500/10">
                      <Activity className="h-6 w-6 text-yellow-500" />
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mt-2 text-xs text-red-500">
                    <AlertTriangle className="h-3 w-3" />
                    <span>{analytics.criticalFindingsTotal.toLocaleString()} critical findings</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                      <p className="text-2xl font-bold">${analytics.revenueMonthly.toLocaleString()}</p>
                    </div>
                    <div className="p-3 rounded-full bg-green-500/10">
                      <TrendingUp className="h-6 w-6 text-green-500" />
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mt-2 text-xs text-green-500">
                    <TrendingUp className="h-3 w-3" />
                    <span>{analytics.conversionRate}% conversion</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-card/50 backdrop-blur border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg">Recent Users</CardTitle>
                  <CardDescription>Latest registered users</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {users.slice(0, 5).map((user) => (
                      <div key={user.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {user.image ? (
                            <img
                              src={user.image}
                              alt={user.name}
                              className="w-8 h-8 rounded-full"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-xs font-medium">
                                {user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                        {getSubscriptionBadge(user.subscription)}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg">Recent Scans</CardTitle>
                  <CardDescription>Latest security scans</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {scans.slice(0, 5).map((scan) => (
                      <div key={scan.id} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{scan.repoName}</p>
                          <p className="text-xs text-muted-foreground">{scan.userEmail}</p>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${getScoreColor(scan.securityScore)}`}>
                            {scan.securityScore}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {scan.totalFindings} findings
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <>
            <div className="mb-6">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background/50"
                />
              </div>
            </div>

            <div className="grid gap-4">
              {filteredUsers.map((user) => (
                <Card key={user.id} className="bg-card/50 backdrop-blur border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        {user.image ? (
                          <img
                            src={user.image}
                            alt={user.name}
                            className="w-12 h-12 rounded-full"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-lg font-medium">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{user.name}</h3>
                            {getSubscriptionBadge(user.subscription)}
                            {user.status === "suspended" && (
                              <Badge variant="destructive">Suspended</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {user.email}
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Shield className="h-3 w-3" />
                              {user.totalScans} scans
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Joined {formatDate(user.createdAt)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Last scan: {formatDate(user.lastScan)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpgradeUser(user.id)}
                          disabled={user.subscription === "pro"}
                        >
                          <Crown className="h-4 w-4 mr-1" />
                          Upgrade
                        </Button>
                        <Button
                          variant={user.status === "active" ? "destructive" : "default"}
                          size="sm"
                          onClick={() => handleToggleUserStatus(user.id)}
                        >
                          {user.status === "active" ? (
                            <>
                              <Ban className="h-4 w-4 mr-1" />
                              Suspend
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Activate
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* Scans Tab */}
        {activeTab === "scans" && (
          <>
            <div className="mb-6">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search scans..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background/50"
                />
              </div>
            </div>

            <div className="grid gap-4">
              {filteredScans.map((scan) => (
                <Card key={scan.id} className="bg-card/50 backdrop-blur border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{scan.repoName}</h3>
                          {scan.criticalCount > 0 && (
                            <Badge variant="destructive">{scan.criticalCount} Critical</Badge>
                          )}
                          {scan.highCount > 0 && (
                            <Badge className="bg-orange-500">{scan.highCount} High</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{scan.userEmail}</p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Shield className="h-3 w-3" />
                            {scan.totalFindings} total findings
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(scan.scannedAt)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className={`text-2xl font-bold ${getScoreColor(scan.securityScore)}`}>
                            {scan.securityScore}
                          </p>
                          <p className="text-xs text-muted-foreground">Security Score</p>
                        </div>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  )
}
