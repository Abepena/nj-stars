import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function ProductCardSkeleton() {
  return (
    <Card className="overflow-hidden flex flex-col h-auto md:h-[540px]">
      {/* Image skeleton - 80% of card */}
      <Skeleton className="w-full aspect-[4/3] md:h-[432px] md:aspect-auto" />

      {/* Content skeleton - 20% of card */}
      <div className="flex flex-col flex-1 p-4 space-y-3">
        <div className="flex items-start justify-between">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-6 w-16" />
        </div>

        <div className="flex items-center justify-between mt-auto">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>

        <Skeleton className="h-10 w-full" />
      </div>
    </Card>
  )
}
