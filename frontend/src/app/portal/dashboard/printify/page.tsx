"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

// Printify management is now part of the Admin Dashboard
export default function PrintifyRedirect() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace("/portal/dashboard")
  }, [router])
  
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <p className="text-muted-foreground">Redirecting to Admin Dashboard...</p>
    </div>
  )
}
