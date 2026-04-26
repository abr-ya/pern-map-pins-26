import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AppHeader } from './AppHeader';

const useAuthMock = vi.fn();

vi.mock('@clerk/react', () => ({
  useAuth: () => useAuthMock(),
  UserButton: () => <div data-testid="user-button">UserButton</div>,
  SignIn: () => <div data-testid="sign-in-component">SignIn</div>,
  SignUp: () => <div data-testid="sign-up-component">SignUp</div>,
}));

describe('AppHeader (T036)', () => {
  it('shows Sign in and Create account buttons when signed out', () => {
    useAuthMock.mockReturnValue({ isLoaded: true, isSignedIn: false });
    render(<AppHeader />);
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    expect(screen.queryByTestId('user-button')).not.toBeInTheDocument();
  });

  it('shows the Clerk UserButton when signed in', () => {
    useAuthMock.mockReturnValue({ isLoaded: true, isSignedIn: true });
    render(<AppHeader />);
    expect(screen.getByTestId('user-button')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^sign in$/i })).not.toBeInTheDocument();
  });

  it('shows a loading placeholder while Clerk is initializing', () => {
    useAuthMock.mockReturnValue({ isLoaded: false, isSignedIn: false });
    render(<AppHeader />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /sign in/i })).not.toBeInTheDocument();
  });

  it('opens the AuthDialog in sign-in mode when Sign in is clicked', async () => {
    useAuthMock.mockReturnValue({ isLoaded: true, isSignedIn: false });
    render(<AppHeader />);
    await userEvent.click(screen.getByRole('button', { name: /^sign in$/i }));
    expect(screen.getByRole('dialog', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByTestId('sign-in-component')).toBeInTheDocument();
  });

  it('opens the AuthDialog in sign-up mode when Create account is clicked', async () => {
    useAuthMock.mockReturnValue({ isLoaded: true, isSignedIn: false });
    render(<AppHeader />);
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));
    expect(screen.getByRole('dialog', { name: /sign up/i })).toBeInTheDocument();
    expect(screen.getByTestId('sign-up-component')).toBeInTheDocument();
  });
});
