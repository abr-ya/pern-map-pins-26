import L from 'leaflet';
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

type LatLng = { latitude: number; longitude: number };

const WORLD_CENTER: L.LatLngExpression = [20, 0];
const WORLD_ZOOM = 2;
const SINGLE_ZOOM = 10;

/**
 * Fit the map to the given guest points, or a world view when there are none.
 * Must be used in a component rendered inside `MapContainer`.
 */
export function useGuestMapBounds(points: readonly LatLng[]): void {
  const map = useMap();

  useEffect(() => {
    if (points.length === 0) {
      map.setView(WORLD_CENTER, WORLD_ZOOM);
      return;
    }
    if (points.length === 1) {
      const p = points[0];
      map.setView([p.latitude, p.longitude], SINGLE_ZOOM);
      return;
    }
    const bounds = L.latLngBounds(points.map((p) => L.latLng(p.latitude, p.longitude)));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
  }, [map, points]);
}
