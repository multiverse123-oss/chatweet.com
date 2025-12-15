import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface SessionInfo {
  sessionToken: string;
  deviceId: string;
  expiresAt: string;
}

const generateDeviceId = (): string => {
  const userAgent = navigator.userAgent;
  const screenInfo = `${screen.width}x${screen.height}`;
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2);
  const combined = `${userAgent}-${screenInfo}-${timestamp}-${random}`;
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36) + random;
};

const STORAGE_KEY = 'chatweet_session';

export const useSingleSession = () => {
  const { user } = useAuth();
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [isSessionValid, setIsSessionValid] = useState(true);
  const [loading, setLoading] = useState(false);

  const getStoredSession = useCallback((): SessionInfo | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error reading stored session:', e);
    }
    return null;
  }, []);

  const storeSession = useCallback((session: SessionInfo) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch (e) {
      console.error('Error storing session:', e);
    }
  }, []);

  const clearStoredSession = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('Error clearing stored session:', e);
    }
  }, []);

  const createSession = useCallback(async () => {
    if (!user) return null;

    setLoading(true);
    try {
      const deviceId = generateDeviceId();
      
      const { data, error } = await supabase.functions.invoke('session-manager', {
        body: {
          action: 'create_session',
          userId: user.id,
          deviceId,
          userAgent: navigator.userAgent,
          ipAddress: '' // Will be detected server-side if needed
        }
      });

      if (error) throw error;

      const session: SessionInfo = {
        sessionToken: data.sessionToken,
        deviceId,
        expiresAt: data.expiresAt
      };

      storeSession(session);
      setSessionInfo(session);
      setIsSessionValid(true);
      
      return session;
    } catch (error) {
      console.error('Error creating session:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, storeSession]);

  const validateSession = useCallback(async () => {
    if (!user) return false;

    const storedSession = getStoredSession();
    if (!storedSession) {
      setIsSessionValid(false);
      return false;
    }

    try {
      const { data, error } = await supabase.functions.invoke('session-manager', {
        body: {
          action: 'validate_session',
          sessionToken: storedSession.sessionToken,
          deviceId: storedSession.deviceId
        }
      });

      if (error || !data?.valid) {
        setIsSessionValid(false);
        clearStoredSession();
        return false;
      }

      setSessionInfo(storedSession);
      setIsSessionValid(true);
      return true;
    } catch (error) {
      console.error('Error validating session:', error);
      setIsSessionValid(false);
      return false;
    }
  }, [user, getStoredSession, clearStoredSession]);

  const endSession = useCallback(async () => {
    if (!user || !sessionInfo) return;

    try {
      await supabase.functions.invoke('session-manager', {
        body: {
          action: 'logout',
          userId: user.id,
          sessionToken: sessionInfo.sessionToken,
          deviceId: sessionInfo.deviceId,
          ipAddress: ''
        }
      });
    } catch (error) {
      console.error('Error ending session:', error);
    } finally {
      clearStoredSession();
      setSessionInfo(null);
      setIsSessionValid(false);
    }
  }, [user, sessionInfo, clearStoredSession]);

  const getActiveSessions = useCallback(async () => {
    if (!user) return [];

    try {
      const { data, error } = await supabase.functions.invoke('session-manager', {
        body: {
          action: 'get_active_sessions',
          userId: user.id
        }
      });

      if (error) throw error;
      return data?.sessions || [];
    } catch (error) {
      console.error('Error getting active sessions:', error);
      return [];
    }
  }, [user]);

  // Validate session on mount and when user changes
  useEffect(() => {
    if (user) {
      const stored = getStoredSession();
      if (stored) {
        validateSession();
      }
    } else {
      clearStoredSession();
      setSessionInfo(null);
      setIsSessionValid(false);
    }
  }, [user, getStoredSession, validateSession, clearStoredSession]);

  return {
    sessionInfo,
    isSessionValid,
    loading,
    createSession,
    validateSession,
    endSession,
    getActiveSessions
  };
};
