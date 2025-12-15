"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSession } from '@/lib/api';
import { Utensils, MapPin, Clock, ArrowRight } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [hostName, setHostName] = useState('');
  const [location, setLocation] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const session = await createSession({
        host_name: hostName,
        location,
        scheduled_time: scheduledTime ? new Date(scheduledTime).toISOString() : undefined
      });
      router.push(`/session/${session.id}`);
    } catch (error) {
      console.error("Failed to create session", error);
      alert("Failed to create session. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-orange-500 p-6 text-white text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-white p-3 rounded-full">
              <Utensils className="w-8 h-8 text-orange-500" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">Social Dining</h1>
          <p className="text-orange-100">Stop arguing, start eating.</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleCreateSession} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-400">@</span>
                </div>
                <input
                  type="text"
                  required
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 text-gray-900 bg-white placeholder-gray-500"
                  placeholder="Host Name"
                  value={hostName}
                  onChange={(e) => setHostName(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dining Location</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  required
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 text-gray-900 bg-white placeholder-gray-500"
                  placeholder="e.g. San Francisco, CA"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Clock className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="datetime-local"
                  required
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 text-gray-900 bg-white placeholder-gray-500"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 transition-colors"

            >
              {isLoading ? (
                <span>Creating...</span>
              ) : (
                <>
                  Start a Session <ArrowRight className="ml-2 w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      <p className="mt-8 text-gray-500 text-sm">
        Powered by Yelp AI • Hackathon Project
      </p>
    </div>
  );
}
