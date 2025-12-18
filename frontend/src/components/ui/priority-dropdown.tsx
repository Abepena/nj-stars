"use client"

import * as React from "react"
import { ChevronDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export type Priority = "low" | "normal" | "high" | "urgent"

interface PriorityConfig {
  label: string
  className: string
}

const PRIORITY_CONFIG: Record<Priority, PriorityConfig> = {
  low: {
    label: "Low",
    className: "bg-muted text-muted-foreground border-muted-foreground/30 hover:border-muted-foreground/50",
  },
  normal: {
    label: "Normal",
    className: "bg-muted text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-600 hover:border-blue-400 dark:hover:border-blue-500",
  },
  high: {
    label: "High",
    className: "bg-muted text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-600 hover:border-amber-400 dark:hover:border-amber-500",
  },
  urgent: {
    label: "Urgent",
    className: "bg-muted text-red-600 dark:text-red-400 border-red-300 dark:border-red-500 hover:border-red-400 dark:hover:border-red-400",
  },
}

const PRIORITIES: Priority[] = ["low", "normal", "high", "urgent"]

interface PriorityDropdownProps {
  value: Priority
  onChange: (priority: Priority) => Promise<void> | void
  disabled?: boolean
  className?: string
}

export function PriorityDropdown({
  value,
  onChange,
  disabled = false,
  className,
}: PriorityDropdownProps) {
  const [isUpdating, setIsUpdating] = React.useState(false)
  const [isOpen, setIsOpen] = React.useState(false)

  const currentConfig = PRIORITY_CONFIG[value] || PRIORITY_CONFIG.normal

  const handleSelect = async (priority: Priority) => {
    if (priority === value || isUpdating) return

    setIsUpdating(true)
    try {
      await onChange(priority)
    } finally {
      setIsUpdating(false)
      setIsOpen(false)
    }
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger
        disabled={disabled || isUpdating}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-md border transition-colors cursor-pointer",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          currentConfig.className,
          className
        )}
      >
        <span className={cn(isUpdating && "opacity-50")}>
          {currentConfig.label}
        </span>
        <ChevronDown className={cn(
          "h-3 w-3 transition-transform",
          isOpen && "rotate-180",
          isUpdating && "animate-pulse"
        )} />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="min-w-[120px]"
        onClick={(e) => e.stopPropagation()}
      >
        {PRIORITIES.map((priority) => {
          const config = PRIORITY_CONFIG[priority]
          const isSelected = priority === value

          return (
            <DropdownMenuItem
              key={priority}
              onClick={() => handleSelect(priority)}
              className={cn(
                "flex items-center justify-between gap-2 cursor-pointer",
                isSelected && "bg-muted"
              )}
            >
              <span className={cn(
                "inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-md border",
                config.className
              )}>
                {config.label}
              </span>
              {isSelected && (
                <Check className="h-4 w-4 text-foreground" />
              )}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { PRIORITY_CONFIG, PRIORITIES }
