import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { PublicPoint } from '../../lib/pointTypes';
import { LatestPointsPanel } from './LatestPointsPanel';

const sample: PublicPoint = {
  id: '00000000-0000-4000-8000-000000000001',
  title: 'Cafe',
  description: null,
  photoUrl: null,
  latitude: 0,
  longitude: 0,
  createdAt: '2024-01-15T10:00:00.000Z',
  authorId: '00000000-0000-4000-8000-000000000002',
  visibility: 'public',
  groupId: null,
  folderId: null,
  averageRating: null,
  myRating: null,
};

describe('LatestPointsPanel', () => {
  it('shows empty state when there are no items', () => {
    render(
      <LatestPointsPanel items={[]} isLoading={false} isError={false} error={null} />,
    );
    expect(screen.getByText(/No public points yet/i)).toBeInTheDocument();
  });

  it('renders at most five items from props', () => {
    const many = Array.from({ length: 5 }, (_, i) => ({
      ...sample,
      id: `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`,
      title: `P${i}`,
    }));
    render(
      <LatestPointsPanel
        items={many}
        isLoading={false}
        isError={false}
        error={null}
      />,
    );
    expect(screen.getByText('P0')).toBeInTheDocument();
    expect(screen.getByText('P4')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(
      <LatestPointsPanel items={[]} isLoading isError={false} error={null} />,
    );
    expect(screen.getByText(/Loading/)).toBeInTheDocument();
  });
});
