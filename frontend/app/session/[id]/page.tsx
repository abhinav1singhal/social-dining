"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from '@/hooks/useSession';
import { joinSession, generateRecommendations } from '@/lib/api';
import { Users, Utensils, Play, Loader2 } from 'lucide-react';

export default function SessionPage() {
    const params = useParams();
    const sessionId = params.id as string;
    const { session, participants, recommendations, isLoading } = useSession(sessionId);

    const [participantId, setParticipantId] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [dietary, setDietary] = useState('');
    const [cuisine, setCuisine] = useState('');
    const [isJoining, setIsJoining] = useState(false);

    useEffect(() => {
        // Check local storage for existing participant ID
        const stored = localStorage.getItem(`session_${sessionId}_participant`);
        if (stored) setParticipantId(stored);
    }, [sessionId]);

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsJoining(true);
        try {
            const p = await joinSession(sessionId, {
                name,
                dietary_restrictions: dietary,
                cuisine_preferences: cuisine,
            });
            setParticipantId(p.id);
            localStorage.setItem(`session_${sessionId}_participant`, p.id);
        } catch (error) {
            console.error("Failed to join", error);
            alert("Failed to join session.");
        } finally {
            setIsJoining(false);
        }
    };

    const handleStart = async () => {
        try {
            await generateRecommendations(sessionId);
        } catch (error) {
            console.error("Failed to start", error);
        }
    };

    if (isLoading || !session) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-orange-50">
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            </div>
        );
    }

    // State 1: Join Form
    if (!participantId) {
        return (
            <div className="min-h-screen bg-orange-50 p-4 flex items-center justify-center">
                <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6">
                    <h2 className="text-2xl font-bold mb-4 text-center">Join {session.host_name}'s Session</h2>
                    <p className="text-gray-500 text-center mb-6">at {session.location}</p>

                    <form onSubmit={handleJoin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Your Name</label>
                            <input
                                type="text"
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 p-2 border"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Dietary Restrictions</label>
                            <input
                                type="text"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 p-2 border"
                                placeholder="e.g. Vegan, Gluten-Free"
                                value={dietary}
                                onChange={(e) => setDietary(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Cuisine Preferences</label>
                            <input
                                type="text"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 p-2 border"
                                placeholder="e.g. Italian, Thai"
                                value={cuisine}
                                onChange={(e) => setCuisine(e.target.value)}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isJoining}
                            className="w-full bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50"
                        >
                            {isJoining ? 'Joining...' : 'Join Session'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // State 3: Voting / Results
    if (recommendations && recommendations.length > 0) {
        return (
            <div className="min-h-screen bg-orange-50 p-4">
                <div className="max-w-md mx-auto">
                    <h1 className="text-2xl font-bold text-center mb-6">Vote for your favorite!</h1>

                    <div className="space-y-4">
                        {recommendations.map((rec: any) => (
                            <div key={rec.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                                {rec.image_url && (
                                    <img src={rec.image_url} alt={rec.name} className="w-full h-48 object-cover" />
                                )}
                                <div className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <h2 className="text-xl font-bold">{rec.name}</h2>
                                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-bold">
                                            {rec.rating} ★
                                        </span>
                                    </div>
                                    <p className="text-gray-500 text-sm mb-3">
                                        {rec.price} • {rec.categories.join(', ')}
                                    </p>

                                    <div className="bg-blue-50 p-3 rounded-lg mb-4">
                                        <p className="text-sm text-blue-800 italic">
                                            " {rec.ai_reasoning} "
                                        </p>
                                    </div>

                                    <div className="flex gap-2">
                                        <button className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 rounded-lg font-medium transition-colors">
                                            Nah
                                        </button>
                                        <button className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-2 rounded-lg font-medium transition-colors">
                                            Love it!
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // State 2: Lobby
    return (
        <div className="min-h-screen bg-orange-50 p-4">
            <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-orange-500 p-6 text-white">
                    <h1 className="text-2xl font-bold">{session.location}</h1>
                    <p className="opacity-90">Host: {session.host_name}</p>
                </div>

                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold flex items-center">
                            <Users className="w-5 h-5 mr-2" /> Participants ({participants.length})
                        </h2>
                        <span className="text-sm text-gray-500">
                            {participants.length >= 10 ? 'Full' : 'Open'}
                        </span>
                    </div>

                    <ul className="space-y-2 mb-8">
                        {participants.map((p: any) => (
                            <li key={p.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold mr-3">
                                    {p.name[0].toUpperCase()}
                                </div>
                                <div>
                                    <div className="font-medium">{p.name}</div>
                                    <div className="text-xs text-gray-500">
                                        {[p.dietary_restrictions, p.cuisine_preferences].filter(Boolean).join(' • ')}
                                    </div>
                                </div>
                                {p.is_host && (
                                    <span className="ml-auto text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                                        Host
                                    </span>
                                )}
                            </li>
                        ))}
                    </ul>

                    {/* Only Host sees Start button */}
                    {participants.find((p: any) => p.id === participantId)?.is_host && (
                        <button
                            onClick={handleStart}
                            className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 flex items-center justify-center font-bold"
                        >
                            <Play className="w-5 h-5 mr-2" /> Generate Recommendations
                        </button>
                    )}

                    {!participants.find((p: any) => p.id === participantId)?.is_host && (
                        <div className="text-center text-gray-500 py-4 italic">
                            Waiting for host to start...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
