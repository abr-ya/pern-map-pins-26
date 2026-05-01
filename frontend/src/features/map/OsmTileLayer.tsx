import { type ReactElement } from 'react';
import { TileLayer } from 'react-leaflet';

const osmAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

export function OsmTileLayer(): ReactElement {
  return (
    <TileLayer attribution={osmAttribution} url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
  );
}
