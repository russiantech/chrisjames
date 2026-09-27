import type { ApiError, TokenPair } from './types';

// Empty in dev (VITE_API_URL unset) → BASE is just '/api/v1', which Vite's
// dev-server proxy (vite.config.ts) forwards to the local backend — nothing
// changes for local development. In production, VITE_API_URL is set to the
// deployed backend's origin (see .env.production), because the frontend and
// backend are two separate Vercel deployments on two different domains —
// a relative path would resolve against the frontend's own origin instead.
const API_ROOT = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');
const BASE = `${API_ROOT}/api/v1`;
const ACCESS_KEY = 'cj.access';
const REFRESH_KEY = 'cj.refresh';

/** In-memory mirror of the tokens, so reads do not hit storage every call. */
let accessToken: string | null = null;
let refreshToken: string | null = null;

function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    // Private browsing and blocked storage both throw here.
    return null;
  }
}

function writeStorage(key: string, value: string | null): void {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    /* session-only is an acceptable fallback */
  }
}

accessToken = readStorage(ACCESS_KEY);
refreshToken = readStorage(REFRESH_KEY);

type Listener = (token: string | null) => void;
const listeners = new Set<Listener>();

export function onAuthChange(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setTokens(tokens: TokenPair | null): void {
  accessToken = tokens?.access_token ?? null;
  refreshToken = tokens?.refresh_token ?? null;
  writeStorage(ACCESS_KEY, accessToken);
  writeStorage(REFRESH_KEY, refreshToken);
  listeners.forEach((listener) => listener(accessToken));
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function isSignedIn(): boolean {
  return accessToken !== null;
}

export class HttpError extends Error implements ApiError {
  code: string;
  detail: string;
  details?: { field: string; message: string }[] | null;
  request_id?: string | null;
  status: number;

  constructor(status: number, body: Partial<ApiError>) {
    super(body.detail ?? 'Something went wrong.');
    this.name = 'HttpError';
    this.status = status;
    this.code = body.code ?? 'error';
    this.detail = body.detail ?? 'Something went wrong.';
    this.details = body.details ?? null;
    this.request_id = body.request_id ?? null;
  }

  /** The message for a given form field, when the API sent field errors. */
  fieldError(field: string): string | undefined {
    return this.details?.find((entry) => entry.field === field)?.message;
  }

  /** A single readable string combining the summary and every field detail. */
  describe(): string {
    if (!this.details || this.details.length === 0) return this.detail;
    const fields = this.details.map((entry) => `${entry.field}: ${entry.message}`).join(' · ');
    return `${this.detail} (${fields})`;
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  /** Set for the refresh call itself, to stop it recursing. */
  skipRefresh?: boolean;
  query?: Record<string, string | number | boolean | undefined | null | string[]>;
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = `${BASE}${path}`;
  if (!query) return url;

  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value)) value.forEach((item) => params.append(key, item));
    else params.set(key, String(value));
  });
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

/** One in-flight refresh at a time; parallel 401s all wait on the same promise. */
let refreshInFlight: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  if (!refreshToken) return false;
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      const response = await fetch(`${BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (!response.ok) {
        setTokens(null);
        return false;
      }
      setTokens((await response.json()) as TokenPair);
      return true;
    } catch {
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, skipRefresh, query, headers, ...rest } = options;

  const isFormData = body instanceof FormData;
  const finalHeaders: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...((headers as Record<string, string>) ?? {}),
  };
  if (accessToken) finalHeaders.Authorization = `Bearer ${accessToken}`;

  const response = await fetch(buildUrl(path, query), {
    ...rest,
    headers: finalHeaders,
    body: isFormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
  });

  // An expired access token gets one silent retry before the user sees anything.
  if (response.status === 401 && !skipRefresh && refreshToken) {
    if (await refreshAccessToken()) {
      return request<T>(path, { ...options, skipRefresh: true });
    }
  }

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  const payload = text ? safeParse(text) : null;

  if (!response.ok) {
    throw new HttpError(response.status, (payload ?? {}) as Partial<ApiError>);
  }
  return payload as T;
}

function safeParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return { detail: text };
  }
}

/** A readable message for any caught error — field-specific when the API sent one. */
export function describeError(error: unknown): string {
  if (error instanceof HttpError) return error.describe();
  return error instanceof Error ? error.message : 'Something went wrong.';
}

export const api = {
  get: <T>(path: string, query?: RequestOptions['query']) =>
    request<T>(path, { method: 'GET', query }),
  post: <T>(path: string, body?: unknown, query?: RequestOptions['query']) =>
    request<T>(path, { method: 'POST', body, query }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }),
  delete: <T>(path: string, query?: RequestOptions['query']) =>
    request<T>(path, { method: 'DELETE', query }),
  upload: <T>(path: string, form: FormData) =>
    request<T>(path, { method: 'POST', body: form }),
};
