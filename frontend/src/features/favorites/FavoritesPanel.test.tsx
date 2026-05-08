import { ClerkProvider } from '@clerk/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FavoritesPanel } from './FavoritesPanel';

const pointId = '00000000-0000-4000-8000-0000000000aa';

const emptyFavorites = { items: [] as { pointId: string; favoriteFolderId: string | null }[] };
const emptyFolders = { items: [] as { id: string; name: string; parentId: string | null }[] };

vi.mock('@clerk/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@clerk/react')>();
  return {
    ...actual,
    useAuth: () => ({
      isSignedIn: true,
      getToken: vi.fn().mockResolvedValue('jwt_test'),
    }),
  };
});

const apiGetJson = vi.fn();
const apiPostJson = vi.fn();
const apiPatchJson = vi.fn();
const apiDelete = vi.fn();

vi.mock('../../lib/api', () => ({
  apiGetJson: (...args: unknown[]) => apiGetJson(...args),
  apiPostJson: (...args: unknown[]) => apiPostJson(...args),
  apiPatchJson: (...args: unknown[]) => apiPatchJson(...args),
  apiDelete: (...args: unknown[]) => apiDelete(...args),
}));

describe('FavoritesPanel (T068)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiGetJson.mockImplementation(async (path: string) => {
      if (path === '/api/favorites') return emptyFavorites;
      if (path === '/api/favorite-folders') return emptyFolders;
      throw new Error(`Unexpected GET ${path}`);
    });
    apiPostJson.mockImplementation(async (path: string, _token: string | null, body: unknown) => {
      if (path === '/api/favorites') {
        const b = body as { pointId: string; favoriteFolderId: string | null };
        return { pointId: b.pointId, favoriteFolderId: b.favoriteFolderId };
      }
      if (path === '/api/favorite-folders') {
        const b = body as { name: string };
        return {
          id: '00000000-0000-4000-8000-00000000ceef',
          name: b.name,
          parentId: null,
        };
      }
      return {};
    });
    apiPatchJson.mockResolvedValue({ pointId, favoriteFolderId: null });
    apiDelete.mockResolvedValue(undefined);
  });

  function renderPanel(props: { pointId?: string } = {}) {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    render(
      <ClerkProvider publishableKey="pk_test_ZXhhbXBsZS5jbGVyay5leGFtcGxlLmRldiQ">
        <QueryClientProvider client={qc}>
          <FavoritesPanel {...props} />
        </QueryClientProvider>
      </ClerkProvider>,
    );
  }

  it('loads and shows empty state with add-to-favorites when pointId is set', async () => {
    renderPanel({ pointId });

    await waitFor(() => {
      expect(screen.queryByText(/Loading favorites/i)).not.toBeInTheDocument();
    });

    expect(screen.getByText('Favorites')).toBeInTheDocument();
    expect(screen.getByText(/No favorites yet/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add to favorites/i })).toBeInTheDocument();
  });

  it('calls POST /api/favorites when adding current point', async () => {
    const user = userEvent.setup();

    renderPanel({ pointId });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Add to favorites/i })).toBeEnabled();
    });

    await user.click(screen.getByRole('button', { name: /Add to favorites/i }));

    await waitFor(() => {
      expect(apiPostJson).toHaveBeenCalledWith(
        '/api/favorites',
        'jwt_test',
        expect.objectContaining({ pointId, favoriteFolderId: null }),
      );
    });
  });

  it('shows remove control when point is favorited and calls DELETE on remove', async () => {
    const user = userEvent.setup();
    apiGetJson.mockImplementation(async (path: string) => {
      if (path === '/api/favorites') {
        return { items: [{ pointId, favoriteFolderId: null }] };
      }
      if (path === '/api/favorite-folders') {
        return emptyFolders;
      }
      throw new Error(`Unexpected GET ${path}`);
    });

    renderPanel({ pointId });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Remove from favorites/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Remove from favorites/i }));

    await waitFor(() => {
      expect(apiDelete).toHaveBeenCalledWith(`/api/favorites/${pointId}`, 'jwt_test');
    });
  });

  it('creates a folder via POST /api/favorite-folders', async () => {
    const user = userEvent.setup();

    renderPanel();

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/New favorite folder/i)).toBeInTheDocument();
    });

    await user.type(screen.getByPlaceholderText(/New favorite folder/i), 'Shortlist');
    await user.click(screen.getByRole('button', { name: /Create folder/i }));

    await waitFor(() => {
      expect(apiPostJson).toHaveBeenCalledWith('/api/favorite-folders', 'jwt_test', { name: 'Shortlist' });
    });
  });

  it('shows API error message when favorites request fails', async () => {
    apiGetJson.mockImplementation(async (path: string) => {
      if (path === '/api/favorites') {
        throw new Error('API 500');
      }
      if (path === '/api/favorite-folders') return emptyFolders;
      throw new Error(`Unexpected GET ${path}`);
    });

    renderPanel({ pointId });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/API 500/);
    });
  });
});
