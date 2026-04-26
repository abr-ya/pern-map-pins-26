import { SignIn, SignUp } from '@clerk/react';
import { useEffect, useState } from 'react';

export type AuthDialogMode = 'sign-in' | 'sign-up';

export interface AuthDialogProps {
  open: boolean;
  initialMode?: AuthDialogMode;
  onClose: () => void;
}

/**
 * Modal that hosts Clerk's prebuilt {@link SignIn} / {@link SignUp} components
 * (which already render the "Continue with Google" button when Google OAuth
 * is enabled in the Clerk dashboard — no extra wiring needed; FR-003).
 *
 * `routing="virtual"` keeps the URL stable so the underlying `MapPage`
 * is not unmounted while authenticating (per US2 acceptance criterion 2).
 */
export function AuthDialog({ open, initialMode = 'sign-in', onClose }: AuthDialogProps): JSX.Element | null {
  const [mode, setMode] = useState<AuthDialogMode>(initialMode);

  useEffect(() => {
    if (open) setMode(initialMode);
  }, [open, initialMode]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={mode === 'sign-in' ? 'Sign in' : 'Sign up'}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div className="max-h-full overflow-y-auto" onClick={(event) => event.stopPropagation()}>
        <div className="mb-3 flex justify-center gap-2 text-sm">
          <button
            type="button"
            onClick={() => setMode('sign-in')}
            className={`rounded px-3 py-1 ${
              mode === 'sign-in' ? 'bg-white text-slate-900' : 'bg-white/10 text-white hover:bg-white/20'
            }`}
            aria-pressed={mode === 'sign-in'}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => setMode('sign-up')}
            className={`rounded px-3 py-1 ${
              mode === 'sign-up' ? 'bg-white text-slate-900' : 'bg-white/10 text-white hover:bg-white/20'
            }`}
            aria-pressed={mode === 'sign-up'}
          >
            Create account
          </button>
        </div>
        {mode === 'sign-in' ? (
          <SignIn routing="virtual" signUpUrl="" />
        ) : (
          <SignUp routing="virtual" signInUrl="" />
        )}
      </div>
    </div>
  );
}
