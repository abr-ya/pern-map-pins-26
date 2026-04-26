import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { MapContainer } from 'react-leaflet';
import { apiGet } from '../../lib/api';
import type { PublicPoint } from '../../lib/pointTypes';
import { GuestMapLayer } from './GuestMapLayer';
import { LatestPointsPanel } from './LatestPointsPanel';

type LatestResponse = { items: PublicPoint[] };

export function MapPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['public', 'latest'] as const,
    queryFn: () => apiGet<LatestResponse>('/api/public/latest'),
  });

  const items = useMemo(() => data?.items ?? [], [data?.items]);

  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-slate-100 md:flex-row">
      <div className="relative min-h-[55vh] flex-1 md:min-h-0">
        <MapContainer
          className="z-0 h-full w-full"
          center={[20, 0]}
          zoom={2}
          scrollWheelZoom
        >
          <GuestMapLayer points={items} />
        </MapContainer>
      </div>
      <LatestPointsPanel
        className="w-full border-t border-slate-200 md:max-w-sm md:border-t-0 md:border-l"
        items={items}
        isLoading={isLoading}
        isError={isError}
        error={error instanceof Error ? error : null}
      />
    </div>
  );
}
