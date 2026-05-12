import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import { applyPointsBounds, flyToNeighborhood, type LatLngLike } from './mapBounds';

type MapPoint = LatLngLike & { id: string };

/**
 * FR-015 / FR-016: neighborhood fly-to when a pin is selected; restore overview when selection clears.
 */
export function SignedInSelectionCamera({
  detailPointId,
  points,
}: {
  detailPointId: string | null;
  points: readonly MapPoint[];
}) {
  const map = useMap();
  const prevDetail = useRef<string | null>(null);

  useEffect(() => {
    if (detailPointId) {
      const p = points.find((x) => x.id === detailPointId);
      if (p) {
        flyToNeighborhood(map, p.latitude, p.longitude);
      }
      prevDetail.current = detailPointId;
      return;
    }

    if (prevDetail.current) {
      applyPointsBounds(map, points);
      prevDetail.current = null;
    }
  }, [detailPointId, points, map]);

  return null;
}
