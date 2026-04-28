import { useAuth } from '@clerk/react';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { MapContainer, useMapEvents } from 'react-leaflet';
import { apiGet, apiGetJson } from '../../lib/api';
import type { FolderDto, PublicPoint, TagDto } from '../../lib/pointTypes';
import { FolderList } from '../folders/FolderList';
import { CreatePointForm } from '../points/CreatePointForm';
import { ClusteredMarkers } from './ClusteredMarkers';
import { GuestMapLayer } from './GuestMapLayer';
import { LatestPointsPanel } from './LatestPointsPanel';
import { makeMyPinIcon } from './mapPins';

function MapClickToCreate({
  enabled,
  onPick,
}: {
  enabled: boolean;
  onPick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      if (!enabled) {
        return;
      }
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

type LatestResponse = { items: PublicPoint[] };
type FoldersResponse = { items: FolderDto[] };
type TagsResponse = { items: TagDto[] };

export function MapPage() {
  const { isSignedIn, getToken } = useAuth();
  const [folderId, setFolderId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState<{ lat: number; lng: number } | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['public', 'latest'] as const,
    queryFn: () => apiGet<LatestResponse>('/api/public/latest'),
  });

  const items = useMemo(() => data?.items ?? [], [data?.items]);

  const { data: foldersData } = useQuery({
    queryKey: ['folders'] as const,
    queryFn: async () => {
      const token = await getToken();
      if (!token) {
        throw new Error('No token');
      }
      return apiGetJson<FoldersResponse>('/api/folders', token);
    },
    enabled: Boolean(isSignedIn),
  });

  const { data: tagsData } = useQuery({
    queryKey: ['tags'] as const,
    queryFn: async () => {
      const token = await getToken();
      if (!token) {
        throw new Error('No token');
      }
      return apiGetJson<TagsResponse>('/api/tags', token);
    },
    enabled: Boolean(isSignedIn),
  });

  const { data: myPointsData } = useQuery({
    queryKey: ['points', 'mine', folderId] as const,
    queryFn: async () => {
      const token = await getToken();
      if (!token) {
        throw new Error('No token');
      }
      const q = folderId ? `?folderId=${encodeURIComponent(folderId)}` : '';
      return apiGetJson<{ items: PublicPoint[] }>(`/api/points${q}`, token);
    },
    enabled: Boolean(isSignedIn),
  });

  const myPoints = useMemo(() => myPointsData?.items ?? [], [myPointsData?.items]);
  const folders = useMemo(() => foldersData?.items ?? [], [foldersData?.items]);
  const tags = useMemo(() => tagsData?.items ?? [], [tagsData?.items]);

  const myIconFor = useMemo(() => (id: string) => makeMyPinIcon(id), []);

  const folderSlot = isSignedIn ? (
    <>
      <p className="mb-2 text-xs text-slate-500">Filter your markers on the map</p>
      <FolderList folders={folders} selectedFolderId={folderId} onSelectFolder={setFolderId} />
      <p className="mt-3 text-xs text-slate-500">Click the map to add a point.</p>
    </>
  ) : null;

  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-slate-100 md:flex-row">
      <div className="relative min-h-[55vh] flex-1 md:min-h-0">
        <MapContainer className="z-0 h-full w-full" center={[20, 0]} zoom={2} scrollWheelZoom>
          <GuestMapLayer points={items} />
          {isSignedIn && myPoints.length > 0 ? (
            <ClusteredMarkers points={myPoints} iconFor={myIconFor} />
          ) : null}
          {isSignedIn ? (
            <MapClickToCreate
              enabled={createOpen === null}
              onPick={(lat, lng) => setCreateOpen({ lat, lng })}
            />
          ) : null}
        </MapContainer>
      </div>
      <LatestPointsPanel
        className="w-full border-t border-slate-200 md:max-w-sm md:border-t-0 md:border-l"
        items={items}
        isLoading={isLoading}
        isError={isError}
        error={error instanceof Error ? error : null}
        topSlot={folderSlot}
      />
      {isSignedIn && createOpen ? (
        <CreatePointForm
          open
          latitude={createOpen.lat}
          longitude={createOpen.lng}
          folders={folders}
          tags={tags}
          selectedFolderId={folderId}
          onClose={() => setCreateOpen(null)}
        />
      ) : null}
    </div>
  );
}
