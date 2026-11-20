import { getApiUrl } from '../config/env';

export interface ApiFetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
  timeoutMs?: number;
}

const PUBLIC_AUTH_ENDPOINTS = ['/api/login', '/api/signup', '/api/forgot-password', '/api/reset-password'];

/**
 * Enhanced fetch wrapper for the application:
 * 1. Automatically prepends VITE_API_BASE_URL (if configured)
 * 2. Automatically includes credentials (cookies) and Bearer token
 * 3. Handles Render cold-start timeouts (35s default) and expired 401 sessions
 */
export async function apiFetch(endpoint: string, options: ApiFetchOptions = {}): Promise<Response> {
  const { params, timeoutMs = 35000, signal: callerSignal, ...fetchInit } = options;
  let url = getApiUrl(endpoint);

  // Append query params if provided
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  const defaultHeaders: Record<string, string> = {};
  if (fetchInit.body && !(fetchInit.body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  // Include Bearer token from localStorage for seamless cross-domain auth across Render subdomains
  let hadToken = false;
  if (typeof window !== 'undefined') {
    try {
      const token = localStorage.getItem('redhill_auth_token');
      if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
        hadToken = true;
      }
    } catch {
      // Ignore storage access errors in strict private browsing
    }
  }

  const controller = new AbortController();
  const timeoutId = typeof window !== 'undefined' ? window.setTimeout(() => controller.abort(), timeoutMs) : null;
  if (callerSignal) {
    if (callerSignal.aborted) controller.abort();
    else callerSignal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  const finalOptions: RequestInit = {
    credentials: 'include', // Ensures session cookie is sent across Render domains
    ...fetchInit,
    signal: controller.signal,
    headers: {
      ...defaultHeaders,
      ...fetchInit.headers,
    },
  };

  try {
    const res = await fetch(url, finalOptions);
    if (res.status === 401 && hadToken && !PUBLIC_AUTH_ENDPOINTS.some(p => endpoint.startsWith(p))) {
      try {
        localStorage.removeItem('redhill_auth_token');
      } catch {
        // ignore storage errors
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('redhill:unauthorized'));
      }
    }
    return res;
  } finally {
    if (timeoutId !== null) window.clearTimeout(timeoutId);
  }
}

/**
 * Standardized JSON API Client helper with error parsing
 */
export const apiClient = {
  async get<T = any>(endpoint: string, options: ApiFetchOptions = {}): Promise<T> {
    const res = await apiFetch(endpoint, { ...options, method: 'GET' });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(errorData.error || `GET ${endpoint} failed with status ${res.status}`);
    }
    return res.json();
  },

  async post<T = any>(endpoint: string, body?: any, options: ApiFetchOptions = {}): Promise<T> {
    const res = await apiFetch(endpoint, {
      ...options,
      method: 'POST',
      body: body instanceof FormData ? body : (body ? JSON.stringify(body) : undefined),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(errorData.error || `POST ${endpoint} failed with status ${res.status}`);
    }
    return res.json();
  },

  async patch<T = any>(endpoint: string, body?: any, options: ApiFetchOptions = {}): Promise<T> {
    const res = await apiFetch(endpoint, {
      ...options,
      method: 'PATCH',
      body: body instanceof FormData ? body : (body ? JSON.stringify(body) : undefined),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(errorData.error || `PATCH ${endpoint} failed with status ${res.status}`);
    }
    return res.json();
  },

  async put<T = any>(endpoint: string, body?: any, options: ApiFetchOptions = {}): Promise<T> {
    const res = await apiFetch(endpoint, {
      ...options,
      method: 'PUT',
      body: body instanceof FormData ? body : (body ? JSON.stringify(body) : undefined),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(errorData.error || `PUT ${endpoint} failed with status ${res.status}`);
    }
    return res.json();
  },

  async delete<T = any>(endpoint: string, options: ApiFetchOptions = {}): Promise<T> {
    const res = await apiFetch(endpoint, { ...options, method: 'DELETE' });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(errorData.error || `DELETE ${endpoint} failed with status ${res.status}`);
    }
    return res.json();
  },

  async upload<T = any>(endpoint: string, formData: FormData, options: ApiFetchOptions = {}): Promise<T> {
    const res = await apiFetch(endpoint, {
      ...options,
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(errorData.error || `Upload to ${endpoint} failed with status ${res.status}`);
    }
    return res.json();
  },
};
