import React from 'react';

export const Skeleton = ({ className = 'h-4 w-full' }) => (
  <div className={`skeleton ${className}`} />
);

export const SkeletonCard = () => (
  <div className="glass-card-static space-y-4">
    <Skeleton className="h-4 w-24" />
    <Skeleton className="h-8 w-32" />
    <Skeleton className="h-3 w-full" />
  </div>
);

export const SkeletonStatGrid = () => (
  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="skeleton h-32 rounded-2xl" />
    ))}
  </div>
);

export const SkeletonChart = ({ height = 'h-72' }) => (
  <div className={`glass-card-static ${height} flex items-end gap-2 p-4`}>
    {[40, 65, 45, 80, 55, 70, 50, 90, 60, 75, 45, 85].map((h, i) => (
      <div key={i} className="skeleton flex-1 rounded-t-lg" style={{ height: `${h}%` }} />
    ))}
  </div>
);

export const SkeletonTable = ({ rows = 5 }) => (
  <div className="glass-card-static space-y-3 p-0 overflow-hidden">
    <div className="border-b border-slate-200/50 p-4 dark:border-white/5">
      <Skeleton className="h-4 w-48" />
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex gap-4 border-b border-slate-100/50 px-4 py-3 last:border-0 dark:border-white/5">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 flex-1" />
        <Skeleton className="h-4 w-24" />
      </div>
    ))}
  </div>
);

export const DashboardSkeleton = () => (
  <div className="space-y-8 page-enter">
    <SkeletonStatGrid />
    <div className="grid gap-4 md:grid-cols-3">
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
    <div className="grid gap-6 lg:grid-cols-2">
      <SkeletonChart />
      <SkeletonChart />
    </div>
    <SkeletonTable rows={4} />
  </div>
);

export default Skeleton;
