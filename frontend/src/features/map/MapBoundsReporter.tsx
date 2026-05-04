import type { LatLngBounds } from 'leaflet';
import { useCallback, useEffect, useRef } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';

const DEBOUNCE_MS = 280;

/**
 * Emits the current map bounds (debounced on pan/zoom) so callers can bbox-fetch API layers.
 */
export function MapBoundsReporter({
  onDebouncedBounds,
}: {
  onDebouncedBounds: (bounds: LatLngBounds) => void;
}): null {
  const map = useMap();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const emit = useCallback(() => {
    onDebouncedBounds(map.getBounds());
  }, [map, onDebouncedBounds]);

  useEffect(() => {
    emit();
  }, [emit]);

  useMapEvents({
    moveend() {
      if (timeoutRef.current !== undefined) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(emit, DEBOUNCE_MS);
    },
    zoomend() {
      if (timeoutRef.current !== undefined) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(emit, DEBOUNCE_MS);
    },
  });

  return null;
}
