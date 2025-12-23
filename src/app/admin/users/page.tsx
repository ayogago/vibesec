"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Shield,
  Loader2,
  Search,
  Users,
  Crown,
  Ban,
  CheckCircle,
  Mail,
  Calendar,
  Clock,
  Trash2,
  Edit,
  UserPlus,
  X,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

interface UserData {
  id: string
  email: string
  name: string
  subscription: "anonymous" | "free" | "starter" | "pro"
  totalScans: number
  lastScan: string | null
  created_at: string
  status?: "active" | "suspended"
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [subscriptionFilter, setSubscriptionFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    subscription: "free" as UserData["subscription"],
  })

  useEffect(() => {
    fetchUsers()
  }, [page, subscriptionFilter])

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
      fetchUsers()
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        search: searchQuery,
        subscription: subscriptionFilter,
      })

      const res = await fetch(`/api/admin/users?${params}`)
      if (!res.ok) throw new Error("Failed to fetch users")

      const data = await res.json()
      setUsers(data.users || [])
      setTotalPages(data.totalPages || 1)
      setTotal(data.total || 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateSubscription = async (userId: string, newTier: UserData["subscription"]) => {
    try {
      setActionLoading(userId)
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: newTier }),
      })

      if (!res.ok) throw new Error("Failed to update user")

      setUsers(users.map((u) => (u.id === userId ? { ...u, subscription: newTier } : u)))
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update user")
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      return
    }

    try {
      setActionLoading(userId)
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to delete user")
      }

      setUsers(users.filter((u) => u.id !== userId))
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete user")
    } finally {
      setActionLoading(null)
    }
  }

  const handleAddUser = async () => {
    try {
      setActionLoading("add")
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to create user")
      }

      setShowAddModal(false)
      setFormData({ email: "", password: "", name: "", subscription: "free" })
      fetchUsers()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create user")
    } finally {
      setActionLoading(null)
    }
  }

  const handleEditUser = async () => {
    if (!selectedUser) return

    try {
      setActionLoading("edit")
      const updateData: Record<string, unknown> = {
        name: formData.name,
        subscription: formData.subscription,
      }
      if (formData.password) {
        updateData.password = formData.password
      }

      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to update user")
      }

      setShowEditModal(false)
      setSelectedUser(null)
      setFormData({ email: "", password: "", name: "", subscription: "free" })
      fetchUsers()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update user")
    } finally {
      setActionLoading(null)
    }
  }

  const openEditModal = (user: UserData) => {
    setSelectedUser(user)
    setFormData({
      email: user.email,
      password: "",
      name: user.name,
      subscription: user.subscription,
    })
    setShowEditModal(true)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never"
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
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

  const Modal = ({
    title,
    children,
    onClose,
  }: {
    title: string
    children: React.ReactNode
    onClose: () => void
  }) => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{title}</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  )

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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            User Management
          </h1>
          <p className="text-muted-foreground">
            Manage users, subscriptions, and permissions
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6 bg-card/50 backdrop-blur border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background/50"
              />
            </div>
            <div className="flex gap-2">
              {["all", "free", "starter", "pro"].map((tier) => (
                <Button
                  key={tier}
                  variant={subscriptionFilter === tier ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSubscriptionFilter(tier)
                    setPage(1)
                  }}
                  className="capitalize"
                >
                  {tier}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : users.length === 0 ? (
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No users found</h3>
            <p className="text-muted-foreground">
              {searchQuery ? "Try a different search term" : "No users have registered yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="text-sm text-muted-foreground mb-4">
            Showing {users.length} of {total} users
          </div>
          <div className="space-y-3">
            {users.map((user) => (
              <Card key={user.id} className="bg-card/50 backdrop-blur border-border/50">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-lg font-medium">
                          {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold truncate">{user.name || "Unknown"}</h3>
                          {getSubscriptionBadge(user.subscription)}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3 shrink-0" />
                          <span className="truncate">{user.email}</span>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <Shield className="h-3 w-3" />
                            {user.totalScans} scans
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Joined {formatDate(user.created_at)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Last scan: {formatDate(user.lastScan)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <select
                        value={user.subscription}
                        onChange={(e) =>
                          handleUpdateSubscription(user.id, e.target.value as UserData["subscription"])
                        }
                        disabled={actionLoading === user.id}
                        className="bg-background border border-border rounded px-2 py-1 text-sm"
                      >
                        <option value="free">Free</option>
                        <option value="starter">Starter</option>
                        <option value="pro">Pro</option>
                      </select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal(user)}
                        disabled={actionLoading === user.id}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id)}
                        disabled={actionLoading === user.id}
                      >
                        {actionLoading === user.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
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

      {/* Add User Modal */}
      {showAddModal && (
        <Modal title="Add New User" onClose={() => setShowAddModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="User name"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="user@example.com"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Password</label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Password"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Subscription</label>
              <select
                value={formData.subscription}
                onChange={(e) =>
                  setFormData({ ...formData, subscription: e.target.value as UserData["subscription"] })
                }
                className="w-full bg-background border border-border rounded px-3 py-2"
              >
                <option value="free">Free</option>
                <option value="starter">Starter</option>
                <option value="pro">Pro</option>
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddUser} disabled={actionLoading === "add"}>
                {actionLoading === "add" ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <UserPlus className="h-4 w-4 mr-2" />
                )}
                Add User
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <Modal title="Edit User" onClose={() => setShowEditModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input value={formData.email} disabled className="bg-muted" />
            </div>
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="User name"
              />
            </div>
            <div>
              <label className="text-sm font-medium">New Password (leave blank to keep current)</label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="New password"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Subscription</label>
              <select
                value={formData.subscription}
                onChange={(e) =>
                  setFormData({ ...formData, subscription: e.target.value as UserData["subscription"] })
                }
                className="w-full bg-background border border-border rounded px-3 py-2"
              >
                <option value="free">Free</option>
                <option value="starter">Starter</option>
                <option value="pro">Pro</option>
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditUser} disabled={actionLoading === "edit"}>
                {actionLoading === "edit" ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Save Changes
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
