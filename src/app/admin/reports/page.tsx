"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  FileBarChart,
  Loader2,
  Download,
  AlertTriangle,
  Shield,
  Users,
  TrendingUp,
  Calendar,
  BarChart3,
} from "lucide-react"

interface ReportStats {
  totalUsers: number
  totalScans: number
  avgSecurityScore: number
  criticalFindingsTotal: number
  highFindingsTotal: number
  newUsersThisMonth: number
  scansToday: number
  subscriptionCounts: {
    anonymous: number
    free: number
    starter: number
    pro: number
  }
  dailyScans: Array<{ date: string; count: number }>
}

export default function AdminReportsPage() {
  const [stats, setStats] = useState<ReportStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/admin/stats")
      if (!res.ok) throw new Error("Failed to fetch stats")
      const data = await res.json()
      setStats(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stats")
    } finally {
      setLoading(false)
    }
  }

  const exportReport = (type: "users" | "scans" | "security") => {
    // Generate CSV data
    let csvContent = ""
    const date = new Date().toISOString().split("T")[0]

    if (type === "users") {
      csvContent = "Metric,Value\n"
      csvContent += `Total Users,${stats?.totalUsers}\n`
      csvContent += `New Users This Month,${stats?.newUsersThisMonth}\n`
      csvContent += `Free Users,${stats?.subscriptionCounts.free}\n`
      csvContent += `Starter Users,${stats?.subscriptionCounts.starter}\n`
      csvContent += `Pro Users,${stats?.subscriptionCounts.pro}\n`
    } else if (type === "scans") {
      csvContent = "Metric,Value\n"
      csvContent += `Total Scans,${stats?.totalScans}\n`
      csvContent += `Scans Today,${stats?.scansToday}\n`
      csvContent += `Average Security Score,${stats?.avgSecurityScore}\n`
      csvContent += "\nDaily Scans (Last 7 Days)\n"
      csvContent += "Date,Count\n"
      stats?.dailyScans.forEach((day) => {
        csvContent += `${day.date},${day.count}\n`
      })
    } else if (type === "security") {
      csvContent = "Metric,Value\n"
      csvContent += `Average Security Score,${stats?.avgSecurityScore}\n`
      csvContent += `Critical Findings,${stats?.criticalFindingsTotal}\n`
      csvContent += `High Findings,${stats?.highFindingsTotal}\n`
    }

    // Download file
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `securesitescan-${type}-report-${date}.csv`
    a.click()
    URL.revokeObjectURL(url)
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
        <h2 className="text-xl font-bold mb-2">Error</h2>
        <p className="text-muted-foreground">{error}</p>
      </div>
    )
  }

  // Calculate week-over-week trend
  const weeklyTotal = stats?.dailyScans.reduce((sum, day) => sum + day.count, 0) || 0
  const avgDaily = (weeklyTotal / 7).toFixed(1)

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileBarChart className="h-6 w-6 text-primary" />
            Reports & Analytics
          </h1>
          <p className="text-muted-foreground">
            Generate and download platform reports
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{stats?.totalUsers}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs text-green-500">
              <TrendingUp className="h-3 w-3" />
              <span>+{stats?.newUsersThisMonth} this month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Scans</p>
                <p className="text-2xl font-bold">{stats?.totalScans}</p>
              </div>
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{stats?.scansToday} today</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Daily Scans</p>
                <p className="text-2xl font-bold">{avgDaily}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-yellow-500" />
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
              <span>{weeklyTotal} this week</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Critical Issues</p>
                <p className="text-2xl font-bold text-red-500">{stats?.criticalFindingsTotal}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs text-orange-500">
              <span>{stats?.highFindingsTotal} high severity</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Available Reports */}
      <h2 className="text-xl font-bold mb-4">Available Reports</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader>
            <div className="p-2 rounded-lg bg-blue-500/10 w-fit">
              <Users className="h-6 w-6 text-blue-500" />
            </div>
            <CardTitle className="mt-4">User Report</CardTitle>
            <CardDescription>
              User statistics, registration trends, and subscription breakdown
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground mb-4">
              <p>Includes:</p>
              <ul className="list-disc list-inside">
                <li>Total user count</li>
                <li>New registrations</li>
                <li>Subscription tiers</li>
              </ul>
            </div>
            <Button onClick={() => exportReport("users")} className="w-full gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader>
            <div className="p-2 rounded-lg bg-primary/10 w-fit">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="mt-4">Scan Report</CardTitle>
            <CardDescription>
              Scan activity, daily trends, and usage patterns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground mb-4">
              <p>Includes:</p>
              <ul className="list-disc list-inside">
                <li>Total scans</li>
                <li>Daily activity</li>
                <li>7-day history</li>
              </ul>
            </div>
            <Button onClick={() => exportReport("scans")} className="w-full gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader>
            <div className="p-2 rounded-lg bg-red-500/10 w-fit">
              <AlertTriangle className="h-6 w-6 text-red-500" />
            </div>
            <CardTitle className="mt-4">Security Report</CardTitle>
            <CardDescription>
              Security findings, severity breakdown, and risk analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground mb-4">
              <p>Includes:</p>
              <ul className="list-disc list-inside">
                <li>Average scores</li>
                <li>Critical findings</li>
                <li>High severity issues</li>
              </ul>
            </div>
            <Button onClick={() => exportReport("security")} className="w-full gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Activity Chart */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <CardTitle>Weekly Scan Activity</CardTitle>
          <CardDescription>Number of scans per day over the last 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2 h-48">
            {stats?.dailyScans.map((day) => {
              const maxCount = Math.max(...(stats?.dailyScans.map((d) => d.count) || [1]))
              const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-sm font-medium">{day.count}</span>
                  <div className="w-full bg-muted rounded-t relative" style={{ height: "150px" }}>
                    <div
                      className="absolute bottom-0 w-full bg-primary rounded-t transition-all"
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(day.date).toLocaleDateString("en-US", { weekday: "short" })}
                  </span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Key Insights */}
      <Card className="mt-6 bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <CardTitle>Key Insights</CardTitle>
          <CardDescription>Automated analysis of platform data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">User Growth</h4>
              <p className="text-sm text-muted-foreground">
                {stats && stats.newUsersThisMonth > 0
                  ? `${stats.newUsersThisMonth} new users registered this month, representing ${((stats.newUsersThisMonth / stats.totalUsers) * 100).toFixed(1)}% growth.`
                  : "No new user registrations this month yet."}
              </p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">Scan Activity</h4>
              <p className="text-sm text-muted-foreground">
                Average of {avgDaily} scans per day with {stats?.scansToday} scans performed today.
              </p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">Security Overview</h4>
              <p className="text-sm text-muted-foreground">
                {stats?.avgSecurityScore && stats.avgSecurityScore >= 70
                  ? `Platform average security score of ${stats.avgSecurityScore} indicates generally healthy repositories.`
                  : `Platform average security score of ${stats?.avgSecurityScore || 0} suggests room for improvement in scanned repositories.`}
              </p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">Subscription Mix</h4>
              <p className="text-sm text-muted-foreground">
                {stats
                  ? `${stats.subscriptionCounts.pro} Pro and ${stats.subscriptionCounts.starter} Starter subscribers out of ${stats.totalUsers} total users.`
                  : "No subscription data available."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
