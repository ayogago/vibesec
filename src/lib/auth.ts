import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
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
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id
        token.provider = "credentials"
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = (token.userId || token.sub) as string
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
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      provider?: string
    }
  }
}
