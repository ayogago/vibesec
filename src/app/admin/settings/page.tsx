"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Settings,
  Loader2,
  AlertTriangle,
  Database,
  CheckCircle,
  XCircle,
  RefreshCw,
  Trash2,
  Save,
  Shield,
  Users,
  Mail,
  Globe,
  Zap,
  Lock,
} from "lucide-react"

interface AppSettings {
  siteName: string
  siteDescription: string
  contactEmail: string
  supportEmail: string
  maintenanceMode: boolean
  registrationEnabled: boolean
  scanLimits: {
    anonymous: number
    free: number
    starter: number
    pro: number
  }
  pricing: {
    starter: number
    pro: number
  }
  features: {
    githubIntegration: boolean
    apiAccess: boolean
    emailNotifications: boolean
  }
}

interface DatabaseStatus {
  connected: boolean
  tables: {
    users: number
    scans: number
  }
}

interface SettingsData {
  settings: AppSettings
  database: DatabaseStatus
  environment: string
  version: string
}

export default function AdminSettingsPage() {
  const [data, setData] = useState<SettingsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [settings, setSettings] = useState<AppSettings | null>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/admin/settings")
      if (!res.ok) throw new Error("Failed to fetch settings")
      const data = await res.json()
      setData(data)
      setSettings(data.settings)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load settings")
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })

      if (!res.ok) throw new Error("Failed to save settings")

      setSuccess("Settings saved successfully")
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  const resetSettings = async () => {
    if (!confirm("Are you sure you want to reset all settings to defaults?")) return

    try {
      setSaving(true)
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
      })

      if (!res.ok) throw new Error("Failed to reset settings")

      const data = await res.json()
      setSettings(data.settings)
      setSuccess("Settings reset to defaults")
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset settings")
    } finally {
      setSaving(false)
    }
  }

  const clearAllScans = async () => {
    if (
      !confirm(
        "Are you sure you want to delete ALL scan history? This action cannot be undone!"
      )
    )
      return

    try {
      setSaving(true)
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clearScans" }),
      })

      if (!res.ok) throw new Error("Failed to clear scans")

      setSuccess("All scan history cleared")
      setTimeout(() => setSuccess(null), 3000)
      fetchSettings()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to clear scans")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="text-center py-20">
        <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Error</h2>
        <p className="text-muted-foreground">{error || "Failed to load settings"}</p>
      </div>
    )
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" />
            System Settings
          </h1>
          <p className="text-muted-foreground">
            Configure platform settings and manage system options
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={resetSettings} disabled={saving}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={saveSettings} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 text-destructive">
          <XCircle className="h-5 w-5" />
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-2 text-green-500">
          <CheckCircle className="h-5 w-5" />
          {success}
        </div>
      )}

      {/* System Status */}
      <Card className="mb-6 bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            System Status
          </CardTitle>
          <CardDescription>Current system health and database status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              {data?.database.connected ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <div>
                <p className="text-sm font-medium">Database</p>
                <p className="text-xs text-muted-foreground">
                  {data?.database.connected ? "Connected" : "Disconnected"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Users in DB</p>
                <p className="text-xs text-muted-foreground">{data?.database.tables.users}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Shield className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Scans in DB</p>
                <p className="text-xs text-muted-foreground">{data?.database.tables.scans}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Zap className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm font-medium">Environment</p>
                <p className="text-xs text-muted-foreground capitalize">{data?.environment}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              General Settings
            </CardTitle>
            <CardDescription>Basic site configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Site Name</label>
              <Input
                value={settings.siteName}
                onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Site Description</label>
              <Input
                value={settings.siteDescription}
                onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Contact Email</label>
              <Input
                type="email"
                value={settings.contactEmail}
                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Support Email</label>
              <Input
                type="email"
                value={settings.supportEmail}
                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Feature Toggles */}
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Feature Toggles
            </CardTitle>
            <CardDescription>Enable or disable platform features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium">Maintenance Mode</p>
                <p className="text-xs text-muted-foreground">Disable access for non-admin users</p>
              </div>
              <Button
                variant={settings.maintenanceMode ? "destructive" : "outline"}
                size="sm"
                onClick={() =>
                  setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })
                }
              >
                {settings.maintenanceMode ? "ON" : "OFF"}
              </Button>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium">User Registration</p>
                <p className="text-xs text-muted-foreground">Allow new user signups</p>
              </div>
              <Button
                variant={settings.registrationEnabled ? "default" : "outline"}
                size="sm"
                onClick={() =>
                  setSettings({ ...settings, registrationEnabled: !settings.registrationEnabled })
                }
              >
                {settings.registrationEnabled ? "ON" : "OFF"}
              </Button>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium">API Access</p>
                <p className="text-xs text-muted-foreground">Enable API for Pro users</p>
              </div>
              <Button
                variant={settings.features.apiAccess ? "default" : "outline"}
                size="sm"
                onClick={() =>
                  setSettings({
                    ...settings,
                    features: { ...settings.features, apiAccess: !settings.features.apiAccess },
                  })
                }
              >
                {settings.features.apiAccess ? "ON" : "OFF"}
              </Button>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-xs text-muted-foreground">Send email alerts for scans</p>
              </div>
              <Button
                variant={settings.features.emailNotifications ? "default" : "outline"}
                size="sm"
                onClick={() =>
                  setSettings({
                    ...settings,
                    features: {
                      ...settings.features,
                      emailNotifications: !settings.features.emailNotifications,
                    },
                  })
                }
              >
                {settings.features.emailNotifications ? "ON" : "OFF"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Scan Limits */}
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Daily Scan Limits
            </CardTitle>
            <CardDescription>Maximum scans per day by subscription tier</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Free</label>
                <Input
                  type="number"
                  min="0"
                  value={settings.scanLimits.free}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      scanLimits: { ...settings.scanLimits, free: parseInt(e.target.value) || 0 },
                    })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Anonymous</label>
                <Input
                  type="number"
                  min="0"
                  value={settings.scanLimits.anonymous}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      scanLimits: {
                        ...settings.scanLimits,
                        anonymous: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Starter</label>
                <Input
                  type="number"
                  min="0"
                  value={settings.scanLimits.starter}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      scanLimits: { ...settings.scanLimits, starter: parseInt(e.target.value) || 0 },
                    })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Pro</label>
                <Input
                  type="number"
                  min="0"
                  value={settings.scanLimits.pro}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      scanLimits: { ...settings.scanLimits, pro: parseInt(e.target.value) || 0 },
                    })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="bg-card/50 backdrop-blur border-destructive/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>Destructive actions - use with caution</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg">
              <div>
                <p className="font-medium">Clear All Scan History</p>
                <p className="text-xs text-muted-foreground">
                  Permanently delete all scan records from the database
                </p>
              </div>
              <Button variant="destructive" size="sm" onClick={clearAllScans} disabled={saving}>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Version Info */}
      <div className="mt-6 text-center text-sm text-muted-foreground">
        <p>SecureSiteScan.com v{data?.version} • Environment: {data?.environment}</p>
      </div>
    </div>
  )
}
