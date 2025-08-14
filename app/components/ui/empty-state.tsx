import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "./button"

export interface EmptyStateProps {
    icon?: React.ReactNode
    title: string
    description?: string
    action?: {
        label: string
        onClick: () => void
        variant?: "default" | "outline" | "ghost"
    }
    className?: string
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
    ({ icon, title, description, action, className }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    "flex flex-col items-center justify-center text-center py-12 px-4",
                    className
                )}
            >
                {icon && (
                    <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
                        {icon}
                    </div>
                )}

                <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {title}
                </h3>

                {description && (
                    <p className="text-gray-500 mb-6 max-w-md">
                        {description}
                    </p>
                )}

                {action && (
                    <Button
                        onClick={action.onClick}
                        variant={action.variant || "default"}
                    >
                        {action.label}
                    </Button>
                )}
            </div>
        )
    }
)
EmptyState.displayName = "EmptyState"

export { EmptyState }
