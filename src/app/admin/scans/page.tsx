"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Shield,
  Loader2,
  Search,
  AlertTriangle,
  Clock,
  Trash2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
} from "lucide-react"

interface ScanData {
  id: string
  user_id: string
  repo_name: string
  repo_url: string
  security_score: number
  total_findings: number
  critical_count: number
  high_count: number
  medium_count: number
  low_count: number
  scanned_at: string
  user: {
    email: string
    name: string
  }
}

export default function AdminScansPage() {
  const [scans, setScans] = useState<ScanData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [severityFilter, setSeverityFilter] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchScans()
  }, [page, severityFilter])

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
      fetchScans()
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const fetchScans = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "15",
        search: searchQuery,
        severity: severityFilter,
      })

      const res = await fetch(`/api/admin/scans?${params}`)
      if (!res.ok) throw new Error("Failed to fetch scans")

      const data = await res.json()
      setScans(data.scans || [])
      setTotalPages(data.totalPages || 1)
      setTotal(data.total || 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load scans")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteScan = async (scanId: string) => {
    if (!confirm("Are you sure you want to delete this scan record?")) {
      return
    }

    try {
      setActionLoading(scanId)
      const res = await fetch("/api/admin/scans", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scanId }),
      })

      if (!res.ok) throw new Error("Failed to delete scan")

      setScans(scans.filter((s) => s.id !== scanId))
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete scan")
    } finally {
      setActionLoading(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500"
    if (score >= 50) return "text-yellow-500"
    return "text-red-500"
  }

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-green-500/10 border-green-500/20"
    if (score >= 50) return "bg-yellow-500/10 border-yellow-500/20"
    return "bg-red-500/10 border-red-500/20"
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

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          Scan History
        </h1>
        <p className="text-muted-foreground">
          View and manage all security scans across the platform
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6 bg-card/50 backdrop-blur border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by repository name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background/50"
              />
            </div>
            <div className="flex gap-2 items-center">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Button
                variant={severityFilter === "" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSeverityFilter("")
                  setPage(1)
                }}
              >
                All
              </Button>
              <Button
                variant={severityFilter === "critical" ? "destructive" : "outline"}
                size="sm"
                onClick={() => {
                  setSeverityFilter("critical")
                  setPage(1)
                }}
              >
                Critical
              </Button>
              <Button
                variant={severityFilter === "high" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSeverityFilter("high")
                  setPage(1)
                }}
                className={severityFilter === "high" ? "bg-orange-500 hover:bg-orange-600" : ""}
              >
                High
              </Button>
              <Button
                variant={severityFilter === "clean" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSeverityFilter("clean")
                  setPage(1)
                }}
                className={severityFilter === "clean" ? "bg-green-500 hover:bg-green-600" : ""}
              >
                Clean
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scans List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : scans.length === 0 ? (
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="p-8 text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No scans found</h3>
            <p className="text-muted-foreground">
              {searchQuery || severityFilter ? "Try different filters" : "No scans have been performed yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="text-sm text-muted-foreground mb-4">
            Showing {scans.length} of {total} scans
          </div>
          <div className="space-y-3">
            {scans.map((scan) => (
              <Card key={scan.id} className="bg-card/50 backdrop-blur border-border/50">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      {/* Score Badge */}
                      <div
                        className={`w-16 h-16 rounded-lg flex flex-col items-center justify-center shrink-0 border ${getScoreBg(scan.security_score)}`}
                      >
                        <span className={`text-2xl font-bold ${getScoreColor(scan.security_score)}`}>
                          {scan.security_score}
                        </span>
                        <span className="text-xs text-muted-foreground">Score</span>
                      </div>

                      {/* Scan Details */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold truncate">{scan.repo_name}</h3>
                          {scan.critical_count > 0 && (
                            <Badge variant="destructive">{scan.critical_count} Critical</Badge>
                          )}
                          {scan.high_count > 0 && (
                            <Badge className="bg-orange-500">{scan.high_count} High</Badge>
                          )}
                          {scan.medium_count > 0 && (
                            <Badge className="bg-yellow-500">{scan.medium_count} Medium</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{scan.repo_url}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                          <span>
                            By: {scan.user?.name || scan.user?.email || "Unknown"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(scan.scanned_at)}
                          </span>
                          <span className="flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            {scan.total_findings} findings
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {scan.repo_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(scan.repo_url, "_blank")}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteScan(scan.id)}
                        disabled={actionLoading === scan.id}
                      >
                        {actionLoading === scan.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Findings Breakdown */}
                  <div className="mt-4 pt-4 border-t border-border flex gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <span>Critical: {scan.critical_count}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-orange-500" />
                      <span>High: {scan.high_count}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <span>Medium: {scan.medium_count}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <span>Low: {scan.low_count}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
