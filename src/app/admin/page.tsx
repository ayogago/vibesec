"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Shield,
  Loader2,
  Users,
  BarChart3,
  Activity,
  AlertTriangle,
  Crown,
  Clock,
  DollarSign,
  UserPlus,
  Target,
} from "lucide-react"

interface Analytics {
  totalUsers: number
  totalScans: number
  scansToday: number
  avgSecurityScore: number
  criticalFindingsTotal: number
  highFindingsTotal: number
  monthlyRevenue: number
  newUsersThisMonth: number
  subscriptionCounts: {
    anonymous: number
    free: number
    starter: number
    pro: number
  }
  dailyScans: Array<{ date: string; count: number }>
  conversionRate: number | string
}

interface RecentUser {
  id: string
  email: string
  name: string
  subscription: "anonymous" | "free" | "starter" | "pro"
  created_at: string
}

interface RecentScan {
  id: string
  repo_name: string
  security_score: number
  critical_count: number
  high_count: number
  scanned_at: string
  user: { email: string; name: string }
}

export default function AdminOverviewPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([])
  const [recentScans, setRecentScans] = useState<RecentScan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch stats, users, and scans in parallel
      const [statsRes, usersRes, scansRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/users?limit=5"),
        fetch("/api/admin/scans?limit=5"),
      ])

      if (!statsRes.ok || !usersRes.ok || !scansRes.ok) {
        throw new Error("Failed to fetch data")
      }

      const statsData = await statsRes.json()
      const usersData = await usersRes.json()
      const scansData = await scansRes.json()

      setAnalytics(statsData)
      setRecentUsers(usersData.users || [])
      setRecentScans(scansData.scans || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500"
    if (score >= 50) return "text-yellow-500"
    return "text-red-500"
  }

  const getSubscriptionBadge = (subscription: string) => {
    const badges: Record<string, React.ReactNode> = {
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
    return badges[subscription] || <Badge variant="secondary">{subscription}</Badge>
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Error Loading Dashboard</h2>
        <p className="text-muted-foreground">{error}</p>
      </div>
    )
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          Dashboard Overview
        </h1>
        <p className="text-muted-foreground">
          Real-time analytics and platform statistics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{analytics?.totalUsers.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-500/10">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs text-green-500">
              <UserPlus className="h-3 w-3" />
              <span>+{analytics?.newUsersThisMonth} this month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Scans</p>
                <p className="text-2xl font-bold">{analytics?.totalScans.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-full bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{analytics?.scansToday} today</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Security Score</p>
                <p className={`text-2xl font-bold ${getScoreColor(analytics?.avgSecurityScore || 0)}`}>
                  {analytics?.avgSecurityScore || 0}
                </p>
              </div>
              <div className="p-3 rounded-full bg-yellow-500/10">
                <Activity className="h-6 w-6 text-yellow-500" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs text-red-500">
              <AlertTriangle className="h-3 w-3" />
              <span>{analytics?.criticalFindingsTotal.toLocaleString()} critical findings</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                <p className="text-2xl font-bold">${analytics?.monthlyRevenue.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-full bg-green-500/10">
                <DollarSign className="h-6 w-6 text-green-500" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs text-green-500">
              <Target className="h-3 w-3" />
              <span>{analytics?.conversionRate}% conversion</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Subscription Distribution</CardTitle>
            <CardDescription>Users by plan type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Free</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gray-500"
                      style={{
                        width: `${analytics ? (analytics.subscriptionCounts.free / analytics.totalUsers) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium w-12 text-right">
                    {analytics?.subscriptionCounts.free || 0}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Starter</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500"
                      style={{
                        width: `${analytics ? (analytics.subscriptionCounts.starter / analytics.totalUsers) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium w-12 text-right">
                    {analytics?.subscriptionCounts.starter || 0}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Pro</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500"
                      style={{
                        width: `${analytics ? (analytics.subscriptionCounts.pro / analytics.totalUsers) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium w-12 text-right">
                    {analytics?.subscriptionCounts.pro || 0}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Scan Activity */}
        <Card className="bg-card/50 backdrop-blur border-border/50 lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Weekly Scan Activity</CardTitle>
            <CardDescription>Scans per day over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 h-32">
              {analytics?.dailyScans.map((day) => {
                const maxCount = Math.max(...(analytics?.dailyScans.map((d) => d.count) || [1]))
                const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0
                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full bg-muted rounded-t relative" style={{ height: "100px" }}>
                      <div
                        className="absolute bottom-0 w-full bg-primary rounded-t transition-all"
                        style={{ height: `${height}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(day.date).toLocaleDateString("en-US", { weekday: "short" })}
                    </span>
                    <span className="text-xs font-medium">{day.count}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Recent Users
            </CardTitle>
            <CardDescription>Latest registered users</CardDescription>
          </CardHeader>
          <CardContent>
            {recentUsers.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No users yet</p>
            ) : (
              <div className="space-y-4">
                {recentUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-medium">
                          {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{user.name || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    {getSubscriptionBadge(user.subscription)}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Recent Scans
            </CardTitle>
            <CardDescription>Latest security scans</CardDescription>
          </CardHeader>
          <CardContent>
            {recentScans.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No scans yet</p>
            ) : (
              <div className="space-y-4">
                {recentScans.map((scan) => (
                  <div key={scan.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{scan.repo_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {scan.user?.email || "Unknown"} • {formatDate(scan.scanned_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${getScoreColor(scan.security_score)}`}>
                        {scan.security_score}
                      </p>
                      {scan.critical_count > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {scan.critical_count} critical
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
