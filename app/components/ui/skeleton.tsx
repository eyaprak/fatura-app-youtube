import * as React from "react"
import { cn } from "@/lib/utils"

function Skeleton({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn("animate-pulse rounded-md bg-muted", className)}
            {...props}
        />
    )
}

// Pre-defined skeleton components for common use cases
const SkeletonText = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & {
        lines?: number
        className?: string
    }
>(({ lines = 3, className, ...props }, ref) => (
    <div ref={ref} className={cn("space-y-2", className)} {...props}>
        {Array.from({ length: lines }).map((_, index) => (
            <Skeleton
                key={index}
                className={cn(
                    "h-4",
                    index === lines - 1 ? "w-3/4" : "w-full"
                )}
            />
        ))}
    </div>
))
SkeletonText.displayName = "SkeletonText"

const SkeletonCard = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("space-y-3", className)} {...props}>
        <Skeleton className="h-40 w-full rounded-lg" />
        <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
        </div>
    </div>
))
SkeletonCard.displayName = "SkeletonCard"

const SkeletonAvatar = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & {
        size?: "sm" | "md" | "lg"
    }
>(({ size = "md", className, ...props }, ref) => {
    const sizeClasses = {
        sm: "h-8 w-8",
        md: "h-10 w-10",
        lg: "h-12 w-12"
    }

    return (
        <div
            ref={ref}
            className={cn("animate-pulse rounded-full bg-muted", sizeClasses[size], className)}
            {...props}
        />
    )
})
SkeletonAvatar.displayName = "SkeletonAvatar"

export { Skeleton, SkeletonText, SkeletonCard, SkeletonAvatar }
