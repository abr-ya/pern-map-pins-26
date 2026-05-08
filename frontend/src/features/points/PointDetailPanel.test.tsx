import { ClerkProvider } from '@clerk/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PointDetailPanel } from './PointDetailPanel';
import type { PublicPoint } from '../../lib/pointTypes';

const point: PublicPoint = {
  id: '00000000-0000-4000-8000-000000000001',
  title: 'Cafe',
  description: 'Nice coffee',
  photoUrl: null,
  latitude: 0,
  longitude: 0,
  createdAt: '2024-01-15T10:00:00.000Z',
  authorId: '00000000-0000-4000-8000-000000000002',
  visibility: 'public',
  groupId: null,
  folderId: null,
  averageRating: 4.25,
  myRating: null,
};

vi.mock('@clerk/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@clerk/react')>();
  return {
    ...actual,
    useAuth: () => ({
      isSignedIn: false,
      getToken: vi.fn().mockResolvedValue(null),
    }),
  };
});

vi.mock('../../lib/api', () => ({
  apiGetJson: vi.fn().mockResolvedValue(point),
  apiPostJson: vi.fn(),
  apiPutJson: vi.fn(),
}));

describe('PointDetailPanel (T063 / T068 guest)', () => {
  it('loads public point and hides comments for guests', async () => {
    const qc = new QueryClient({ defaultOptions: {queries: { retry: false } } });

    render(
      <ClerkProvider publishableKey="pk_test_ZXhhbXBsZS5jbGVyay5leGFtcGxlLmRldiQ">
        <QueryClientProvider client={qc}>
          <PointDetailPanel pointId={point.id} />
        </QueryClientProvider>
      </ClerkProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 3, name: /Cafe/i })).toBeInTheDocument();
    });

    expect(screen.getByText(/Sign in to read comments/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '1' })).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/Write a comment/i)).not.toBeInTheDocument();
  });
});
