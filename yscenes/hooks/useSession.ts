import { useState, useEffect, useCallback } from 'react';

interface SessionInfo {
  sessionId: string;
  startTime: number;
  lastActivity: number;
  isExpired: boolean;
  timeRemaining: number;
}

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds
const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes of inactivity

export function useSession() {
  const [sessionInfo, setSessionInfo] = useState<SessionInfo>({
    sessionId: '',
    startTime: 0,
    lastActivity: 0,
    isExpired: false,
    timeRemaining: SESSION_TIMEOUT
  });

  // Check if session should expire
  const checkSessionExpiry = useCallback(() => {
    const now = Date.now();
    const timeSinceStart = now - sessionInfo.startTime;
    const timeSinceLastActivity = now - sessionInfo.lastActivity;
    
    const isExpired = timeSinceStart > SESSION_TIMEOUT || timeSinceLastActivity > INACTIVITY_TIMEOUT;
    const timeRemaining = Math.max(0, SESSION_TIMEOUT - timeSinceStart);
    
    setSessionInfo(prev => ({
      ...prev,
      isExpired,
      timeRemaining
    }));

    return isExpired;
  }, [sessionInfo.startTime, sessionInfo.lastActivity]);

  // Update last activity time
  const updateActivity = useCallback(() => {
    setSessionInfo(prev => ({
      ...prev,
      lastActivity: Date.now()
    }));
  }, []);

  // Start a new session
  const startNewSession = useCallback(() => {
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();
    
    const newSessionInfo: SessionInfo = {
      sessionId: newSessionId,
      startTime: now,
      lastActivity: now,
      isExpired: false,
      timeRemaining: SESSION_TIMEOUT
    };
    
    setSessionInfo(newSessionInfo);
    sessionStorage.setItem('movieRecommenderSession', JSON.stringify(newSessionInfo));
    
    return newSessionId;
  }, []);

  // Clear current session
  const clearSession = useCallback(() => {
    sessionStorage.removeItem('movieRecommenderSession');
    setSessionInfo({
      sessionId: '',
      startTime: 0,
      lastActivity: 0,
      isExpired: true,
      timeRemaining: 0
    });
  }, []);

  // Extend session (reset timers)
  const extendSession = useCallback(() => {
    const now = Date.now();
    setSessionInfo(prev => ({
      ...prev,
      startTime: now,
      lastActivity: now,
      isExpired: false,
      timeRemaining: SESSION_TIMEOUT
    }));
  }, []);

  useEffect(() => {
    // Load existing session or create new one
    let currentSessionInfo: SessionInfo;
    const stored = sessionStorage.getItem('movieRecommenderSession');
    
    if (stored) {
      try {
        currentSessionInfo = JSON.parse(stored);
        
        // Check if stored session is expired
        const now = Date.now();
        const timeSinceStart = now - currentSessionInfo.startTime;
        const timeSinceLastActivity = now - currentSessionInfo.lastActivity;
        
        if (timeSinceStart > SESSION_TIMEOUT || timeSinceLastActivity > INACTIVITY_TIMEOUT) {
          // Session expired, create new one
          currentSessionInfo = {
            sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            startTime: now,
            lastActivity: now,
            isExpired: false,
            timeRemaining: SESSION_TIMEOUT
          };
        }
      } catch (error) {
        console.warn('Failed to parse stored session, creating new one:', error);
        currentSessionInfo = {
          sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          startTime: Date.now(),
          lastActivity: Date.now(),
          isExpired: false,
          timeRemaining: SESSION_TIMEOUT
        };
      }
    } else {
      // No stored session, create new one
      currentSessionInfo = {
        sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        startTime: Date.now(),
        lastActivity: Date.now(),
        isExpired: false,
        timeRemaining: SESSION_TIMEOUT
      };
    }
    
    setSessionInfo(currentSessionInfo);
    sessionStorage.setItem('movieRecommenderSession', JSON.stringify(currentSessionInfo));
  }, []);

  // Set up activity listeners
  useEffect(() => {
    const handleActivity = () => {
      updateActivity();
    };

    // Listen for user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Set up periodic session expiry check
    const expiryInterval = setInterval(checkSessionExpiry, 60000); // Check every minute

    // Set up session timeout
    const sessionTimeout = setTimeout(() => {
      if (checkSessionExpiry()) {
        console.log('Session expired due to timeout');
        clearSession();
      }
    }, SESSION_TIMEOUT);

    // Set up inactivity timeout
    const inactivityTimeout = setTimeout(() => {
      if (checkSessionExpiry()) {
        console.log('Session expired due to inactivity');
        clearSession();
      }
    }, INACTIVITY_TIMEOUT);

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      clearInterval(expiryInterval);
      clearTimeout(sessionTimeout);
      clearTimeout(inactivityTimeout);
    };
  }, [updateActivity, checkSessionExpiry, clearSession]);

  // Auto-save session info
  useEffect(() => {
    if (sessionInfo.sessionId) {
      sessionStorage.setItem('movieRecommenderSession', JSON.stringify(sessionInfo));
    }
  }, [sessionInfo]);

  return {
    sessionId: sessionInfo.sessionId,
    startTime: sessionInfo.startTime,
    lastActivity: sessionInfo.lastActivity,
    isExpired: sessionInfo.isExpired,
    timeRemaining: sessionInfo.timeRemaining,
    updateActivity,
    startNewSession,
    clearSession,
    extendSession,
    // Helper methods
    getSessionAge: () => Date.now() - sessionInfo.startTime,
    getInactivityTime: () => Date.now() - sessionInfo.lastActivity,
    getSessionStatus: () => ({
      isActive: !sessionInfo.isExpired,
      timeRemaining: sessionInfo.timeRemaining,
      sessionAge: Date.now() - sessionInfo.startTime,
      inactivityTime: Date.now() - sessionInfo.lastActivity
    })
  };
} 