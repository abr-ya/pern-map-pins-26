import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { ActiveGroupSwitcher } from './ActiveGroupSwitcher';

const getTokenMock = vi.fn<[], Promise<string | null>>();
const useAuthMock = vi.fn();

vi.mock('@clerk/react', () => ({
  useAuth: () => useAuthMock(),
}));

const prefsJson = { activeGroupId: null as string | null };
const groupsJson = {
  items: [
    { id: '10000000-0000-4000-8000-000000000099', name: 'Alpha', createdAt: '2024-01-01T00:00:00.000Z' },
  ],
};

describe('ActiveGroupSwitcher (T058)', () => {
  beforeEach(() => {
    getTokenMock.mockResolvedValue('tok');
    useAuthMock.mockReturnValue({
      isLoaded: true,
      isSignedIn: true,
      getToken: getTokenMock,
    });
    prefsJson.activeGroupId = null;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string | URL, init?: RequestInit) => {
        const u = String(url);
        if (u.includes('/api/me/preferences') && init?.method === 'PATCH') {
          const body = JSON.parse(String(init?.body)) as { activeGroupId: string | null };
          prefsJson.activeGroupId = body.activeGroupId;
          return new Response(JSON.stringify(prefsJson), { status: 200 });
        }
        if (u.includes('/api/me/preferences')) {
          return new Response(JSON.stringify(prefsJson), { status: 200 });
        }
        if (u.includes('/api/groups')) {
          return new Response(JSON.stringify(groupsJson), { status: 200 });
        }
        return new Response('not found', { status: 404 });
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads preferences and groups; PATCH updates active label after selecting a group', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <ActiveGroupSwitcher />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('active-group-switcher')).toBeInTheDocument();
    });

    expect(screen.getByTestId('active-group-label')).toHaveTextContent(/public only/i);

    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: /active group for private map layer/i }),
      '10000000-0000-4000-8000-000000000099',
    );

    await waitFor(() => {
      expect(screen.getByTestId('active-group-label')).toHaveTextContent(/alpha/i);
    });

    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      expect.stringContaining('/api/me/preferences'),
      expect.objectContaining({ method: 'PATCH' }),
    );
  });
});
