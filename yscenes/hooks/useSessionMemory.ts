import { useState, useEffect, useCallback } from 'react';
import { useSession } from './useSession';

interface Movie {
  title: string;
  year: number;
}

export function useSessionMemory() {
  const { 
    sessionId, 
    isExpired, 
    startNewSession, 
    clearSession,
    getSessionStatus 
  } = useSession();
  const [recommendedMovies, setRecommendedMovies] = useState<Movie[]>([]);

  // Load existing recommendations from session storage
  useEffect(() => {
    if (sessionId && !isExpired) {
      const stored = sessionStorage.getItem(`movieMemory_${sessionId}`);
      if (stored) {
        try {
          setRecommendedMovies(JSON.parse(stored));
        } catch (e) {
          console.error('Failed to parse stored movie memory:', e);
          setRecommendedMovies([]);
        }
      } else {
        setRecommendedMovies([]);
      }
    } else if (isExpired) {
      // Session expired, clear memory
      setRecommendedMovies([]);
    }
  }, [sessionId, isExpired]);

  // Auto-clear memory when session expires
  useEffect(() => {
    if (isExpired) {
      console.log('Session expired, clearing movie memory');
      setRecommendedMovies([]);
      // Clear all movie memory from session storage
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('movieMemory_')) {
          sessionStorage.removeItem(key);
        }
      });
    }
  }, [isExpired]);

  // Save recommendations to session storage
  const addMovies = useCallback((movies: Movie[]) => {
    if (isExpired) {
      console.warn('Cannot add movies to expired session');
      return;
    }

    const newMovies = [...recommendedMovies, ...movies];
    setRecommendedMovies(newMovies);
    
    if (sessionId) {
      sessionStorage.setItem(`movieMemory_${sessionId}`, JSON.stringify(newMovies));
    }
  }, [recommendedMovies, sessionId, isExpired]);

  // Clear session memory (useful for new sessions)
  const clearMemory = useCallback(() => {
    setRecommendedMovies([]);
    if (sessionId) {
      sessionStorage.removeItem(`movieMemory_${sessionId}`);
    }
  }, [sessionId]);

  // Start fresh session with new memory
  const startFreshSession = useCallback(() => {
    clearMemory();
    const newSessionId = startNewSession();
    console.log('Started fresh session:', newSessionId);
    return newSessionId;
  }, [clearMemory, startNewSession]);

  // Get all recommended movies for exclusion
  const getExclusionList = useCallback(() => {
    if (isExpired) return [];
    return recommendedMovies;
  }, [recommendedMovies, isExpired]);

  // Get session statistics
  const getSessionStats = useCallback(() => {
    const status = getSessionStatus();
    return {
      sessionId,
      isExpired,
      movieCount: recommendedMovies.length,
      sessionAge: status.sessionAge,
      timeRemaining: status.timeRemaining,
      inactivityTime: status.inactivityTime
    };
  }, [sessionId, isExpired, recommendedMovies.length, getSessionStatus]);

  return {
    recommendedMovies,
    addMovies,
    clearMemory,
    getExclusionList,
    sessionId,
    isExpired,
    startFreshSession,
    getSessionStats,
    // Session management
    startNewSession,
    clearSession
  };
} 