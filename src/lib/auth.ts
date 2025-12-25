import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"
import { findUserByEmail, createOAuthUser, updateUser } from "./db"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "read:user user:email repo",
        },
      },
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        userId: { label: "User ID", type: "text" },
        userName: { label: "User Name", type: "text" },
      },
      async authorize(credentials) {
        // Credentials are validated on the client side using our users.ts
        // This just creates the session
        if (credentials?.userId && credentials?.email) {
          return {
            id: credentials.userId as string,
            email: credentials.email as string,
            name: credentials.userName as string || credentials.email as string,
          }
        }
        return null
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Handle OAuth sign-in (Google or GitHub)
      if ((account?.provider === "google" || account?.provider === "github") && user.email) {
        try {
          // Check if user exists in database
          let dbUser = await findUserByEmail(user.email)

          if (!dbUser) {
            // Create new user for OAuth
            const result = await createOAuthUser(
              user.email,
              user.name || user.email.split("@")[0],
              user.image || undefined,
              account.provider,
              account.provider === "github" ? account.access_token : undefined
            )
            if (result.error || !result.user) {
              console.error("Failed to create OAuth user:", result.error)
              return false
            }
            dbUser = result.user
          } else {
            // Update last login and GitHub token for existing user
            const updateData: Record<string, string | null> = {
              last_login_at: new Date().toISOString(),
            }
            // Update GitHub token if signing in with GitHub
            if (account.provider === "github" && account.access_token) {
              updateData.github_access_token = account.access_token
              updateData.oauth_provider = "github"
            }
            await updateUser(dbUser.id, updateData)
          }

          // Store database user ID for session
          user.id = dbUser.id
          return true
        } catch (error) {
          console.error("OAuth sign-in error:", error)
          return false
        }
      }
      return true
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.userId = user.id
        token.provider = account?.provider || "credentials"
      }
      // Store GitHub token in JWT for API calls
      if (account?.provider === "github" && account.access_token) {
        token.githubAccessToken = account.access_token
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = (token.userId || token.sub) as string
      session.user.provider = token.provider as string
      session.user.githubConnected = !!token.githubAccessToken
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: "jwt",
  },
})

// Extend the default session types
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      provider?: string
      githubConnected?: boolean
    }
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    userId?: string
    provider?: string
    githubAccessToken?: string
  }
}
