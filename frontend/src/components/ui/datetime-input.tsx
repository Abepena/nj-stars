"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface DateTimeInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {}

/**
 * DateTimeInput - A styled datetime-local input for admin dashboards
 *
 * Design notes:
 * - Uses muted background (bg-muted) for admin dashboard consistency
 * - Calendar picker icon positioned at the end and clearly visible
 * - Dark mode optimized with proper icon visibility
 */
const DateTimeInput = React.forwardRef<HTMLInputElement, DateTimeInputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        type="datetime-local"
        style={{ backgroundColor: '#1A1614' }}
        className={cn(
          // Base styling - custom dark background for admin forms
          "flex h-10 w-full rounded-md border border-input text-sm ring-offset-background",
          "text-foreground",
          "placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          // Native picker indicator styling - icon only, no background box
          "[&::-webkit-calendar-picker-indicator]:cursor-pointer",
          "[&::-webkit-calendar-picker-indicator]:opacity-70",
          "[&::-webkit-calendar-picker-indicator]:hover:opacity-100",
          // Dark mode: invert icon to be visible
          "dark:[&::-webkit-calendar-picker-indicator]:invert",
          // Fix for webkit date input text color in dark mode
          "[&::-webkit-datetime-edit]:text-foreground",
          "[&::-webkit-datetime-edit-fields-wrapper]:text-foreground",
          "[&::-webkit-datetime-edit-text]:text-muted-foreground",
          "[&::-webkit-datetime-edit-month-field]:text-foreground",
          "[&::-webkit-datetime-edit-day-field]:text-foreground",
          "[&::-webkit-datetime-edit-year-field]:text-foreground",
          "[&::-webkit-datetime-edit-hour-field]:text-foreground",
          "[&::-webkit-datetime-edit-minute-field]:text-foreground",
          "[&::-webkit-datetime-edit-ampm-field]:text-foreground",
          // Padding - more space on right for the picker icon
          "pl-3 pr-2 py-2",
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
