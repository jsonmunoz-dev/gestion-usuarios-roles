// Cliente HTTP mínimo. El access token vive solo en memoria (no en localStorage)
// para reducir el impacto de un XSS; el refresh token va en una cookie httpOnly.
let accessToken = null;

export function setAccessToken(token) {
  accessToken = token;
}

export class ApiError extends Error {
  constructor(status, body) {
    super(body?.error || `Error ${status}`);
    this.status = status;
    this.details = body?.details;
  }
}

async function rawRequest(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  const res = await fetch(`/api${path}`, {
    method,
    headers,
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  return { res, data };
}

export async function refreshSession() {
  const { res, data } = await rawRequest('/auth/refresh', { method: 'POST' });
  if (!res.ok) {
    setAccessToken(null);
    throw new ApiError(res.status, data);
  }
  setAccessToken(data.accessToken);
  return data;
}

// Si el access token expiró, intenta renovarlo una vez y repite la petición.
export async function api(path, options) {
  let { res, data } = await rawRequest(path, options);
  if (res.status === 401 && accessToken && !path.startsWith('/auth/')) {
    await refreshSession();
    ({ res, data } = await rawRequest(path, options));
  }
  if (!res.ok) throw new ApiError(res.status, data);
  return data;
}
