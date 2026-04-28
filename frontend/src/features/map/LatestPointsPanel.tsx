import type { ReactNode } from 'react';
import type { PublicPoint } from '../../lib/pointTypes';

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

type LatestPointsPanelProps = {
  items: PublicPoint[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  className?: string;
  /** e.g. folder filter when signed in */
  topSlot?: ReactNode;
};

/**
 * Lists the latest up to five public points, or loading / error / empty state.
 */
export function LatestPointsPanel({
  items,
  isLoading,
  isError,
  error,
  className = '',
  topSlot,
}: LatestPointsPanelProps) {
  return (
    <aside
      className={`flex flex-col border-slate-200 bg-white md:max-w-sm ${className}`}
      aria-label="Latest public points"
    >
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-semibold tracking-tight text-slate-800">Latest public</h2>
        <p className="text-xs text-slate-500">Up to five newest world-visible points</p>
        {topSlot ? <div className="mt-3 border-t border-slate-100 pt-3">{topSlot}</div> : null}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {isLoading && <p className="px-2 py-3 text-sm text-slate-500">Loading…</p>}
        {isError && (
          <p className="px-2 py-3 text-sm text-red-600" role="alert">
            {error?.message ?? 'Could not load points'}
          </p>
        )}
        {!isLoading && !isError && items.length === 0 && (
          <p className="px-2 py-6 text-center text-sm text-slate-500">No public points yet.</p>
        )}
        <ul className="space-y-1">
          {items.map((p) => (
            <li
              key={p.id}
              className="rounded-md border border-slate-100 bg-slate-50/80 px-3 py-2 text-left"
            >
              <div className="font-medium text-slate-900">{p.title}</div>
              <div className="text-xs text-slate-500">{formatWhen(p.createdAt)}</div>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
