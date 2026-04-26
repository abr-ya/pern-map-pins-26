import { UserButton, useAuth } from '@clerk/react';
import { useState } from 'react';
import { AuthDialog, type AuthDialogMode } from '../features/auth/AuthDialog';

/**
 * Top app bar with brand and a Sign in / Create account pair (signed-out)
 * or Clerk's `UserButton` with sign-out (signed-in).
 *
 * While the Clerk runtime is loading we render the buttons disabled to avoid
 * a flicker of "Sign in" for users with an existing session.
 */
export function AppHeader(): JSX.Element {
  const { isLoaded, isSignedIn } = useAuth();
  const [dialog, setDialog] = useState<{ open: boolean; mode: AuthDialogMode }>({
    open: false,
    mode: 'sign-in',
  });

  const open = (mode: AuthDialogMode): void => setDialog({ open: true, mode });
  const close = (): void => setDialog((prev) => ({ ...prev, open: false }));

  return (
    <header
      className="flex w-full items-center justify-between border-b border-slate-200 bg-white px-4 py-2"
      data-testid="app-header"
    >
      <div className="flex items-center gap-2">
        <span className="text-base font-semibold text-slate-900">Points on the Map</span>
      </div>
      <div className="flex items-center gap-2">
        {!isLoaded ? (
          <span className="text-xs text-slate-500">Loading…</span>
        ) : isSignedIn ? (
          <UserButton afterSignOutUrl="/" />
        ) : (
          <>
            <button
              type="button"
              onClick={() => open('sign-in')}
              className="rounded border border-slate-300 px-3 py-1 text-sm text-slate-800 hover:bg-slate-100"
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => open('sign-up')}
              className="rounded bg-slate-900 px-3 py-1 text-sm text-white hover:bg-slate-800"
            >
              Create account
            </button>
          </>
        )}
      </div>
      <AuthDialog open={dialog.open} initialMode={dialog.mode} onClose={close} />
    </header>
  );
}
