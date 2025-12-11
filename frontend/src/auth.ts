import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Facebook from "next-auth/providers/facebook"
import Apple from "next-auth/providers/apple"
import Credentials from "next-auth/providers/credentials"

// Use INTERNAL_API_URL for server-side calls (Docker internal network)
// Falls back to NEXT_PUBLIC_API_URL for local development without Docker
const API_URL = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

/**
 * Sync social auth user with Django backend.
 * Creates or updates user in Django and returns an auth token.
 */
async function syncSocialUserWithDjango(
  provider: string,
  providerAccountId: string,
  profile: {
    email: string
    name?: string | null
    given_name?: string | null  // Google
    family_name?: string | null // Google
    first_name?: string | null  // Facebook
    last_name?: string | null   // Facebook
    image?: string | null
    email_verified?: boolean
  }
) {
  try {
    const response = await fetch(`${API_URL}/api/portal/social-auth/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider,
        provider_account_id: providerAccountId,
        email: profile.email,
        name: profile.name,
        first_name: profile.given_name || profile.first_name,
        last_name: profile.family_name || profile.last_name,
        image: profile.image,
        email_verified: profile.email_verified ?? true,
      }),
    })

    if (!response.ok) {
      console.error('Failed to sync social user with Django:', await response.text())
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('Error syncing social user with Django:', error)
    return null
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // Request additional profile fields
      authorization: {
        params: {
          scope: 'openid email profile',
        },
      },
    }),
    Facebook({
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    }),
    Apple({
      clientId: process.env.APPLE_CLIENT_ID!,
      clientSecret: process.env.APPLE_CLIENT_SECRET!,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Login to Django backend (dj-rest-auth)
          const loginResponse = await fetch(`${API_URL}/api/auth/login/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          })

          if (!loginResponse.ok) {
            console.error("Login failed:", await loginResponse.text())
            return null
          }

          const loginData = await loginResponse.json()

          // dj-rest-auth returns a token - use it to fetch user details
          const userResponse = await fetch(`${API_URL}/api/auth/user/`, {
            headers: {
              'Authorization': `Token ${loginData.key}`,
              'Content-Type': 'application/json',
            },
          })

          if (!userResponse.ok) {
            console.error("Failed to fetch user details")
            return null
          }

          const user = await userResponse.json()

          return {
            id: String(user.pk),
            email: user.email,
            name: `${user.first_name} ${user.last_name}`.trim() || user.email,
            token: loginData.key,
          }
        } catch (error) {
          console.error("Authentication error:", error)
          return null
        }
      }
    }),
  ],
  pages: {
    signIn: '/portal/login',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // For social providers, sync with Django backend
      if (account?.provider && account.provider !== 'credentials') {
        const djangoData = await syncSocialUserWithDjango(
          account.provider,
          account.providerAccountId,
          {
            email: user.email!,
            name: user.name,
            given_name: (profile as { given_name?: string })?.given_name,
            family_name: (profile as { family_name?: string })?.family_name,
            first_name: (profile as { first_name?: string })?.first_name,
            last_name: (profile as { last_name?: string })?.last_name,
            image: user.image,
            email_verified: (profile as { email_verified?: boolean })?.email_verified,
          }
        )

        if (!djangoData) {
          // If Django sync fails, still allow sign in but log the error
          console.error('Django sync failed for social user, continuing anyway')
        } else {
          // Store Django token in user object for jwt callback
          ;(user as { djangoToken?: string; djangoId?: number }).djangoToken = djangoData.token
          ;(user as { djangoToken?: string; djangoId?: number }).djangoId = djangoData.user.pk
        }
      }
      return true
    },
    async jwt({ token, user, account, profile }) {
      // Initial sign in
      if (user) {
        token.id = user.id

        // For credentials, use the Django token directly
        if ((user as { token?: string }).token) {
          token.apiToken = (user as { token?: string }).token
        }

        // For social auth, use the Django token from sync
        if ((user as { djangoToken?: string }).djangoToken) {
          token.apiToken = (user as { djangoToken?: string }).djangoToken
          token.id = String((user as { djangoId?: number }).djangoId)
        }

        // Store the profile image if available
        if (user.image) {
          token.picture = user.image
        }
      }
      return token
    },
    async session({ session, token }) {
      // Add token info to the session for client-side use
      if (session.user) {
        session.user.id = token.id as string
        ;(session as { apiToken?: string }).apiToken = token.apiToken as string

        // Include the profile picture
        if (token.picture) {
          session.user.image = token.picture as string
        }
      }
      return session
    },
  },
})
