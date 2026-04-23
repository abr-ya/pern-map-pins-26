const base = import.meta.env.VITE_API_URL.replace(/\/$/, '');

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
