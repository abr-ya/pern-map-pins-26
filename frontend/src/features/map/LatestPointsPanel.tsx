import type { ReactNode } from 'react';
import type { PublicPoint } from '../../lib/pointTypes';
import { PointDetailPanel } from '../points/PointDetailPanel';

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
  selectedPointId?: string | null;
  onSelectPoint?: (id: string) => void;
  onCloseDetail?: () => void;
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
  selectedPointId = null,
  onSelectPoint,
  onCloseDetail,
}: LatestPointsPanelProps) {
  return (
    <aside
      className={`flex flex-col border-slate-200 bg-white md:max-w-sm ${className}`}
      aria-label="Latest public points"
    >
      <div className="border-b border-slate-200 px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold tracking-tight text-slate-800">
              {selectedPointId ? 'Point detail' : 'Latest public'}
            </h2>
            <p className="text-xs text-slate-500">
              {selectedPointId ? 'Read-only fields for guests; sign in for comments & rating' : 'Up to five newest world-visible points'}
            </p>
          </div>
          {selectedPointId && onCloseDetail ? (
            <button
              type="button"
              className="shrink-0 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
              onClick={onCloseDetail}
            >
              Back
            </button>
          ) : null}
        </div>
        {!selectedPointId && topSlot ? <div className="mt-3 border-t border-slate-100 pt-3">{topSlot}</div> : null}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {selectedPointId ? (
          <PointDetailPanel pointId={selectedPointId} />
        ) : (
          <>
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
                <li key={p.id} className="rounded-md border border-slate-100 bg-slate-50/80">
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left hover:bg-slate-100/80"
                    onClick={() => onSelectPoint?.(p.id)}
                  >
                    <div className="font-medium text-slate-900">{p.title}</div>
                    <div className="text-xs text-slate-500">{formatWhen(p.createdAt)}</div>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </aside>
  );
}
