import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",
        // Muted category variants - consistent across the app
        // These use muted backgrounds with foreground text for readability
        skills: "border-primary/50 bg-primary/40 text-foreground",
        tryout: "border-info/50 bg-info/40 text-foreground",
        open_gym: "border-success/50 bg-success/40 text-foreground",
        game: "border-accent/50 bg-accent/40 text-foreground",
        practice: "border-warning/40 bg-warning/30 text-foreground",
        tournament: "border-secondary/50 bg-secondary/40 text-foreground",
        camp: "border-tertiary/40 bg-tertiary/30 text-foreground",
        // Status variants
        success: "border-success/50 bg-success/40 text-foreground",
        warning: "border-warning/40 bg-warning/30 text-foreground",
        info: "border-info/50 bg-info/40 text-foreground",
        // Muted variant for general use
        muted: "border-border bg-muted/50 text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
