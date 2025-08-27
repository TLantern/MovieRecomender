import { useState, useEffect } from 'react';

export function useSession() {
  const [sessionId, setSessionId] = useState<string>('');

  useEffect(() => {
    // Generate or retrieve session ID
    let currentSessionId = sessionStorage.getItem('movieRecommenderSession');
    
    if (!currentSessionId) {
      currentSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('movieRecommenderSession', currentSessionId);
    }
    
    setSessionId(currentSessionId);
  }, []);

  return { sessionId };
} 