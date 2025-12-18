"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface DateTimeInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {}

/**
 * DateTimeInput - A styled datetime-local input that works well in dark and light modes
 * Uses the native browser picker icon (no duplicate icons)
 */
const DateTimeInput = React.forwardRef<HTMLInputElement, DateTimeInputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        type="datetime-local"
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background text-sm ring-offset-background",
          "placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          // Native picker indicator styling
          "[&::-webkit-calendar-picker-indicator]:cursor-pointer",
          "[&::-webkit-calendar-picker-indicator]:rounded",
          "[&::-webkit-calendar-picker-indicator]:p-0.5",
          "[&::-webkit-calendar-picker-indicator]:hover:bg-accent",
          // Dark mode: invert the icon so it's visible
          "dark:[&::-webkit-calendar-picker-indicator]:invert",
          "[&::-webkit-calendar-picker-indicator]:opacity-70",
          "[&::-webkit-calendar-picker-indicator]:hover:opacity-100",
          // Padding - balanced on both sides
          "px-3 py-2",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
DateTimeInput.displayName = "DateTimeInput"

export { DateTimeInput }
