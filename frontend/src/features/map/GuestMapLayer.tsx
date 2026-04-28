import L from 'leaflet';
import { useMemo } from 'react';
import { Marker, TileLayer } from 'react-leaflet';
import type { PublicPoint } from '../../lib/pointTypes';
import { makeGuestPinIcon } from './mapPins';
import { useGuestMapBounds } from './useGuestMapBounds';

const osmAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

function GuestMapAutofit({ points }: { points: PublicPoint[] }) {
  const latLngs = useMemo(
    () => points.map((p) => ({ latitude: p.latitude, longitude: p.longitude })),
    [points],
  );
  useGuestMapBounds(latLngs);
  return null;
}

/**
 * Guest “latest five” layer: OSM tiles, plain markers (≤5), bounds fitting.
 * Heavier clustering for many markers is used on signed-in layers in MapPage.
 */
export function GuestMapLayer({ points }: { points: PublicPoint[] }) {
  return (
    <>
      <TileLayer attribution={osmAttribution} url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <GuestMapAutofit points={points} />
      {points.map((p) => (
        <Marker key={p.id} position={[p.latitude, p.longitude]} icon={makeGuestPinIcon(p.id)} />
      ))}
    </>
  );
}
