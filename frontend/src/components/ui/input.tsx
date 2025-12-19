import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

/**
 * Input component with special handling for date/time types in admin dashboards.
 * Date/time inputs use muted backgrounds and visible picker icons.
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    const isDateTimeType = type === "date" || type === "time" || type === "datetime-local"

    return (
      <input
        type={type}
        style={{ backgroundColor: '#1A1614' }}
        className={cn(
          // Base styles
          "flex h-10 w-full rounded-md border border-input text-sm ring-offset-background",
          "placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          // All inputs use custom dark background
          isDateTimeType ? "pl-3 pr-2 py-2" : "px-3 py-2",
          // Date/time picker icon styling - icon only, no background box
          isDateTimeType && [
            "[&::-webkit-calendar-picker-indicator]:cursor-pointer",
            "[&::-webkit-calendar-picker-indicator]:opacity-70",
            "[&::-webkit-calendar-picker-indicator]:hover:opacity-100",
            // Dark mode: invert icon to be visible
            "dark:[&::-webkit-calendar-picker-indicator]:invert",
            // Text color fixes for webkit
            "[&::-webkit-datetime-edit]:text-foreground",
            "[&::-webkit-datetime-edit-fields-wrapper]:text-foreground",
            "[&::-webkit-datetime-edit-text]:text-muted-foreground",
          ],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
