import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import App from './App';

vi.mock('@clerk/react', () => ({
  ClerkProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => ({ isLoaded: true, isSignedIn: false }),
  UserButton: () => null,
  SignIn: () => null,
  SignUp: () => null,
}));

describe('App', () => {
  it('loads the guest map view and latest panel', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ items: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    render(
      <QueryClientProvider client={client}>
        <App />
      </QueryClientProvider>,
    );
    expect(await screen.findByRole('heading', { name: /Latest public/i })).toBeInTheDocument();
    expect(screen.getByTestId('app-header')).toBeInTheDocument();
  });
});
