const API_BASE = import.meta.env.VITE_API_URL || '/api';

interface ApiOptions {
    method?: string;
    body?: any;
    headers?: Record<string, string>;
}

/**
 * Centralized API client with cookie-based authentication.
 */
async function apiRequest<T = any>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    const { method = 'GET', body, headers = {} } = options;

    const config: RequestInit = {
        method,
        credentials: 'include', // Send cookies
        headers: {
            'Content-Type': 'application/json',
            ...headers,
        },
    };

    if (body && method !== 'GET') {
        config.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || `Request failed with status ${response.status}`);
    }

    return data;
}

export const api = {
    get: <T = any>(endpoint: string) => apiRequest<T>(endpoint),
    post: <T = any>(endpoint: string, body?: any) => apiRequest<T>(endpoint, { method: 'POST', body }),
    put: <T = any>(endpoint: string, body?: any) => apiRequest<T>(endpoint, { method: 'PUT', body }),
    delete: <T = any>(endpoint: string) => apiRequest<T>(endpoint, { method: 'DELETE' }),
};

export default api;
