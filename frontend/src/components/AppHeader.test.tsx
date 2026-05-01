import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { AppHeader } from './AppHeader';

const useAuthMock = vi.fn();

vi.mock('@clerk/react', () => ({
  useAuth: () => useAuthMock(),
  UserButton: () => <div data-testid="user-button">UserButton</div>,
  SignIn: () => <div data-testid="sign-in-component">SignIn</div>,
  SignUp: () => <div data-testid="sign-up-component">SignUp</div>,
}));

function renderAppHeader(): ReturnType<typeof render> {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <AppHeader />
    </QueryClientProvider>,
  );
}

describe('AppHeader (T036)', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string | URL) => {
        const u = String(url);
        if (u.includes('/api/me/preferences')) {
          return new Response(JSON.stringify({ activeGroupId: null }), { status: 200 });
        }
        if (u.includes('/api/groups')) {
          return new Response(JSON.stringify({ items: [] }), { status: 200 });
        }
        return new Response('not found', { status: 404 });
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows Sign in and Create account buttons when signed out', () => {
    useAuthMock.mockReturnValue({ isLoaded: true, isSignedIn: false });
    renderAppHeader();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    expect(screen.queryByTestId('user-button')).not.toBeInTheDocument();
  });

  it('shows the Clerk UserButton when signed in', () => {
    useAuthMock.mockReturnValue({
      isLoaded: true,
      isSignedIn: true,
      getToken: vi.fn().mockResolvedValue('tok'),
    });
    renderAppHeader();
    expect(screen.getByTestId('user-button')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^sign in$/i })).not.toBeInTheDocument();
  });

  it('shows a loading placeholder while Clerk is initializing', () => {
    useAuthMock.mockReturnValue({ isLoaded: false, isSignedIn: false });
    renderAppHeader();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /sign in/i })).not.toBeInTheDocument();
  });

  it('opens the AuthDialog in sign-in mode when Sign in is clicked', async () => {
    useAuthMock.mockReturnValue({ isLoaded: true, isSignedIn: false });
    renderAppHeader();
    await userEvent.click(screen.getByRole('button', { name: /^sign in$/i }));
    expect(screen.getByRole('dialog', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByTestId('sign-in-component')).toBeInTheDocument();
  });

  it('opens the AuthDialog in sign-up mode when Create account is clicked', async () => {
    useAuthMock.mockReturnValue({ isLoaded: true, isSignedIn: false });
    renderAppHeader();
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));
    expect(screen.getByRole('dialog', { name: /sign up/i })).toBeInTheDocument();
    expect(screen.getByTestId('sign-up-component')).toBeInTheDocument();
  });
});
