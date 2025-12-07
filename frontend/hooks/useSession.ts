import useSWR from 'swr';
import { api } from '@/lib/api';

const fetcher = (url: string) => api.get(url).then((res) => res.data);

export const useSession = (sessionId: string) => {
    const { data, error, isLoading } = useSWR(
        sessionId ? `/sessions/${sessionId}` : null,
        fetcher,
        {
            refreshInterval: 3000, // Poll every 3 seconds
        }
    );

    return {
        session: data?.session,
        participants: data?.participants || [],
        recommendations: data?.recommendations || [],
        isLoading,
        isError: error,
    };
};
