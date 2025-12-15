"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from '@/hooks/useSession';
import { joinSession, generateRecommendations, castVote } from '@/lib/api';
import { mutate } from 'swr';
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

    const handleVote = async (businessId: string, score: number) => {
        if (!participantId) return;
        try {
            await castVote(sessionId, {
                participant_id: participantId,
                venue_id: businessId,
                score,
            });
            // Trigger refresh
            mutate(sessionId ? `/sessions/${sessionId}` : null);
        } catch (error) {
            console.error("Failed to vote", error);
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
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 p-2 border text-gray-900 bg-white placeholder-gray-500"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Dietary Restrictions</label>
                            <input
                                type="text"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 p-2 border text-gray-900 bg-white placeholder-gray-500"
                                placeholder="e.g. Vegan, Gluten-Free"
                                value={dietary}
                                onChange={(e) => setDietary(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Cuisine Preferences</label>
                            <input
                                type="text"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 p-2 border text-gray-900 bg-white placeholder-gray-500"
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
        const sortedRecommendations = [...recommendations].sort((a: any, b: any) => {
            if (b.score !== a.score) return b.score - a.score;
            return b.vote_count - a.vote_count;
        });

        const isHost = participants.find((p: any) => p.id === participantId)?.is_host;

        const handleBook = async (businessId: string) => {
            if (!confirm("Have AI Agent call restaurant to book a table?")) return;
            try {
                // Optimistic update or just trigger loading?
                // For simplicity, trigger, then wait for revalidation. 
                // However, since we poll with SWR, we can just Mutate immediately to show loading if we had local state,
                // but session.booking_status comes from server.
                // We'll trust the fast response or optimistic UI.
                await import('@/lib/api').then(m => m.bookReservation(sessionId, businessId));
                mutate(sessionId ? `/sessions/${sessionId}` : null);
            } catch (e) {
                alert("Booking failed");
            }
        };

        return (
            <div className="min-h-screen bg-orange-50 p-4">
                <div className="max-w-md mx-auto">
                    <h1 className="text-2xl font-bold text-center mb-6">Vote for your favorite!</h1>

                    {session.conflict_analysis?.has_conflicts && (
                        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6 rounded-r-lg shadow-sm">
                            <h3 className="font-bold text-amber-800 flex items-center">
                                ⚠️ Preference Conflicts Detected
                            </h3>
                            <div className="mt-2 text-sm text-amber-800">
                                <ul className="list-disc list-inside mb-2">
                                    {session.conflict_analysis.conflicts.map((c: string, i: number) => (
                                        <li key={i}>{c}</li>
                                    ))}
                                </ul>
                                <p className="font-medium italic">
                                    Suggestion: {session.conflict_analysis.resolution}
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="space-y-4">
                            {sortedRecommendations.map((rec: any, index: number) => {
                                const isWinner = index === 0;
                                return (
                                    <div
                                        key={rec.id}
                                        className={`bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-500 ${isWinner ? 'border-2 border-yellow-400 ring-4 ring-yellow-400/20 scale-[1.02]' : ''}`}
                                    >
                                        {rec.image_url && (
                                            <div className="relative h-48">
                                                <img src={rec.image_url} alt={rec.name} className="w-full h-full object-cover" />
                                                <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full font-bold backdrop-blur-sm">
                                                    #{index + 1}
                                                </div>
                                                {isWinner && (
                                                    <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full font-bold shadow-lg flex items-center gap-1 animate-bounce">
                                                        🏆 Current Leader
                                                    </div>
                                                )}
                                            </div>
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

                                            <div className="bg-blue-50 p-3 rounded-lg mb-3">
                                                <p className="text-sm text-blue-800 italic mb-2">
                                                    " {rec.ai_reasoning} "
                                                </p>

                                                {rec.why_picked && (
                                                    <div className="mt-2 text-sm text-blue-900 border-t border-blue-100 pt-2">
                                                        <strong>Why this works:</strong> {rec.why_picked}
                                                    </div>
                                                )}
                                            </div>

                                            {rec.trade_offs && rec.trade_offs.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mb-4">
                                                    {rec.trade_offs.map((tradeoff: string, i: number) => (
                                                        <span key={i} className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-medium border border-gray-200">
                                                            ⚖️ {tradeoff}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Booking UI - Only for Winner */}
                                            {isWinner && (
                                                <div className="mb-4">
                                                    {session.booking_status === 'booked' ? (
                                                        <div className="bg-green-100 text-green-800 p-3 rounded-lg border border-green-200">
                                                            <div className="font-bold flex items-center">✅ Reservation Confirmed</div>
                                                            <div className="text-sm mt-1">Ref: {session.booking_reference}</div>
                                                            <div className="text-xs mt-1 italic">"{session.booking_message}"</div>
                                                        </div>
                                                    ) : session.booking_status === 'busy' ? (
                                                        <div className="bg-red-50 text-red-800 p-3 rounded-lg border border-red-200">
                                                            <div className="font-bold">❌ Availability Issue</div>
                                                            <div className="text-sm mt-1 italic">"{session.booking_message}"</div>
                                                            {isHost && (
                                                                <button
                                                                    onClick={() => handleBook(rec.business_id)}
                                                                    className="mt-2 text-xs bg-red-100 hover:bg-red-200 px-2 py-1 rounded"
                                                                >
                                                                    Retry AI Agent
                                                                </button>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        isHost && (
                                                            <button
                                                                onClick={() => handleBook(rec.business_id)}
                                                                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-lg font-bold shadow-md hover:shadow-lg transform transition active:scale-95 flex items-center justify-center gap-2"
                                                            >
                                                                ✨ Have AI Book This Table
                                                            </button>
                                                        )
                                                    )}
                                                </div>
                                            )}

                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleVote(rec.business_id, -1)}
                                                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 rounded-lg font-medium transition-colors"
                                                >
                                                    Nah ({rec.vote_count > 0 ? (rec.vote_count - rec.score) / 2 : 0})
                                                </button>
                                                <button
                                                    onClick={() => handleVote(rec.business_id, 1)}
                                                    className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                                >
                                                    Love it!
                                                    {rec.score > 0 && (
                                                        <span className="bg-white/20 px-2 py-0.5 rounded text-sm">
                                                            {Math.max(0, (rec.score + rec.vote_count) / 2)}
                                                        </span>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // State 2: Lobby
    return (
        <div className="min-h-screen bg-orange-50 p-4">
            <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-orange-500 p-6 text-white flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold">{session.location}</h1>
                        <p className="opacity-90">Host: {session.host_name}</p>
                        {session.scheduled_time && (
                            <div className="mt-2 flex items-center text-sm bg-orange-600/50 px-2 py-1 rounded inline-block">
                                <span className="mr-1">📅</span>
                                {new Date(session.scheduled_time).toLocaleString([], {
                                    weekday: 'short', month: 'short', day: 'numeric',
                                    hour: '2-digit', minute: '2-digit'
                                })}
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => {
                            localStorage.removeItem(`session_${sessionId}_participant`);
                            setParticipantId(null);
                            window.location.reload();
                        }}
                        className="text-xs bg-orange-600 hover:bg-orange-700 text-white px-2 py-1 rounded border border-orange-400"
                    >
                        Leave
                    </button>
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

                    {/* Invite Section */}
                    <div className="bg-orange-50 p-3 rounded-lg flex items-center justify-between mb-4 border border-orange-100">
                        <div className="text-sm text-orange-800 font-medium">
                            Invite friends to join!
                        </div>
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(window.location.href);
                                alert("Link copied to clipboard! Share it with friends.");
                            }}
                            className="text-xs bg-white text-orange-600 px-3 py-1.5 rounded shadow-sm border border-orange-200 font-bold hover:bg-orange-50 active:scale-95 transition-all"
                        >
                            Copy Link 🔗
                        </button>
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
