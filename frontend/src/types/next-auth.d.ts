import "next-auth"
import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id?: string
      role?: string
      provider?: string
    } & DefaultSession["user"]
    apiToken?: string
  }

  interface User {
    role?: string
    provider?: string
    token?: string
    djangoToken?: string
    djangoId?: number
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string
    role?: string
    provider?: string
    apiToken?: string
  }
}
