import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const createSession = async (data: { host_name: string; location: string; scheduled_time?: string }) => {
    const response = await api.post('/sessions', data);
    return response.data;
};

export const joinSession = async (sessionId: string, data: { name: string; dietary_restrictions?: string; cuisine_preferences?: string; budget_tier?: string; vibe?: string }) => {
    const response = await api.post(`/sessions/${sessionId}/join`, data);
    return response.data;
};

export const generateRecommendations = async (sessionId: string) => {
    const response = await api.post(`/sessions/${sessionId}/generate`);
    return response.data;
};
