const raw = import.meta.env.VITE_API_URL ?? '';
const base = typeof raw === 'string' ? raw.replace(/\/$/, '') : '';

/**
 * Full URL to the JSON API, e.g. `GET ${apiUrl('/api/health')}`.
 */
export function apiUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

export async function apiGet<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(apiUrl(path), {
    ...init,
    method: 'GET',
    headers: { accept: 'application/json', ...init?.headers },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export async function apiGetJson<T>(path: string, token: string | null, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { accept: 'application/json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(apiUrl(path), {
    ...init,
    method: 'GET',
    headers: { ...headers, ...init?.headers },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export async function apiPostJson<T>(
  path: string,
  token: string | null,
  body: unknown,
  init?: RequestInit,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    accept: 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(apiUrl(path), {
    ...init,
    method: 'POST',
    headers: { ...headers, ...init?.headers },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

/** POST without JSON body (e.g. photo-upload authorize). */
export async function apiPostEmpty<T>(path: string, token: string | null, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { accept: 'application/json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(apiUrl(path), {
    ...init,
    method: 'POST',
    headers: { ...headers, ...init?.headers },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export async function apiPatchJson<T>(
  path: string,
  token: string | null,
  body: unknown,
  init?: RequestInit,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    accept: 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(apiUrl(path), {
    ...init,
    method: 'PATCH',
    headers: { ...headers, ...init?.headers },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export async function apiPutJson<T>(
  path: string,
  token: string | null,
  body: unknown,
  init?: RequestInit,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    accept: 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(apiUrl(path), {
    ...init,
    method: 'PUT',
    headers: { ...headers, ...init?.headers },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export async function apiDelete(path: string, token: string | null, init?: RequestInit): Promise<void> {
  const headers: Record<string, string> = { accept: 'application/json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(apiUrl(path), {
    ...init,
    method: 'DELETE',
    headers: { ...headers, ...init?.headers },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }
}
