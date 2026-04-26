import { ClerkProvider } from '@clerk/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'leaflet/dist/leaflet.css';
import App from './App';
import { createQueryClient } from './lib/queryClient';
import './index.css';

const queryClient = createQueryClient();

// Base64 of `example.clerk.example.dev$` — the documented test placeholder
// shape Clerk's parser accepts. Used only as a non-functional fallback so the
// guest map (US1) keeps rendering before real Clerk keys are wired locally.
const CLERK_DEV_PLACEHOLDER = 'pk_test_ZXhhbXBsZS5jbGVyay5leGFtcGxlLmRldiQ';

const envKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const clerkPublishableKey = envKey && envKey.trim() ? envKey : null;

if (!clerkPublishableKey) {
  if (import.meta.env.PROD) {
    throw new Error(
      'VITE_CLERK_PUBLISHABLE_KEY is not set; configure it in the deploy environment',
    );
  }
  console.warn(
    '[clerk] VITE_CLERK_PUBLISHABLE_KEY missing — using a non-functional placeholder. ' +
      'Sign-in will not work until you set the real key in frontend/.env.',
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider publishableKey={clerkPublishableKey ?? CLERK_DEV_PLACEHOLDER} afterSignOutUrl="/">
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </ClerkProvider>
  </StrictMode>,
);
