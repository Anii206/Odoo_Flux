const API_BASE = 'http://localhost:3000/api';

export function getToken(): string | null {
  return localStorage.getItem('brightloop_token');
}

export function setToken(token: string) {
  localStorage.setItem('brightloop_token', token);
}

export function removeToken() {
  localStorage.removeItem('brightloop_token');
}

export async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.error || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}
