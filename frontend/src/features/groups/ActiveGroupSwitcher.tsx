import { useAuth } from '@clerk/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, type ReactElement } from 'react';
import { apiGetJson, apiPatchJson } from '../../lib/api';

type PreferencesDto = { activeGroupId: string | null };

type GroupsResponse = {
  items: { id: string; name: string; createdAt: string }[];
};

export function ActiveGroupSwitcher(): ReactElement | null {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const qc = useQueryClient();

  const prefsQuery = useQuery({
    queryKey: ['me', 'preferences'] as const,
    queryFn: async () => {
      const token = await getToken();
      if (!token) {
        throw new Error('No token');
      }
      return apiGetJson<PreferencesDto>('/api/me/preferences', token);
    },
    enabled: Boolean(isLoaded && isSignedIn),
  });

  const { data: prefs } = prefsQuery;

  const { data: groupsData } = useQuery({
    queryKey: ['groups'] as const,
    queryFn: async () => {
      const token = await getToken();
      if (!token) {
        throw new Error('No token');
      }
      return apiGetJson<GroupsResponse>('/api/groups', token);
    },
    enabled: Boolean(isLoaded && isSignedIn),
  });

  const mutation = useMutation({
    mutationFn: async (activeGroupId: string | null) => {
      const token = await getToken();
      if (!token) {
        throw new Error('No token');
      }
      return apiPatchJson<PreferencesDto>('/api/me/preferences', token, { activeGroupId });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['me', 'preferences'] });
      void qc.invalidateQueries({ queryKey: ['map', 'public'] });
    },
  });

  const activeGroupId = prefs?.activeGroupId ?? null;
  const groups = useMemo(() => groupsData?.items ?? [], [groupsData?.items]);

  const activeLabel = useMemo(() => {
    if (activeGroupId === null) {
      return 'Public only';
    }
    return groups.find((g) => g.id === activeGroupId)?.name ?? 'Group';
  }, [activeGroupId, groups]);

  if (!isLoaded || !isSignedIn) {
    return null;
  }

  if (prefsQuery.isLoading) {
    return (
      <span className="text-xs text-slate-500" data-testid="active-group-switcher-loading">
        Groups…
      </span>
    );
  }

  return (
    <div
      className="flex max-w-[min(28rem,55vw)] min-w-0 flex-col gap-0.5 text-sm"
      data-testid="active-group-switcher"
    >
      <label htmlFor="active-group-select" className="sr-only">
        Active group for private map layer
      </label>
      <select
        id="active-group-select"
        className="max-w-full truncate rounded border border-slate-300 bg-white px-2 py-1 text-slate-800"
        value={activeGroupId ?? ''}
        disabled={mutation.isPending}
        aria-busy={mutation.isPending}
        onChange={(e) => {
          const v = e.target.value;
          void mutation.mutateAsync(v === '' ? null : v);
        }}
      >
        <option value="">Public only</option>
        {groups.map((g) => (
          <option key={g.id} value={g.id}>
            {g.name}
          </option>
        ))}
      </select>
      <span className="truncate text-xs text-slate-600" data-testid="active-group-label">
        Active: {activeLabel}
      </span>
    </div>
  );
}
