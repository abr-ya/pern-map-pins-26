import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import { applyPointsBounds, flyToNeighborhood, type LatLngLike } from './mapBounds';

type MapPoint = LatLngLike & { id: string };

type Props = {
  detailPointId: string | null;
  selectionSerial: number;
  /** Pins used for overview after deselect (explore viewport or folder). */
  points: readonly MapPoint[];
  /** Where to resolve coordinates for fly-to (includes Latest list + map layer). */
  lookupPoints: readonly MapPoint[];
};

/**
 * FR-015 / FR-016: fly to neighborhood once per selection; restore overview on deselect.
 * Does not re-fly when `points` / `lookupPoints` refetch while the same point stays selected
 * (e.g. map scroll zoom changing explorePoints).
 */
export function SignedInSelectionCamera({
  detailPointId,
  selectionSerial,
  points,
  lookupPoints,
}: Props) {
  const map = useMap();
  const prevOpenId = useRef<string | null>(null);
  const lastHandledSerial = useRef<number | null>(null);

  useEffect(() => {
    if (detailPointId) {
      if (lastHandledSerial.current === selectionSerial) {
        return;
      }
      const p = lookupPoints.find((x) => x.id === detailPointId);
      if (p) {
        flyToNeighborhood(map, p.latitude, p.longitude);
        lastHandledSerial.current = selectionSerial;
        prevOpenId.current = detailPointId;
      }
      return;
    }

    if (prevOpenId.current) {
      applyPointsBounds(map, points);
    }
    prevOpenId.current = null;
    lastHandledSerial.current = null;
  }, [detailPointId, map, lookupPoints, points, selectionSerial]);

  return null;
}
