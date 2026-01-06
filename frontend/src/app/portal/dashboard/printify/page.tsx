"use client"

import { Package } from "lucide-react"
import { BackToDashboard } from "@/components/back-to-dashboard"
import { PrintifyAdminSection } from "@/components/admin/printify-section"

export default function PrintifyPage() {
  return (
    <div className="space-y-6 pt-4 min-h-[calc(100vh-4rem)]">
      <BackToDashboard />

      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
          <Package className="h-6 w-6 text-muted-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Manage Products</h1>
          <p className="text-sm text-muted-foreground">
            Printify sync, activate, and merch controls
          </p>
        </div>
      </div>

      <PrintifyAdminSection defaultOpen />
    </div>
  )
}
