import React from "react";

export const Skeleton = ({ className = "" }) => (
  <div
    className={`animate-pulse bg-slate-200 dark:bg-slate-800 rounded-lg ${className}`}
  />
);

export const SkeletonText = ({ lines = 1 }) => (
  <div className="space-y-2">
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton key={i} className="h-4 w-full" />
    ))}
  </div>
);

export const SkeletonTableRow = ({ columns = 6 }) => (
  <tr className="border-t border-slate-200 dark:border-slate-800">
    {Array.from({ length: columns }).map((_, i) => (
      <td key={i} className="py-3">
        <Skeleton className="h-4 w-24" />
      </td>
    ))}
  </tr>
);

export const SkeletonCard = () => (
  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
    <Skeleton className="h-6 w-32" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-3/4" />
  </div>
);
