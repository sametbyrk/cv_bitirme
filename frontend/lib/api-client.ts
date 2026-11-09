import { cookies } from 'next/headers';

const API_BASE_URL = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';

export class ApiError extends Error {
    public status: number;
    public data: unknown;

    constructor(message: string, status: number, data?: unknown) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.data = data;
    }
}

/**
 * Server Component / Server Action'lardan FastAPI backend'ine istek atan merkezi istemci.
 * 'session' çerezindeki JWT'yi Authorization: Bearer <token> başlığına ekler.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function fetchWithAuth<T = unknown>(endpoint: string, options: RequestInit = {}): Promise<T | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;

    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
        ...options,
        headers,
        cache: 'no-store', // Her zaman taze veri
    });

    if (!response.ok) {
        let errorData: unknown = null;
        let errorMessage = `API Error: ${response.status} ${response.statusText}`;

        try {
            errorData = await response.json() as unknown;
            if (isRecord(errorData) && errorData.detail !== undefined) {
                errorMessage = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
            }
        } catch {
            // response body JSON değilse
        }

        throw new ApiError(errorMessage, response.status, errorData);
    }

    if (response.status === 204) {
        return null;
    }

    return await response.json() as T;
}

export const api = {
    get: <T = unknown>(endpoint: string, options?: RequestInit) => fetchWithAuth<T>(endpoint, { ...options, method: 'GET' }),
    post: <T = unknown>(endpoint: string, body?: unknown, options?: RequestInit) =>
        fetchWithAuth<T>(endpoint, {
            ...options,
            method: 'POST',
            body: body ? JSON.stringify(body) : undefined,
        }),
    patch: <T = unknown>(endpoint: string, body?: unknown, options?: RequestInit) =>
        fetchWithAuth<T>(endpoint, {
            ...options,
            method: 'PATCH',
            body: body ? JSON.stringify(body) : undefined,
        }),
    delete: (endpoint: string, options?: RequestInit) => fetchWithAuth(endpoint, { ...options, method: 'DELETE' }),
};
