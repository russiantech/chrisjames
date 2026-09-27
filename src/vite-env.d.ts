/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Backend origin, e.g. https://chrisjames-backend.vercel.app — unset in dev (uses the proxy instead). */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
