const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

type Extra = { headers?: Record<string, string> };

/**
 * GET helper
 */
export async function apiGet<T>(path: string, extra: Extra = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    cache: "no-store",
    headers: extra.headers,
  });

  if (!res.ok) {
    throw new Error(`GET ${path} failed with ${res.status}`);
  }

  return res.json();
}

/**
 * POST helper
 */
export async function apiPost<T>(
  path: string,
  body: unknown,
  extra: Extra = {}
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(extra.headers ?? {}),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`POST ${path} failed with ${res.status}`);
  }

  return res.json();
}

export async function apiPatch<T>(
  path: string,
  body: unknown,
  extra: Extra = {}
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...(extra.headers ?? {}) },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PATCH ${path} failed with ${res.status}`);
  return res.json();
}

export async function apiDelete(path: string, extra: Extra = {}): Promise<void> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "DELETE",
    headers: extra.headers,
  });
  if (!res.ok) throw new Error(`DELETE ${path} failed with ${res.status}`);
}