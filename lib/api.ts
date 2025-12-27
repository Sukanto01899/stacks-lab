import { env } from './config';
import { ApiResponse } from '@/types';

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${env.NEXT_PUBLIC_API_URL}${endpoint}`;
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    const response = await fetch(url, {
        ...options,
        headers,
    });

    if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<T>;
}

// Example endpoints with specific return types could be added here
export const api = {
    getProfile: (handle: string) => apiFetch<any>(`/profiles/${handle}`), // TODO: Define Profile type
    getMessages: (conversationId: string) => apiFetch<any>(`/messages/${conversationId}`),
    sendMessage: (conversationId: string, content: any) => apiFetch<any>(`/messages/${conversationId}`, {
        method: 'POST',
        body: JSON.stringify(content)
    }),
};
