import React from 'react';
import { SearchX, Radio, Inbox, AlertTriangle } from 'lucide-react';

export default function EmptyState({
  icon: Icon = Inbox,
  title = 'No items found',
  description = 'There are no items matching your criteria.',
  actionLabel,
  onAction,
  variant = 'default'
}) {
  return (
    <div
      role="status"
      className="py-12 px-4 text-center flex flex-col items-center justify-center rounded-2xl border border-slate-800/80 bg-slate-950/40"
    >
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 shadow-md border ${
        variant === 'warning'
          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
          : variant === 'error'
          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
          : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
      }`}>
        <Icon className="w-6 h-6" aria-hidden="true" />
      </div>

      <h3 className="text-sm sm:text-base font-extrabold text-white tracking-tight">{title}</h3>
      <p className="mt-1 text-xs text-slate-400 max-w-sm leading-relaxed">{description}</p>

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 btn btn-primary text-xs py-2 px-4 font-extrabold shadow-md"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
