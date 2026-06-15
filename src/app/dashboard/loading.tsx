import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <div className="space-y-6 py-6 animate-pulse">
      {/* Page Title & Subtitle skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-1/4 rounded-lg" />
        <Skeleton className="h-4 w-2/5 rounded-lg" />
      </div>
      
      {/* 4 Cards grid skeleton */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-3xl" />
        ))}
      </div>
      
      {/* 2 columns split layout skeleton */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Skeleton className="lg:col-span-4 h-80 rounded-3xl" />
        <Skeleton className="lg:col-span-3 h-80 rounded-3xl" />
      </div>
    </div>
  )
}
