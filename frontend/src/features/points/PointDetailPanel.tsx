import { useAuth } from '@clerk/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  apiGetJson,
  apiPostJson,
  apiPutJson,
} from '../../lib/api';
import type { CommentDto, PublicPoint } from '../../lib/pointTypes';

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

type CommentsResponse = { items: CommentDto[] };

type RatingMutationResult = { myRating: number; averageRating: number | null };

/**
 * Point detail (sidebar): guests see core fields + aggregate rating only (FR-012).
 * Signed-in users also see comments, can post, and set 1–5 rating (FR-010). Favorites UI comes with T064.
 */
export function PointDetailPanel({ pointId }: { pointId: string }) {
  const { isSignedIn, getToken } = useAuth();
  const queryClient = useQueryClient();
  const [commentDraft, setCommentDraft] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const pointQuery = useQuery({
    queryKey: ['public', 'point', pointId, Boolean(isSignedIn)] as const,
    queryFn: async () => {
      const token = isSignedIn ? await getToken() : null;
      return apiGetJson<PublicPoint>(`/api/public/points/${pointId}`, token);
    },
  });

  const commentsQuery = useQuery({
    queryKey: ['points', pointId, 'comments'] as const,
    queryFn: async () => {
      const token = await getToken();
      if (!token) {
        throw new Error('No token');
      }
      return apiGetJson<CommentsResponse>(`/api/points/${pointId}/comments`, token);
    },
    enabled: Boolean(isSignedIn && pointId),
  });

  const postComment = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      if (!token) {
        throw new Error('No token');
      }
      const body = commentDraft.trim();
      if (!body) {
        throw new Error('Comment is empty');
      }
      return apiPostJson<CommentDto>(`/api/points/${pointId}/comments`, token, { body });
    },
    onSuccess: async () => {
      setCommentDraft('');
      setLocalError(null);
      await queryClient.invalidateQueries({ queryKey: ['points', pointId, 'comments'] });
    },
    onError: (e: Error) => setLocalError(e.message),
  });

  const putRating = useMutation({
    mutationFn: async (value: number) => {
      const token = await getToken();
      if (!token) {
        throw new Error('No token');
      }
      return apiPutJson<RatingMutationResult>(
        `/api/points/${pointId}/rating`,
        token,
        { value },
      );
    },
    onSuccess: (data) => {
      setLocalError(null);
      queryClient.setQueryData(
        ['public', 'point', pointId, true],
        (prev: PublicPoint | undefined) =>
          prev
            ? {
                ...prev,
                myRating: data.myRating,
                averageRating: data.averageRating,
              }
            : prev,
      );
    },
    onError: (e: Error) => setLocalError(e.message),
  });

  if (pointQuery.isLoading) {
    return <p className="px-2 py-4 text-sm text-slate-500">Loading point…</p>;
  }

  if (pointQuery.isError) {
    return (
      <div className="px-2 py-4 text-sm text-red-600" role="alert">
        {pointQuery.error instanceof Error
          ? pointQuery.error.message
          : 'Could not load this point.'}
      </div>
    );
  }

  const point = pointQuery.data;

  if (!point) {
    return null;
  }

  const avgLabel =
    point.averageRating != null ? `${point.averageRating.toFixed(1)} / 5` : 'No ratings yet';

  return (
    <div className="flex flex-col gap-3 px-2 py-2 text-slate-800">
      <div>
        <h3 className="text-base font-semibold leading-snug text-slate-900">{point.title}</h3>
        <p className="mt-1 text-xs text-slate-500">Added {formatWhen(point.createdAt)}</p>
      </div>

      <div className="text-sm">
        <span className="font-medium text-slate-700">Average rating:</span>{' '}
        <span className="text-slate-900">{avgLabel}</span>
      </div>

      {point.photoUrl ? (
        <img
          src={point.photoUrl}
          alt=""
          className="max-h-48 w-full rounded-md border border-slate-200 object-cover"
        />
      ) : null}

      {point.description ? (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{point.description}</p>
      ) : (
        <p className="text-sm text-slate-400">No description.</p>
      )}

      {!isSignedIn ? (
        <p className="rounded-md border border-amber-100 bg-amber-50/80 px-3 py-2 text-xs text-amber-900">
          Sign in to read comments, add your own, and rate this point.
        </p>
      ) : (
        <>
          <div className="border-t border-slate-100 pt-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Your rating</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {[1, 2, 3, 4, 5].map((n) => {
                const active = point.myRating === n;
                return (
                  <button
                    key={n}
                    type="button"
                    disabled={putRating.isPending}
                    className={`min-h-9 min-w-9 rounded-md border text-sm font-medium transition-colors ${
                      active
                        ? 'border-amber-500 bg-amber-100 text-amber-950'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                    aria-pressed={active}
                    onClick={() => putRating.mutate(n)}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Comments</p>
            {commentsQuery.isLoading ? (
              <p className="mt-2 text-sm text-slate-500">Loading comments…</p>
            ) : commentsQuery.isError ? (
              <p className="mt-2 text-sm text-red-600" role="alert">
                {commentsQuery.error instanceof Error
                  ? commentsQuery.error.message
                  : 'Could not load comments'}
              </p>
            ) : (
              <ul className="mt-2 space-y-2">
                {(commentsQuery.data?.items ?? []).length === 0 ? (
                  <li className="text-sm text-slate-500">No comments yet.</li>
                ) : (
                  (commentsQuery.data?.items ?? []).map((c) => (
                    <li
                      key={c.id}
                      className="rounded-md border border-slate-100 bg-slate-50/80 px-2 py-2 text-sm"
                    >
                      <div className="font-medium text-slate-800">{c.displayName}</div>
                      <div className="text-xs text-slate-500">{formatWhen(c.createdAt)}</div>
                      <p className="mt-1 whitespace-pre-wrap text-slate-700">{c.body}</p>
                    </li>
                  ))
                )}
              </ul>
            )}

            <div className="mt-3 flex flex-col gap-2">
              <label htmlFor={`comment-${pointId}`} className="sr-only">
                New comment
              </label>
              <textarea
                id={`comment-${pointId}`}
                value={commentDraft}
                onChange={(e) => setCommentDraft(e.target.value)}
                rows={3}
                placeholder="Write a comment…"
                className="w-full rounded-md border border-slate-200 px-2 py-2 text-sm text-slate-900 placeholder:text-slate-400"
              />
              <button
                type="button"
                className="self-start rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                disabled={postComment.isPending || !commentDraft.trim()}
                onClick={() => postComment.mutate()}
              >
                {postComment.isPending ? 'Posting…' : 'Post comment'}
              </button>
            </div>
          </div>
        </>
      )}

      {localError ? (
        <p className="text-sm text-red-600" role="alert">
          {localError}
        </p>
      ) : null}
    </div>
  );
}
