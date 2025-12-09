import { Skeleton } from "@/components/ui/skeleton"

export function EventCardSkeleton() {
  return (
    <div className="flex flex-col">
      {/* Image skeleton - 16:9 aspect ratio with rounded corners */}
      <Skeleton className="w-full aspect-[16/9] rounded-lg" />

      {/* Content skeleton - matches Nike-style layout */}
      <div className="flex flex-col pt-3 space-y-1.5">
        {/* Type tag */}
        <Skeleton className="h-3 w-20" />
        {/* Title */}
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-2/3" />
        {/* Date & Time */}
        <Skeleton className="h-4 w-40" />
        {/* Location */}
        <Skeleton className="h-3 w-32" />
        {/* Price & Register */}
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-8 w-20 rounded-md" />
        </div>
      </div>
    </div>
  )
}
