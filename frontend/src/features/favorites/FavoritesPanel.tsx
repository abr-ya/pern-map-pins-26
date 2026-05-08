import { useAuth } from '@clerk/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { apiDelete, apiGetJson, apiPatchJson, apiPostJson } from '../../lib/api';

type FavoriteDto = {
  pointId: string;
  favoriteFolderId: string | null;
};

type FavoriteFolderDto = {
  id: string;
  name: string;
  parentId: string | null;
};

type FavoritesResponse = { items: FavoriteDto[] };
type FavoriteFoldersResponse = { items: FavoriteFolderDto[] };

type FavoritesPanelProps = {
  pointId?: string;
};

export function FavoritesPanel({ pointId }: FavoritesPanelProps) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const [newFolderName, setNewFolderName] = useState('');
  const [errorText, setErrorText] = useState<string | null>(null);

  const favoritesQuery = useQuery({
    queryKey: ['favorites'] as const,
    queryFn: async () => {
      const token = await getToken();
      if (!token) {
        throw new Error('No token');
      }
      return apiGetJson<FavoritesResponse>('/api/favorites', token);
    },
  });

  const foldersQuery = useQuery({
    queryKey: ['favorite-folders'] as const,
    queryFn: async () => {
      const token = await getToken();
      if (!token) {
        throw new Error('No token');
      }
      return apiGetJson<FavoriteFoldersResponse>('/api/favorite-folders', token);
    },
  });

  const folderMap = useMemo(
    () => new Map((foldersQuery.data?.items ?? []).map((f) => [f.id, f.name])),
    [foldersQuery.data?.items],
  );

  const activeFavorite = useMemo(
    () => (pointId ? (favoritesQuery.data?.items ?? []).find((f) => f.pointId === pointId) : null),
    [favoritesQuery.data?.items, pointId],
  );

  const addFavorite = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      if (!token || !pointId) {
        throw new Error('No token or point id');
      }
      return apiPostJson<FavoriteDto>('/api/favorites', token, {
        pointId,
        favoriteFolderId: activeFavorite?.favoriteFolderId ?? null,
      });
    },
    onSuccess: async () => {
      setErrorText(null);
      await queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
    onError: (e: Error) => setErrorText(e.message),
  });

  const removeFavorite = useMutation({
    mutationFn: async (targetPointId: string) => {
      const token = await getToken();
      if (!token) {
        throw new Error('No token');
      }
      await apiDelete(`/api/favorites/${targetPointId}`, token);
    },
    onSuccess: async () => {
      setErrorText(null);
      await queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
    onError: (e: Error) => setErrorText(e.message),
  });

  const moveFavorite = useMutation({
    mutationFn: async (params: { targetPointId: string; favoriteFolderId: string | null }) => {
      const token = await getToken();
      if (!token) {
        throw new Error('No token');
      }
      return apiPatchJson<FavoriteDto>(`/api/favorites/${params.targetPointId}`, token, {
        favoriteFolderId: params.favoriteFolderId,
      });
    },
    onSuccess: async () => {
      setErrorText(null);
      await queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
    onError: (e: Error) => setErrorText(e.message),
  });

  const createFolder = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      const name = newFolderName.trim();
      if (!token) {
        throw new Error('No token');
      }
      if (!name) {
        throw new Error('Folder name is required');
      }
      return apiPostJson<FavoriteFolderDto>('/api/favorite-folders', token, { name });
    },
    onSuccess: async () => {
      setErrorText(null);
      setNewFolderName('');
      await queryClient.invalidateQueries({ queryKey: ['favorite-folders'] });
    },
    onError: (e: Error) => setErrorText(e.message),
  });

  const isLoading = favoritesQuery.isLoading || foldersQuery.isLoading;
  const isError = favoritesQuery.isError || foldersQuery.isError;

  return (
    <section className="border-t border-slate-100 pt-3">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Favorites</p>

      {isLoading ? <p className="mt-2 text-sm text-slate-500">Loading favorites…</p> : null}

      {isError ? (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {favoritesQuery.error instanceof Error
            ? favoritesQuery.error.message
            : foldersQuery.error instanceof Error
              ? foldersQuery.error.message
              : 'Could not load favorites'}
        </p>
      ) : null}

      {!isLoading && !isError ? (
        <>
          {pointId ? (
            <div className="mt-2 flex items-center gap-2">
              {activeFavorite ? (
                <>
                  <button
                    type="button"
                    className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    disabled={removeFavorite.isPending}
                    onClick={() => removeFavorite.mutate(pointId)}
                  >
                    {removeFavorite.isPending ? 'Removing…' : 'Remove from favorites'}
                  </button>
                  <select
                    className="rounded-md border border-slate-200 bg-white px-2 py-2 text-sm text-slate-800"
                    value={activeFavorite.favoriteFolderId ?? ''}
                    onChange={(e) =>
                      moveFavorite.mutate({
                        targetPointId: pointId,
                        favoriteFolderId: e.target.value ? e.target.value : null,
                      })
                    }
                    disabled={moveFavorite.isPending}
                    aria-label="Move current point to favorite folder"
                  >
                    <option value="">No folder</option>
                    {(foldersQuery.data?.items ?? []).map((folder) => (
                      <option key={folder.id} value={folder.id}>
                        {folder.name}
                      </option>
                    ))}
                  </select>
                </>
              ) : (
                <button
                  type="button"
                  className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  disabled={addFavorite.isPending}
                  onClick={() => addFavorite.mutate()}
                >
                  {addFavorite.isPending ? 'Saving…' : 'Add to favorites'}
                </button>
              )}
            </div>
          ) : null}

          <ul className="mt-3 space-y-2">
            {(favoritesQuery.data?.items ?? []).length === 0 ? (
              <li className="text-sm text-slate-500">No favorites yet.</li>
            ) : (
              (favoritesQuery.data?.items ?? []).map((fav) => (
                <li
                  key={fav.pointId}
                  className="rounded-md border border-slate-100 bg-slate-50/80 px-2 py-2 text-sm"
                >
                  <div className="font-mono text-xs text-slate-600">{fav.pointId}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    Folder:{' '}
                    {fav.favoriteFolderId ? (folderMap.get(fav.favoriteFolderId) ?? 'Unknown folder') : 'No folder'}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <select
                      className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-800"
                      value={fav.favoriteFolderId ?? ''}
                      onChange={(e) =>
                        moveFavorite.mutate({
                          targetPointId: fav.pointId,
                          favoriteFolderId: e.target.value ? e.target.value : null,
                        })
                      }
                      disabled={moveFavorite.isPending}
                      aria-label={`Move favorite ${fav.pointId}`}
                    >
                      <option value="">No folder</option>
                      {(foldersQuery.data?.items ?? []).map((folder) => (
                        <option key={folder.id} value={folder.id}>
                          {folder.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                      disabled={removeFavorite.isPending}
                      onClick={() => removeFavorite.mutate(fav.pointId)}
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))
            )}
          </ul>

          <div className="mt-3 flex items-center gap-2">
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="New favorite folder"
              className="w-full rounded-md border border-slate-200 px-2 py-2 text-sm text-slate-900 placeholder:text-slate-400"
            />
            <button
              type="button"
              className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
              disabled={createFolder.isPending || !newFolderName.trim()}
              onClick={() => createFolder.mutate()}
            >
              {createFolder.isPending ? 'Creating…' : 'Create folder'}
            </button>
          </div>
        </>
      ) : null}

      {errorText ? (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {errorText}
        </p>
      ) : null}
    </section>
  );
}
