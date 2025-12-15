import { Skeleton } from "@/components/ui/skeleton"

export function CalendarSkeleton() {
  // Generate 35 days (5 weeks) for the grid
  const days = Array.from({ length: 35 }, (_, i) => i)

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {/* Calendar Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <Skeleton className="w-9 h-9 rounded-md" />
          <Skeleton className="h-6 w-40" />
          <Skeleton className="w-9 h-9 rounded-md" />
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-border">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="p-2 text-center text-xs font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {days.map((i) => (
            <div
              key={i}
              className="min-h-[60px] md:min-h-[80px] p-1.5 border-b border-r border-border last:border-r-0 [&:nth-child(7n)]:border-r-0"
            >
              {/* Date number */}
              <Skeleton className="w-6 h-6 rounded-full mx-auto md:mx-0" />

              {/* Random event dots on some days */}
              {[3, 7, 12, 15, 19, 24, 28].includes(i) && (
                <div className="mt-1 flex gap-0.5 justify-center md:justify-start">
                  <Skeleton className="w-1.5 h-1.5 rounded-full" />
                  {i % 3 === 0 && <Skeleton className="w-1.5 h-1.5 rounded-full" />}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Optional: skeleton for selected day events list */}
      <div className="hidden">
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
    </div>
  )
}
