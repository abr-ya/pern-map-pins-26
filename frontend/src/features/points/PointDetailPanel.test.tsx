import { ClerkProvider } from '@clerk/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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

const authState = vi.hoisted(() => ({
  isSignedIn: false,
  token: null as string | null,
}));

const apiGetJsonFn = vi.hoisted(() => vi.fn());
const apiPostJsonFn = vi.hoisted(() => vi.fn());
const apiPutJsonFn = vi.hoisted(() => vi.fn());
const apiPatchJsonFn = vi.hoisted(() => vi.fn());
const apiDeleteFn = vi.hoisted(() => vi.fn());

vi.mock('@clerk/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@clerk/react')>();
  return {
    ...actual,
    useAuth: () => ({
      isSignedIn: authState.isSignedIn,
      getToken: vi.fn(async () => authState.token),
    }),
  };
});

vi.mock('../../lib/api', () => ({
  apiGetJson: apiGetJsonFn,
  apiPostJson: apiPostJsonFn,
  apiPutJson: apiPutJsonFn,
  apiPatchJson: apiPatchJsonFn,
  apiDelete: apiDeleteFn,
}));

function defaultApiGet(path: string) {
  if (path.includes(`/public/points/${point.id}`)) {
    return Promise.resolve(point);
  }
  if (path.includes(`/points/${point.id}/comments`)) {
    return Promise.resolve({ items: [] });
  }
  if (path === '/api/favorites') {
    return Promise.resolve({ items: [] });
  }
  if (path === '/api/favorite-folders') {
    return Promise.resolve({ items: [] });
  }
  return Promise.reject(new Error(`Unexpected GET ${path}`));
}

function renderDetail() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  render(
    <ClerkProvider publishableKey="pk_test_ZXhhbXBsZS5jbGVyay5leGFtcGxlLmRldiQ">
      <QueryClientProvider client={qc}>
        <PointDetailPanel pointId={point.id} />
      </QueryClientProvider>
    </ClerkProvider>,
  );
}

describe('PointDetailPanel (guest)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authState.isSignedIn = false;
    authState.token = null;
    apiGetJsonFn.mockImplementation((path: string) => defaultApiGet(path));
    apiPostJsonFn.mockResolvedValue({});
    apiPutJsonFn.mockResolvedValue({ myRating: 3, averageRating: 4 });
    apiPatchJsonFn.mockResolvedValue({ pointId: point.id, favoriteFolderId: null });
    apiDeleteFn.mockResolvedValue(undefined);
  });

  it('loads public point and hides comments for guests', async () => {
    renderDetail();

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 3, name: /Cafe/i })).toBeInTheDocument();
    });

    expect(screen.getByText(/Sign in to read comments/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '1' })).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/Write a comment/i)).not.toBeInTheDocument();

    expect(apiGetJsonFn).toHaveBeenCalledWith(
      `/api/public/points/${point.id}`,
      null,
    );
    expect(apiGetJsonFn).not.toHaveBeenCalledWith(
      `/api/points/${point.id}/comments`,
      expect.anything(),
    );
  });
});

describe('PointDetailPanel (signed-in, T068)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authState.isSignedIn = true;
    authState.token = 'jwt_test';
    apiGetJsonFn.mockImplementation((path: string, _token: string | null) => defaultApiGet(path));
    apiPostJsonFn.mockResolvedValue({
      id: '00000000-0000-4000-8000-000000000099',
      body: 'Hi',
      authorId: point.authorId,
      displayName: 'Tester',
      createdAt: '2024-02-01T12:00:00.000Z',
    });
    apiPutJsonFn.mockResolvedValue({ myRating: 3, averageRating: 4.5 });
    apiPatchJsonFn.mockResolvedValue({ pointId: point.id, favoriteFolderId: null });
    apiDeleteFn.mockResolvedValue(undefined);
  });

  it('shows rating, comments, and favorites sections', async () => {
    renderDetail();

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 3, name: /Cafe/i })).toBeInTheDocument();
    });

    expect(screen.queryByText(/Sign in to read comments/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Your rating/i)).toBeInTheDocument();
    expect(screen.getByText(/Comments/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Write a comment/i)).toBeInTheDocument();
    expect(screen.getByText('Favorites')).toBeInTheDocument();

    await waitFor(() => {
      expect(apiGetJsonFn).toHaveBeenCalledWith(`/api/public/points/${point.id}`, 'jwt_test');
    });
    expect(apiGetJsonFn).toHaveBeenCalledWith(`/api/points/${point.id}/comments`, 'jwt_test');
    expect(apiGetJsonFn).toHaveBeenCalledWith('/api/favorites', 'jwt_test');
    expect(apiGetJsonFn).toHaveBeenCalledWith('/api/favorite-folders', 'jwt_test');
  });

  it('sends PUT rating when a star button is clicked', async () => {
    const user = userEvent.setup();
    renderDetail();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '3' })).toBeEnabled();
    });

    await user.click(screen.getByRole('button', { name: '3' }));

    await waitFor(() => {
      expect(apiPutJsonFn).toHaveBeenCalledWith(`/api/points/${point.id}/rating`, 'jwt_test', {
        value: 3,
      });
    });
  });
});
