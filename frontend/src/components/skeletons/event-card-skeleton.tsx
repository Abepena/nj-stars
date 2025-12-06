import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function EventCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-7 w-3/4" />
            <Skeleton className="h-5 w-2/3" />
          </div>
          <Skeleton className="h-6 w-20" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3 md:space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />

        <div className="flex flex-wrap items-center gap-3 md:gap-4">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-24" />
        </div>

        <Skeleton className="h-4 w-48" />

        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  )
}
