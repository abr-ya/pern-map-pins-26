import L from 'leaflet';

export const WORLD_CENTER: L.LatLngExpression = [20, 0];
export const WORLD_ZOOM = 2;
export const SINGLE_ZOOM = 10;
/** ~3–4 city blocks at mid-latitudes with OSM (tunable). */
export const NEIGHBORHOOD_ZOOM = 16;
export const NEIGHBORHOOD_FLY_DURATION_SEC = 0.45;

export type LatLngLike = { latitude: number; longitude: number };

/** Default “overview” fit for a set of pins (guest latest-five, folder, explore snapshot). */
export function applyPointsBounds(map: L.Map, points: readonly LatLngLike[]): void {
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
}

export function flyToNeighborhood(map: L.Map, latitude: number, longitude: number): void {
  map.flyTo([latitude, longitude], NEIGHBORHOOD_ZOOM, { duration: NEIGHBORHOOD_FLY_DURATION_SEC });
}
