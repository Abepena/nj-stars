import NextAuth, { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"

export const authOptions: NextAuthOptions = {
  providers: [
    // Google OAuth Provider for social login
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),

    // Credentials Provider for email/password login
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "user@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        // TODO: Implement authentication logic with your backend
        // This should call your FastAPI backend to verify credentials

        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Example: Call your backend API
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          })

          const user = await response.json()

          if (response.ok && user) {
            // Return user object with properties you need
            return {
              id: user.id,
              email: user.email,
              name: user.full_name,
              role: user.role,
            }
          }

          return null
        } catch (error) {
          console.error("Authentication error:", error)
          return null
        }
      }
    }),
  ],

  callbacks: {
    async jwt({ token, user, account }) {
      // Persist user role and provider info to the token
      if (user) {
        token.role = user.role
        token.id = user.id
      }

      if (account) {
        token.provider = account.provider
      }

      return token
    },

    async session({ session, token }) {
      // Add custom properties to the session
      if (session.user) {
        session.user.role = token.role
        session.user.id = token.id
        session.user.provider = token.provider
      }

      return session
    },

    async signIn({ user, account, profile }) {
      // Handle OAuth sign-in
      // You can create/update user in your database here

      if (account?.provider === "google") {
        try {
          // Call your backend to create/update user
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/oauth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: user.email,
              name: user.name,
              provider_id: account.providerAccountId,
            }),
          })
        } catch (error) {
          console.error("Error creating OAuth user:", error)
          // Continue with sign-in even if backend call fails
        }
      }

      return true
    },
  },

  pages: {
    signIn: '/portal/login',
    error: '/portal/error',
  },

  session: {
    strategy: "jwt",
  },

  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
