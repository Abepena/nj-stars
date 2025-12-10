import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Button component with multiple variants for different use cases.
 *
 * @variant default - Primary actions (Add to Bag, Submit, Save)
 *                    Hot pink background with light text
 *
 * @variant destructive - Dangerous/irreversible actions (Delete, Remove, Cancel subscription)
 *                        Red background - use sparingly
 *
 * @variant outline - Secondary actions, less prominent than primary
 *                    (Cancel, Back, View Details alongside a primary CTA)
 *                    Bordered with transparent background
 *
 * @variant secondary - Alternative primary actions with teal color
 *                      (Secondary CTA, alternative path actions)
 *
 * @variant ghost - Subtle/tertiary actions, minimal visual weight
 *                  (Close, navigation items, toolbar actions)
 *                  No background until hover
 *
 * @variant link - Text-only links styled as buttons
 *                 (Inline text links, "Learn more", "View all")
 *                 Underline on hover
 *
 * @variant cta - High-emphasis call-to-action for hero sections
 *                (Register for Tryouts, Get Started, Join Now)
 *                Dark/charcoal bg with light text, flips to pink on hover
 *
 * @variant accent - Alert or urgent actions
 *                   (Limited time offers, urgent notifications)
 *                   Red accent color
 *
 * @size default - Standard size (h-10, px-4)
 * @size sm - Smaller buttons (h-9, px-3)
 * @size lg - Larger buttons for hero CTAs (h-11, px-8)
 * @size icon - Square icon-only buttons (h-10, w-10)
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-muted hover:text-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-muted hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        cta: "bg-foreground text-background font-bold hover:bg-primary hover:text-primary-foreground hover:scale-[1.02] transition-all duration-200 ease-in-out",
        accent: "bg-accent text-accent-foreground hover:bg-accent/90",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
