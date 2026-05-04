/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CLERK_PUBLISHABLE_KEY: string;
  /** Empty or unset = same origin (Express serves the SPA and /api). */
  readonly VITE_API_URL?: string;
  readonly VITE_CLOUDINARY_CLOUD_NAME?: string;
  /** Set to true in `.env`/CI to log Clerk bootstrap and auth readiness in production builds. */
  readonly VITE_DEBUG_CLERK?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
