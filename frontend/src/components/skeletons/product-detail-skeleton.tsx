import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"

export function ProductDetailSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumbs skeleton */}
      <div className="flex items-center gap-2 mb-4">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-32" />
      </div>

      {/* Back link skeleton */}
      <Skeleton className="h-5 w-36 mb-6" />

      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Image Gallery Skeleton */}
        <div className="space-y-4">
          {/* Main Image */}
          <Skeleton className="aspect-square rounded-lg w-full" />

          {/* Thumbnail Gallery */}
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="w-20 h-20 rounded-md flex-shrink-0" />
            ))}
          </div>
        </div>

        {/* Product Info Skeleton */}
        <div className="flex flex-col">
          {/* Category & Tags */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Skeleton className="h-6 w-20 rounded" />
            <Skeleton className="h-5 w-16 rounded" />
          </div>

          {/* Title */}
          <Skeleton className="h-10 w-3/4 mb-4" />

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-6">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-6 w-16" />
          </div>

          <Separator className="mb-6" />

          {/* Description */}
          <div className="mb-6">
            <Skeleton className="h-6 w-28 mb-2" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>

          {/* Stock Status */}
          <div className="mb-6">
            <div className="flex items-center gap-2">
              <Skeleton className="w-3 h-3 rounded-full" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>

          {/* Quantity & Add to Bag */}
          <div className="space-y-4">
            {/* Quantity Selector */}
            <div className="flex items-center gap-4">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-32 rounded-lg" />
            </div>

            {/* Add to Bag Button */}
            <Skeleton className="h-12 w-full rounded-md" />
          </div>

          <Separator className="my-6" />

          {/* Additional Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="w-5 h-5" />
              <Skeleton className="h-4 w-48" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="w-5 h-5" />
              <Skeleton className="h-4 w-40" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="w-5 h-5" />
              <Skeleton className="h-4 w-44" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
