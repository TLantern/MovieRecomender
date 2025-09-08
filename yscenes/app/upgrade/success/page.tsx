'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../../components/navbar';

export default function SuccessPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (sessionId) {
      // Verify the session and activate subscription
      verifySession(sessionId);
    } else {
      setError('No session ID provided');
      setIsLoading(false);
    }
  }, [sessionId]);

  const verifySession = async (sessionId: string) => {
    try {
      const response = await fetch('/api/verify-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      });

      if (!response.ok) {
        throw new Error('Failed to verify session');
      }

      const data = await response.json();
      
      if (data.success) {
        setIsLoading(false);
      } else {
        setError(data.error || 'Failed to activate subscription');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error verifying session:', error);
      setError('Failed to verify payment');
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <Navbar />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-white text-lg">Activating your subscription...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <Navbar />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="text-6xl mb-6">❌</div>
            <h1 className="text-3xl font-bold text-white mb-4">
              Something went wrong
            </h1>
            <p className="text-gray-300 mb-8">{error}</p>
            <Link
              href="/upgrade"
              className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Try Again
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <Navbar />
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-6">🎉</div>
          <h1 className="text-3xl font-bold text-white mb-4">
            Welcome to Pro!
          </h1>
          <p className="text-gray-300 mb-8">
            Your subscription has been activated successfully. You now have unlimited access to all features!
          </p>
          
          <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-white mb-3">What's included:</h2>
            <ul className="text-left text-gray-300 space-y-2">
              <li className="flex items-center">
                <span className="text-green-400 mr-2">✓</span>
                Unlimited movie recommendations
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-2">✓</span>
                Save unlimited bookmarks
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-2">✓</span>
                Priority support
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-2">✓</span>
                Advanced filtering options
              </li>
            </ul>
          </div>

          <Link
            href="/"
            className="inline-block px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-lg hover:from-purple-600 hover:to-blue-700 transition-all duration-200 font-bold"
          >
            Start Exploring Movies
          </Link>
        </div>
      </div>
    </div>
  );
}
