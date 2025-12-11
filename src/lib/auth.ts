import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"
import Credentials from "next-auth/providers/credentials"
import { validateCredentials, isDatabaseConfigured, upsertGitHubUser } from "@/lib/db/users"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
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
        // These are passed when using localStorage fallback
        userId: { label: "User ID", type: "text" },
        userName: { label: "User Name", type: "text" },
        useDatabase: { label: "Use Database", type: "text" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string
        const password = credentials?.password as string
        const useDatabase = credentials?.useDatabase === "true"

        // If database is configured and we should use it, validate against database
        if (useDatabase && isDatabaseConfigured()) {
          const user = await validateCredentials(email, password)
          if (user) {
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              image: user.image,
            }
          }
          return null
        }

        // Fallback: credentials are pre-validated on client side (localStorage mode)
        // This just creates the session with provided data
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
    async signIn({ user, account, profile }) {
      // Handle GitHub OAuth - create/update user in database
      if (account?.provider === "github" && isDatabaseConfigured()) {
        try {
          const githubId = Number(profile?.id) || 0
          const email = (user.email || (profile as Record<string, unknown>)?.email as string) || ""
          const name = (user.name || (profile as Record<string, unknown>)?.name as string) || email
          const image = (user.image || (profile as Record<string, unknown>)?.avatar_url as string) || null

          if (githubId && email) {
            await upsertGitHubUser(
              githubId,
              email,
              name,
              image,
              account.access_token || ""
            )
          }
        } catch (error) {
          console.error("Error upserting GitHub user:", error)
          // Continue with sign in even if database update fails
        }
      }
      return true
    },
    async jwt({ token, account, profile, user }) {
      if (account) {
        token.accessToken = account.access_token
        if (account.provider === "github") {
          token.githubId = profile?.id
          token.provider = "github"
        } else {
          token.provider = "credentials"
        }
      }
      if (user) {
        token.userId = user.id
      }
      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string
      session.user.id = (token.userId || token.sub) as string
      session.user.githubId = token.githubId as number
      session.user.provider = token.provider as string
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
    accessToken?: string
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      githubId?: number
      provider?: string
    }
  }
}
