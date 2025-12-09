import { Skeleton } from "@/components/ui/skeleton"

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col">
      {/* Image skeleton - matches Nike-style cards */}
      <Skeleton className="w-full aspect-square rounded-lg" />

      {/* Content skeleton */}
      <div className="flex flex-col pt-3 space-y-2">
        {/* Color swatches */}
        <div className="flex gap-1.5">
          <Skeleton className="w-4 h-4 rounded-full" />
          <Skeleton className="w-4 h-4 rounded-full" />
          <Skeleton className="w-4 h-4 rounded-full" />
        </div>

        {/* Tag */}
        <Skeleton className="h-4 w-16" />

        {/* Product name */}
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />

        {/* Category */}
        <Skeleton className="h-3 w-16" />

        {/* Price */}
        <Skeleton className="h-4 w-12 mt-1" />
      </div>
    </div>
  )
}
