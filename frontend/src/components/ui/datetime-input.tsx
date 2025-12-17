"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Calendar } from "lucide-react"

interface DateTimeInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  showIcon?: boolean
}

/**
 * DateTimeInput - A styled datetime-local input that works well in dark and light modes
 */
const DateTimeInput = React.forwardRef<HTMLInputElement, DateTimeInputProps>(
  ({ className, showIcon = true, ...props }, ref) => {
    return (
      <div className="relative">
        {showIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            <Calendar className="h-4 w-4" />
          </div>
        )}
        <input
          type="datetime-local"
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background text-sm ring-offset-background",
            "placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            // Custom styling for datetime-local picker indicator
            "[&::-webkit-calendar-picker-indicator]:cursor-pointer",
            "[&::-webkit-calendar-picker-indicator]:rounded",
            "[&::-webkit-calendar-picker-indicator]:p-1",
            "[&::-webkit-calendar-picker-indicator]:hover:bg-accent",
            // Dark mode: invert the icon so it's visible
            "dark:[&::-webkit-calendar-picker-indicator]:invert",
            // Light mode
            "[&::-webkit-calendar-picker-indicator]:opacity-60",
            "[&::-webkit-calendar-picker-indicator]:hover:opacity-100",
            // Padding
            showIcon ? "pl-10 pr-3 py-2" : "px-3 py-2",
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
    )
  }
)
DateTimeInput.displayName = "DateTimeInput"

export { DateTimeInput }
