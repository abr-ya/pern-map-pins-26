import { ClerkProvider } from '@clerk/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { CreateFolderForm } from './CreateFolderForm';

vi.mock('@clerk/react', () => ({
  ClerkProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  useAuth: () => ({
    getToken: vi.fn().mockResolvedValue('jwt'),
  }),
}));

describe('CreateFolderForm', () => {
  it('submits folder name via POST /api/folders', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          id: '00000000-0000-4000-8000-0000000000f1',
          name: 'Road trip',
          groupId: null,
          createdAt: '2024-01-01T00:00:00.000Z',
        }),
        { status: 201, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    const onCreated = vi.fn();
    const qc = new QueryClient();
    render(
      <ClerkProvider publishableKey="pk_test_ZXhhbXBsZS5jbGVyay5leGFtcGxlLmRldiQ">
        <QueryClientProvider client={qc}>
          <CreateFolderForm onCreated={onCreated} />
        </QueryClientProvider>
      </ClerkProvider>,
    );

    await user.type(screen.getByLabelText(/new folder name/i), 'Road trip');
    await user.click(screen.getByRole('button', { name: /^add$/i }));

    expect(fetchMock).toHaveBeenCalled();
    const call = fetchMock.mock.calls.find((c) => String(c[0]).includes('/api/folders'));
    expect(call).toBeDefined();
    expect(call?.[1]?.method).toBe('POST');
    expect(JSON.parse(String(call?.[1]?.body))).toEqual({ name: 'Road trip', groupId: null });
    await vi.waitFor(() => {
      expect(onCreated).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Road trip' }),
      );
    });

    fetchMock.mockRestore();
  });
});
