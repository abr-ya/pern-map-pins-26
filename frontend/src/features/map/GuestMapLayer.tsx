import L from 'leaflet';
import { useMemo } from 'react';
import { Marker, TileLayer } from 'react-leaflet';
import type { PublicPoint } from '../../lib/pointTypes';
import { useGuestMapBounds } from './useGuestMapBounds';

const osmAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

function makePinIcon(pointId: string) {
  return L.divIcon({
    className: 'guest-map-pin',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    html: `<div data-testid="map-pin" data-point-id="${pointId}" style="width:12px;height:12px;border-radius:9999px;background:#3b82f6;border:2px solid #1d4ed8;box-sizing:border-box" aria-hidden="true"></div>`,
  });
}

function GuestMapAutofit({ points }: { points: PublicPoint[] }) {
  const latLngs = useMemo(
    () => points.map((p) => ({ latitude: p.latitude, longitude: p.longitude })),
    [points],
  );
  useGuestMapBounds(latLngs);
  return null;
}

/** Guest layer: OSM tiles, markers for the latest public points only, and bounds fitting. */
export function GuestMapLayer({ points }: { points: PublicPoint[] }) {
  return (
    <>
      <TileLayer attribution={osmAttribution} url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <GuestMapAutofit points={points} />
      {points.map((p) => (
        <Marker key={p.id} position={[p.latitude, p.longitude]} icon={makePinIcon(p.id)} />
      ))}
    </>
  );
}
