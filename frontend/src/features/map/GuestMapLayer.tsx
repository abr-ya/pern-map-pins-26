import { useMemo } from 'react';
import { Marker } from 'react-leaflet';
import type { PublicPoint } from '../../lib/pointTypes';
import { makeGuestPinIcon } from './mapPins';
import { useGuestMapBounds } from './useGuestMapBounds';

function GuestMapAutofit({ points }: { points: PublicPoint[] }) {
  const latLngs = useMemo(
    () => points.map((p) => ({ latitude: p.latitude, longitude: p.longitude })),
    [points],
  );
  useGuestMapBounds(latLngs);
  return null;
}

/**
 * Guest “latest five” layer: plain markers (≤5) and bounds fitting. Tiles live in {@link OsmTileLayer}.
 */
export function GuestMapLayer({ points }: { points: PublicPoint[] }) {
  return (
    <>
      <GuestMapAutofit points={points} />
      {points.map((p) => (
        <Marker key={p.id} position={[p.latitude, p.longitude]} icon={makeGuestPinIcon(p.id)} />
      ))}
    </>
  );
}
