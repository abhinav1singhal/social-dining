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

export const castVote = async (sessionId: string, data: { participant_id: string; venue_id: string; score: number }) => {
    const response = await api.post(`/sessions/${sessionId}/vote`, data);
    return response.data;
};

export const bookReservation = async (sessionId: string, businessId: string) => {
    const response = await api.post(`/sessions/${sessionId}/book`, { business_id: businessId });
    return response.data;
};
