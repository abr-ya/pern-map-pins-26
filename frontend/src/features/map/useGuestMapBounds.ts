import { useEffect, useMemo } from 'react';
import { useMap } from 'react-leaflet';
import { applyPointsBounds, type LatLngLike } from './mapBounds';

/**
 * Fit the map to the given guest points, or a world view when there are none.
 * When `enabled` is false (e.g. point detail open), skips so selection camera can own the view.
 * Must be used in a component rendered inside `MapContainer`.
 */
export function useGuestMapBounds(points: readonly LatLngLike[], enabled = true): void {
  const map = useMap();

  const coordsKey = useMemo(
    () =>
      points
        .map((p) => `${p.latitude.toFixed(6)},${p.longitude.toFixed(6)}`)
        .sort()
        .join('|'),
    [points],
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }
    applyPointsBounds(map, points);
  }, [map, points, enabled, coordsKey]);
}
