import React from 'react';

/**
 * Skeleton pulse building blocks adhering to Tailwind CSS tokens
 */
export function Skeleton({ className = '', style = {} }) {
  return (
    <div
      className={`animate-pulse bg-slate-800/60 rounded-xl ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
}

/**
 * Best Available Players Table & Cards Loading Skeleton
 */
export function BestAvailableSkeleton({ viewMode = 'table', rows = 8 }) {
  if (viewMode === 'cards') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" aria-busy="true" aria-label="Loading players">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="glass-panel p-3.5 flex flex-col justify-between h-40">
            <div>
              <div className="flex items-center justify-between mb-3">
                <Skeleton className="h-5 w-24 rounded-full" />
                <Skeleton className="h-5 w-5 rounded" />
              </div>
              <Skeleton className="h-6 w-3/4 mb-2 rounded" />
              <Skeleton className="h-4 w-1/2 rounded" />
            </div>
            <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
              <Skeleton className="h-4 w-20 rounded" />
              <Skeleton className="h-7 w-20 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/60" aria-busy="true" aria-label="Loading rankings table">
      <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
        <Skeleton className="h-6 w-32 rounded" />
        <Skeleton className="h-6 w-48 rounded" />
      </div>
      <div className="divide-y divide-slate-800/60">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-3 flex items-center justify-between gap-4">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-6 w-12 rounded-lg" />
            <Skeleton className="h-5 w-36 sm:w-48 rounded" />
            <Skeleton className="h-5 w-14 rounded-full" />
            <Skeleton className="h-5 w-12 rounded" />
            <Skeleton className="h-7 w-20 rounded-lg ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Draft Board Matrix Loading Skeleton
 */
export function DraftBoardSkeleton({ teams = 12, rounds = 3 }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading draft board">
      <div className="flex items-center justify-between mb-2">
        <Skeleton className="h-6 w-40 rounded" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-1.5 overflow-x-auto p-2 bg-slate-950/60 rounded-2xl border border-slate-800">
        {Array.from({ length: teams * rounds }).map((_, i) => (
          <div key={i} className="h-16 bg-slate-900/80 rounded-xl p-2 flex flex-col justify-between border border-slate-800/50">
            <Skeleton className="h-3 w-8 rounded" />
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-3 w-10 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * My Roster Tracker Skeleton
 */
export function RosterTrackerSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading roster tracker">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-36 rounded" />
        <Skeleton className="h-8 w-44 rounded-xl" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 rounded-xl" />
        ))}
      </div>
      <div className="space-y-2 pt-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
