import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-navy-900 text-gold-50 hover:bg-navy-800 shadow-lg hover:shadow-xl transition-all duration-300",
        destructive:
          "bg-red-500 text-red-50 hover:bg-red-500/90",
        outline:
          "border border-navy-200 bg-background hover:bg-navy-50 hover:text-navy-900",
        secondary:
          "bg-gold-100 text-navy-900 hover:bg-gold-200",
        ghost: "hover:bg-navy-50 hover:text-navy-900",
        link: "text-navy-700 underline-offset-4 hover:underline",
        premium: "bg-gradient-to-r from-navy-900 to-navy-800 text-gold-100 hover:from-navy-800 hover:to-navy-700 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        xl: "h-14 rounded-lg px-12 text-lg",
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