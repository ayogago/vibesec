// User storage and management
// In production, this would be a database. For now, using localStorage.

import { SubscriptionTier } from "./subscription"

// Admin emails - credentials should be stored securely in database
// These emails have admin privileges when authenticated
export const ADMIN_EMAILS = [
  "info@securesitescan.com",
  "owner@securesitescan.com",
];

// Check if email is admin
export function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

export interface StoredUser {
  id: string
  email: string
  name: string
  password: string // In production, this would be hashed
  image?: string
  subscription: SubscriptionTier
  pendingPlan?: SubscriptionTier // Plan selected but not paid for
  createdAt: string
  lastLoginAt?: string
  githubId?: number
  githubAccessToken?: string
}

export interface ScanHistoryItem {
  id: string
  repoName: string
  repoUrl: string
  scannedAt: string
  securityScore: number
  totalFindings: number
  criticalCount: number
  highCount: number
  mediumCount: number
  lowCount: number
}

// Storage keys
const USERS_KEY = "securesitescan_users"
const CURRENT_USER_KEY = "securesitescan_current_user"
const SCAN_HISTORY_KEY = "securesitescan_scan_history"

// Helper to generate IDs
function generateId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Get all users from storage
export function getAllUsers(): StoredUser[] {
  if (typeof window === "undefined") return []
  const stored = localStorage.getItem(USERS_KEY)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return []
    }
  }
  return []
}

// Save all users to storage
function saveUsers(users: StoredUser[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

// Find user by email
export function findUserByEmail(email: string): StoredUser | null {
  const users = getAllUsers()
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null
}

// Find user by ID
export function findUserById(id: string): StoredUser | null {
  const users = getAllUsers()
  return users.find((u) => u.id === id) || null
}

// Create a new user
export function createUser(
  email: string,
  password: string,
  name: string,
  pendingPlan?: SubscriptionTier
): StoredUser | { error: string } {
  // Check if user already exists
  if (findUserByEmail(email)) {
    return { error: "An account with this email already exists" }
  }

  const newUser: StoredUser = {
    id: generateId(),
    email: email.toLowerCase(),
    name,
    password, // In production, hash this!
    subscription: "free", // Default to free
    pendingPlan: pendingPlan && pendingPlan !== "free" ? pendingPlan : undefined,
    createdAt: new Date().toISOString(),
  }

  const users = getAllUsers()
  users.push(newUser)
  saveUsers(users)

  return newUser
}

// Validate user credentials
export function validateCredentials(
  email: string,
  password: string
): StoredUser | null {
  const user = findUserByEmail(email)
  if (user && user.password === password) {
    // Update last login
    updateUser(user.id, { lastLoginAt: new Date().toISOString() })
    return user
  }
  return null
}

// Update user
export function updateUser(
  userId: string,
  updates: Partial<Omit<StoredUser, "id" | "email" | "createdAt">>
): StoredUser | null {
  const users = getAllUsers()
  const index = users.findIndex((u) => u.id === userId)

  if (index === -1) return null

  users[index] = { ...users[index], ...updates }
  saveUsers(users)

  return users[index]
}

// Update subscription after payment
export function activateSubscription(
  userId: string,
  tier: SubscriptionTier
): StoredUser | null {
  return updateUser(userId, {
    subscription: tier,
    pendingPlan: undefined,
  })
}

// Get current logged-in user (client-side only)
export function getCurrentUser(): StoredUser | null {
  if (typeof window === "undefined") return null
  const userId = localStorage.getItem(CURRENT_USER_KEY)
  if (userId) {
    return findUserById(userId)
  }
  return null
}

// Set current user (for credential login)
export function setCurrentUser(userId: string): void {
  if (typeof window === "undefined") return
  localStorage.setItem(CURRENT_USER_KEY, userId)
}

// Clear current user
export function clearCurrentUser(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(CURRENT_USER_KEY)
}

// Scan History Management
export function getScanHistory(userId: string): ScanHistoryItem[] {
  if (typeof window === "undefined") return []
  const key = `${SCAN_HISTORY_KEY}_${userId}`
  const stored = localStorage.getItem(key)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return []
    }
  }
  return []
}

export function addScanToHistory(
  userId: string,
  scan: Omit<ScanHistoryItem, "id">
): ScanHistoryItem {
  const history = getScanHistory(userId)
  const newScan: ScanHistoryItem = {
    ...scan,
    id: `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  }

  // Keep last 50 scans
  const updatedHistory = [newScan, ...history].slice(0, 50)

  if (typeof window !== "undefined") {
    localStorage.setItem(
      `${SCAN_HISTORY_KEY}_${userId}`,
      JSON.stringify(updatedHistory)
    )
  }

  return newScan
}

export function clearScanHistory(userId: string): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(`${SCAN_HISTORY_KEY}_${userId}`)
}

// Link GitHub account to existing user
export function linkGitHubAccount(
  userId: string,
  githubId: number,
  accessToken: string
): StoredUser | null {
  return updateUser(userId, {
    githubId,
    githubAccessToken: accessToken,
  })
}

// Find user by GitHub ID
export function findUserByGitHubId(githubId: number): StoredUser | null {
  const users = getAllUsers()
  return users.find((u) => u.githubId === githubId) || null
}

// Note: Admin users should be created through the database with properly hashed passwords
// This function is deprecated and should not be used in production
export function initializeAdminUser(): void {
  // Admin users should be managed through the database, not localStorage
  // This is intentionally a no-op for security reasons
}
