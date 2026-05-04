import L from 'leaflet';

const guestColors = { fillUi: '#3b82f6', strokeUi: '#1d4ed8' };
const mineColors = { fillUi: '#22c55e', strokeUi: '#15803d' };

function pinHtml(pointId: string, variant: 'guest' | 'mine') {
  const c = variant === 'guest' ? guestColors : mineColors;
  return `<div data-testid="map-pin" data-point-id="${pointId}" style="width:12px;height:12px;border-radius:9999px;background:${c.fillUi};border:2px solid ${c.strokeUi};box-sizing:border-box" aria-hidden="true"></div>`;
}

export function makeGuestPinIcon(pointId: string): L.DivIcon {
  return L.divIcon({
    className: `map-pin map-pin--guest`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    html: pinHtml(pointId, 'guest'),
  });
}

export function makeMyPinIcon(pointId: string): L.DivIcon {
  return L.divIcon({
    className: `map-pin map-pin--mine`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    html: pinHtml(pointId, 'mine'),
  });
}
