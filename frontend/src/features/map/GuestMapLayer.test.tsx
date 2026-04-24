import { render, waitFor } from '@testing-library/react';
import { MapContainer } from 'react-leaflet';
import { describe, expect, it } from 'vitest';
import type { PublicPoint } from '../../lib/pointTypes';
import { GuestMapLayer } from './GuestMapLayer';

const base = (i: number, lat: number, lng: number): PublicPoint => ({
  id: `00000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`,
  title: `P${i}`,
  description: null,
  photoUrl: null,
  latitude: lat,
  longitude: lng,
  createdAt: '2024-01-15T10:00:00.000Z',
  authorId: '00000000-0000-4000-8000-000000000002',
  visibility: 'public',
  groupId: null,
  folderId: null,
  averageRating: null,
  myRating: null,
});

function renderWithMap(points: PublicPoint[]) {
  return render(
    <div style={{ height: 200, width: 400 }}>
      <MapContainer
        style={{ height: 200, width: 400 }}
        center={[1, 2]}
        zoom={2}
        scrollWheelZoom={false}
      >
        <GuestMapLayer points={points} />
      </MapContainer>
    </div>,
  );
}

describe('GuestMapLayer', () => {
  it('with empty items, shows no map pins', async () => {
    const { container } = renderWithMap([]);
    await waitFor(() => {
      expect(container.querySelectorAll('[data-testid="map-pin"]')).toHaveLength(0);
    });
  });

  it('renders at most one pin per item (smoke, mocked API has ≤5 points in production)', async () => {
    const { container } = renderWithMap([base(0, 1, 2), base(1, 1.1, 2.1)]);
    await waitFor(() => {
      expect(container.querySelectorAll('[data-testid="map-pin"]')).toHaveLength(2);
    });
  });
});
