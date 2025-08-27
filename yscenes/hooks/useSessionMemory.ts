import { useState, useEffect } from 'react';
import { useSession } from './useSession';

interface Movie {
  title: string;
  year: number;
}

export function useSessionMemory() {
  const { sessionId } = useSession();
  const [recommendedMovies, setRecommendedMovies] = useState<Movie[]>([]);

  // Load existing recommendations from session storage
  useEffect(() => {
    if (sessionId) {
      const stored = sessionStorage.getItem(`movieMemory_${sessionId}`);
      if (stored) {
        try {
          setRecommendedMovies(JSON.parse(stored));
        } catch (e) {
          console.error('Failed to parse stored movie memory:', e);
        }
      }
    }
  }, [sessionId]);

  // Save recommendations to session storage
  const addMovies = (movies: Movie[]) => {
    const newMovies = [...recommendedMovies, ...movies];
    setRecommendedMovies(newMovies);
    
    if (sessionId) {
      sessionStorage.setItem(`movieMemory_${sessionId}`, JSON.stringify(newMovies));
    }
  };

  // Clear session memory (useful for new sessions)
  const clearMemory = () => {
    setRecommendedMovies([]);
    if (sessionId) {
      sessionStorage.removeItem(`movieMemory_${sessionId}`);
    }
  };

  // Get all recommended movies for exclusion
  const getExclusionList = () => recommendedMovies;

  return {
    recommendedMovies,
    addMovies,
    clearMemory,
    getExclusionList,
    sessionId
  };
} 