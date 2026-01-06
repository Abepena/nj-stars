"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface ReturnPolicyModalProps {
  trigger?: React.ReactNode
  className?: string
}

export function ReturnPolicyModal({ trigger, className }: ReturnPolicyModalProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <button className={className || "text-sm text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"}>
            Return Policy
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Return Policy</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <div>
            <p className="font-medium text-emerald-400 mb-2">✅ Covered (free reprint or refund):</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
              <li>Damaged products</li>
              <li>Manufacturing/printing errors</li>
              <li>Must contact within 30 days of delivery with photo proof</li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-rose-400 mb-2">❌ NOT Covered:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
              <li>Wrong size ordered by customer</li>
              <li>Wrong color ordered</li>
              <li>Customer changed their mind</li>
            </ul>
          </div>
          <p className="text-xs text-muted-foreground pt-2 border-t">
            Since items are custom-printed on demand, we can only accept returns for defective or damaged products. Please double-check your size and color selections before ordering.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
