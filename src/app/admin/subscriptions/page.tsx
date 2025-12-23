"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DollarSign,
  Loader2,
  Users,
  Crown,
  TrendingUp,
  AlertTriangle,
  CreditCard,
  Zap,
  Star,
} from "lucide-react"

interface SubscriptionStats {
  subscriptionCounts: {
    anonymous: number
    free: number
    starter: number
    pro: number
  }
  monthlyRevenue: number
  totalUsers: number
  conversionRate: number | string
}

interface PlanInfo {
  name: string
  price: number
  features: string[]
  color: string
  icon: React.ReactNode
}

const plans: Record<string, PlanInfo> = {
  free: {
    name: "Free",
    price: 0,
    features: ["1 scan per day", "Basic findings", "Community support"],
    color: "bg-gray-500",
    icon: <Users className="h-5 w-5" />,
  },
  starter: {
    name: "Starter",
    price: 19.99,
    features: ["10 scans per day", "All findings", "Email support", "Priority queue"],
    color: "bg-blue-500",
    icon: <Zap className="h-5 w-5" />,
  },
  pro: {
    name: "Pro",
    price: 99.0,
    features: ["50 scans per day", "All findings", "Priority support", "API access", "Custom reports"],
    color: "bg-gradient-to-r from-purple-500 to-pink-500",
    icon: <Crown className="h-5 w-5" />,
  },
}

export default function AdminSubscriptionsPage() {
  const [stats, setStats] = useState<SubscriptionStats | null>(null)
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

  const paidUsers = (stats?.subscriptionCounts.starter || 0) + (stats?.subscriptionCounts.pro || 0)
  const freeUsers = (stats?.subscriptionCounts.free || 0) + (stats?.subscriptionCounts.anonymous || 0)

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <DollarSign className="h-6 w-6 text-primary" />
          Subscriptions
        </h1>
        <p className="text-muted-foreground">
          Manage pricing plans and view subscription analytics
        </p>
      </div>

      {/* Revenue Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                <p className="text-2xl font-bold text-green-500">
                  ${stats?.monthlyRevenue.toLocaleString()}
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-500/10">
                <DollarSign className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Paid Subscribers</p>
                <p className="text-2xl font-bold">{paidUsers}</p>
              </div>
              <div className="p-3 rounded-full bg-purple-500/10">
                <CreditCard className="h-6 w-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Free Users</p>
                <p className="text-2xl font-bold">{freeUsers}</p>
              </div>
              <div className="p-3 rounded-full bg-gray-500/10">
                <Users className="h-6 w-6 text-gray-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Conversion Rate</p>
                <p className="text-2xl font-bold">{stats?.conversionRate}%</p>
              </div>
              <div className="p-3 rounded-full bg-blue-500/10">
                <TrendingUp className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Distribution */}
      <Card className="mb-6 bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <CardTitle>Subscription Distribution</CardTitle>
          <CardDescription>Breakdown of users by subscription tier</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(plans).map(([key, plan]) => {
              const count = stats?.subscriptionCounts[key as keyof typeof stats.subscriptionCounts] || 0
              const percentage = stats?.totalUsers ? ((count / stats.totalUsers) * 100).toFixed(1) : 0

              return (
                <div key={key} className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${plan.color} text-white`}>{plan.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{plan.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {count} users ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${plan.color} transition-all`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-lg font-bold w-20 text-right">
                    {plan.price > 0 ? `$${plan.price}` : "Free"}
                  </span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Pricing Plans */}
      <h2 className="text-xl font-bold mb-4">Pricing Plans</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(plans).map(([key, plan]) => (
          <Card
            key={key}
            className={`bg-card/50 backdrop-blur border-border/50 ${key === "pro" ? "ring-2 ring-purple-500" : ""}`}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg ${plan.color} text-white`}>{plan.icon}</div>
                {key === "pro" && (
                  <Badge className="bg-purple-500">
                    <Star className="h-3 w-3 mr-1" />
                    Popular
                  </Badge>
                )}
              </div>
              <CardTitle className="mt-4">{plan.name}</CardTitle>
              <div className="text-3xl font-bold">
                {plan.price > 0 ? (
                  <>
                    ${plan.price}
                    <span className="text-sm font-normal text-muted-foreground">/month</span>
                  </>
                ) : (
                  "Free"
                )}
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Current users:{" "}
                  <span className="font-medium text-foreground">
                    {stats?.subscriptionCounts[key as keyof typeof stats.subscriptionCounts] || 0}
                  </span>
                </p>
                {plan.price > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Revenue:{" "}
                    <span className="font-medium text-green-500">
                      $
                      {(
                        (stats?.subscriptionCounts[key as keyof typeof stats.subscriptionCounts] || 0) *
                        plan.price
                      ).toFixed(2)}
                    </span>
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue Projection */}
      <Card className="mt-6 bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <CardTitle>Revenue Projection</CardTitle>
          <CardDescription>Estimated revenue based on current subscribers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Monthly</p>
              <p className="text-2xl font-bold text-green-500">
                ${stats?.monthlyRevenue.toLocaleString()}
              </p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Quarterly</p>
              <p className="text-2xl font-bold text-green-500">
                ${((stats?.monthlyRevenue || 0) * 3).toLocaleString()}
              </p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Annual</p>
              <p className="text-2xl font-bold text-green-500">
                ${((stats?.monthlyRevenue || 0) * 12).toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
