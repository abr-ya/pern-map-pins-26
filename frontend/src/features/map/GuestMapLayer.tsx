import { useEffect, useMemo, useRef } from 'react';
import { Marker, useMap, useMapEvents } from 'react-leaflet';
import type { PublicPoint } from '../../lib/pointTypes';
import { flyToNeighborhood } from './mapBounds';
import { makeGuestPinIcon } from './mapPins';
import { useGuestMapBounds } from './useGuestMapBounds';

function GuestMapAutofit({
  points,
  suspendAutofit,
}: {
  points: PublicPoint[];
  suspendAutofit: boolean;
}) {
  const latLngs = useMemo(
    () => points.map((p) => ({ latitude: p.latitude, longitude: p.longitude })),
    [points],
  );
  useGuestMapBounds(latLngs, !suspendAutofit);
  return null;
}

function GuestSelectionCamera({
  selectedPointId,
  selectionSerial,
  points,
}: {
  selectedPointId: string | null | undefined;
  selectionSerial: number;
  points: PublicPoint[];
}) {
  const map = useMap();
  const lastHandledSerial = useRef<number | null>(null);

  useEffect(() => {
    if (!selectedPointId) {
      lastHandledSerial.current = null;
      return;
    }
    if (lastHandledSerial.current === selectionSerial) {
      return;
    }
    const p = points.find((q) => q.id === selectedPointId);
    if (!p) {
      return;
    }
    flyToNeighborhood(map, p.latitude, p.longitude);
    lastHandledSerial.current = selectionSerial;
  }, [map, points, selectedPointId, selectionSerial]);

  return null;
}

function GuestDismissOnMapClick({
  selectedPointId,
  onClearSelection,
}: {
  selectedPointId: string | null | undefined;
  onClearSelection?: () => void;
}) {
  useMapEvents({
    click() {
      if (selectedPointId && onClearSelection) {
        onClearSelection();
      }
    },
  });
  return null;
}

/**
 * Guest “latest five” layer: plain markers (≤5) and bounds fitting. Tiles live in {@link OsmTileLayer}.
 */
export function GuestMapLayer({
  points,
  selectedPointId,
  selectionSerial,
  onClearSelection,
  onMarkerClick,
}: {
  points: PublicPoint[];
  /** When set, autofit to all guest pins is suspended and the map flies to the selected pin (FR-015). */
  selectedPointId?: string | null;
  selectionSerial: number;
  /** Map background click clears selection (guest). */
  onClearSelection?: () => void;
  onMarkerClick?: (pointId: string) => void;
}) {
  const suspend = Boolean(selectedPointId);

  return (
    <>
      <GuestMapAutofit points={points} suspendAutofit={suspend} />
      {suspend ? (
        <GuestSelectionCamera
          selectedPointId={selectedPointId}
          selectionSerial={selectionSerial}
          points={points}
        />
      ) : null}
      <GuestDismissOnMapClick selectedPointId={selectedPointId} onClearSelection={onClearSelection} />
      {points.map((p) => (
        <Marker
          key={p.id}
          position={[p.latitude, p.longitude]}
          icon={makeGuestPinIcon(p.id)}
          bubblingMouseEvents={false}
          eventHandlers={
            onMarkerClick
              ? {
                  click: () => {
                    onMarkerClick(p.id);
                  },
                }
              : undefined
          }
        />
      ))}
    </>
  );
}
