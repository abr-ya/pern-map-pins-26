import { ClerkProvider } from '@clerk/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CreatePointForm } from './CreatePointForm';
import type { FolderDto, TagDto } from '../../lib/pointTypes';

vi.mock('@clerk/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@clerk/react')>();
  return {
    ...actual,
    useAuth: () => ({
      isSignedIn: true,
      getToken: vi.fn().mockResolvedValue('test_jwt'),
    }),
  };
});

describe('CreatePointForm (T048)', () => {
  it('shows validation when title is empty', async () => {
    const user = userEvent.setup();
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const folders: FolderDto[] = [];
    const tags: TagDto[] = [];

    render(
      <ClerkProvider publishableKey="pk_test_ZXhhbXBsZS5jbGVyay5leGFtcGxlLmRldiQ">
        <QueryClientProvider client={qc}>
          <CreatePointForm
            open
            latitude={1.5}
            longitude={2.5}
            folders={folders}
            tags={tags}
            selectedFolderId={null}
            onClose={vi.fn()}
          />
        </QueryClientProvider>
      </ClerkProvider>,
    );

    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('displays map coordinates from props', () => {
    const qc = new QueryClient();

    render(
      <ClerkProvider publishableKey="pk_test_ZXhhbXBsZS5jbGVyay5leGFtcGxlLmRldiQ">
        <QueryClientProvider client={qc}>
          <CreatePointForm
            open
            latitude={48.8584}
            longitude={2.2945}
            folders={[]}
            tags={[]}
            selectedFolderId={null}
            onClose={vi.fn()}
          />
        </QueryClientProvider>
      </ClerkProvider>,
    );

    expect(screen.getByTestId('create-point-coords').textContent).toMatch(/48\.85840/);
    expect(screen.getByTestId('create-point-coords').textContent).toMatch(/2\.29450/);
  });
});
