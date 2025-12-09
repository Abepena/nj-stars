import { Skeleton } from "@/components/ui/skeleton"

export function NewsCardSkeleton() {
  return (
    <div className="flex flex-col">
      {/* Image skeleton - square aspect ratio with rounded corners */}
      <Skeleton className="w-full aspect-square rounded-lg" />

      {/* Content skeleton - matches Nike-style layout */}
      <div className="flex flex-col pt-3 space-y-1.5">
        {/* Tag label */}
        <Skeleton className="h-3 w-16" />
        {/* Title */}
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        {/* Date */}
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  )
}
