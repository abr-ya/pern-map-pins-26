import L from 'leaflet';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster';
import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';

type ClusterPoint = { id: string; latitude: number; longitude: number };

type MCG = L.MarkerClusterGroup;

/** Imperative marker cluster layer for many overlapping pins (US3 / T043). */
export function ClusteredMarkers({
  points,
  iconFor,
  onMarkerClick,
}: {
  points: ClusterPoint[];
  iconFor: (pointId: string) => L.Icon | L.DivIcon;
  onMarkerClick?: (pointId: string) => void;
}) {
  const map = useMap();
  const groupRef = useRef<MCG | null>(null);

  useEffect(() => {
    const mcg = L.markerClusterGroup({ chunkedLoading: true }) as MCG;
    groupRef.current = mcg;
    map.addLayer(mcg);
    return () => {
      map.removeLayer(mcg);
      groupRef.current = null;
    };
  }, [map]);

  useEffect(() => {
    const mcg = groupRef.current;
    if (!mcg) {
      return;
    }
    mcg.clearLayers();
    for (const p of points) {
      const marker = L.marker([p.latitude, p.longitude], {
        bubblingMouseEvents: false,
        icon: iconFor(p.id),
      });
      if (onMarkerClick) {
        marker.on('click', () => {
          onMarkerClick(p.id);
        });
      }
      mcg.addLayer(marker);
    }
  }, [points, iconFor, onMarkerClick]);

  return null;
}
