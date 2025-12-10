import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"
import Credentials from "next-auth/providers/credentials"

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
