import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function NewsCardSkeleton() {
  return (
    <Card className="overflow-hidden flex flex-col h-auto md:h-[540px]">
      {/* Image skeleton */}
      <Skeleton className="w-full aspect-[4/3] md:h-[432px] md:aspect-auto" />

      {/* Content skeleton */}
      <div className="flex flex-col flex-1 p-4 space-y-2">
        <div className="flex items-start justify-between mb-1">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-6 w-20" />
        </div>

        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6 mt-2" />
      </div>
    </Card>
  )
}
