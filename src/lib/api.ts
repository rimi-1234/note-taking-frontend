import { ApiError, type ApiErrorBody } from './types';

export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api').replace(/\/$/, '');

const REQUEST_TIMEOUT_MS = 15_000;

/** fetch that gives up after REQUEST_TIMEOUT_MS so a hung connection surfaces as an error instead of spinning forever. */
async function request(url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, { ...init, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  } catch (err) {
    if (err instanceof DOMException && (err.name === 'TimeoutError' || err.name === 'AbortError')) {
      throw new ApiError(0, 'TIMEOUT', 'The server took too long to respond. Check your connection and try again.');
    }
    throw err;
  }
}

type TokenStore = {
  getAccessToken: () => string | null;
  setAccessToken: (token: string | null) => void;
  onSessionLost?: () => void;
};

let tokenStore: TokenStore = {
  getAccessToken: () => null,
  setAccessToken: () => undefined,
};

let refreshPromise: Promise<string | null> | null = null;

export function configureApi(store: TokenStore) {
  tokenStore = store;
}

async function parseError(res: Response): Promise<ApiError> {
  try {
    const body = (await res.json()) as ApiErrorBody;
    return new ApiError(
      res.status,
      body.error?.code ?? 'UNKNOWN',
      body.error?.message ?? res.statusText,
      body.error?.details,
    );
  } catch {
    return new ApiError(res.status, 'UNKNOWN', res.statusText || 'Request failed');
  }
}

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const res = await request(buildUrl('/auth/refresh'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
      });
      if (!res.ok) {
        tokenStore.setAccessToken(null);
        tokenStore.onSessionLost?.();
        return null;
      }
      const body = (await res.json()) as { accessToken: string };
      tokenStore.setAccessToken(body.accessToken);
      return body.accessToken;
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export type ApiOptions = {
  method?: string;
  body?: unknown;
  query?: Record<string, string | number | undefined | null>;
  auth?: boolean;
  retry?: boolean;
};

function buildUrl(path: string, query?: ApiOptions['query']) {
  const target = path.startsWith('http') ? path : `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const url = new URL(target, typeof window === 'undefined' ? 'http://localhost' : window.location.origin);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === '') continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, query, auth = true, retry = true } = options;
  const headers: Record<string, string> = {
    'X-Requested-With': 'XMLHttpRequest',
  };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (auth) {
    const token = tokenStore.getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await request(buildUrl(path, query), {
    method,
    credentials: 'include',
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (res.status === 401 && auth && retry) {
    const next = await refreshAccessToken();
    if (next) {
      return api<T>(path, { ...options, retry: false });
    }
  }

  if (res.status === 204) {
    return undefined as T;
  }

  if (!res.ok) {
    throw await parseError(res);
  }

  return (await res.json()) as T;
}

export async function loginRequest(email: string, password: string) {
  return api<{ accessToken: string; user: import('./types').PublicUser }>('/auth/login', {
    method: 'POST',
    body: { email, password },
    auth: false,
  });
}

export async function logoutRequest() {
  try {
    await api<void>('/auth/logout', { method: 'POST' });
  } catch {
    // Still clear local session even if the cookie was already gone.
  }
}

export async function refreshRequest() {
  return api<{ accessToken: string; user: import('./types').PublicUser }>('/auth/refresh', {
    method: 'POST',
    auth: false,
  });
}
