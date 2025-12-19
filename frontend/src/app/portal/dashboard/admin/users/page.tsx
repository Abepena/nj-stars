"use client"

import { Users } from "lucide-react"
import { BackToDashboard } from "@/components/back-to-dashboard"
import { ManageUsersSection } from "@/components/dashboard/manage-users-section"

export default function AdminUsersPage() {
  return (
    <div className="space-y-6 pt-4">
      <BackToDashboard />

      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
          <Users className="h-6 w-6 text-muted-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Manage Users</h1>
          <p className="text-sm text-muted-foreground">
            Players, guardians, and roster visibility
          </p>
        </div>
      </div>

      <ManageUsersSection />
    </div>
  )
}
