import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function CoachCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      {/* Photo skeleton - matches 3/4 aspect ratio */}
      <div className="relative aspect-[3/4] w-full">
        <Skeleton className="absolute inset-0" />
        {/* Role badge skeleton */}
        <div className="absolute left-3 top-3">
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Name */}
        <div className="space-y-1">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>

        {/* Bio */}
        <div className="space-y-1">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>

        {/* Specialties */}
        <div className="flex flex-wrap gap-1">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>

        {/* Instagram button */}
        <Skeleton className="h-9 w-full" />
      </CardContent>
    </Card>
  )
}
