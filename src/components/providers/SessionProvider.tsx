"use client"

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react"
import { ReactNode, useEffect } from "react"
import { initializeAdminUser } from "@/lib/users"

interface Props {
  children: ReactNode
}

export function SessionProvider({ children }: Props) {
  // Initialize admin user on first load
  useEffect(() => {
    initializeAdminUser()
  }, [])

  return (
    <NextAuthSessionProvider>
      {children}
    </NextAuthSessionProvider>
  )
}
