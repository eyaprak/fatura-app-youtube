import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 transform hover:scale-105",
    {
        variants: {
            variant: {
                default: "bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-primary",
                primary: "bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500 hover:shadow-lg",
                destructive:
                    "bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive",
                danger: "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500 hover:shadow-lg",
                outline:
                    "border border-input bg-background hover:bg-accent hover:text-accent-foreground focus-visible:ring-blue-500",
                secondary:
                    "bg-secondary text-secondary-foreground hover:bg-secondary/80 focus-visible:ring-secondary",
                ghost: "hover:bg-gray-100 hover:text-gray-900 focus-visible:ring-gray-500 hover:shadow-sm",
                link: "text-primary underline-offset-4 hover:underline focus-visible:ring-primary",
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
