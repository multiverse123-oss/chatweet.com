import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

const generateDeviceId = (): string => {
  const userAgent = navigator.userAgent;
  const screenInfo = `${screen.width}x${screen.height}`;
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2);
  const combined = `${userAgent}-${screenInfo}-${timestamp}-${random}`;
  
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36) + random;
};

const STORAGE_KEY = 'chatweet_session';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionValid, setSessionValid] = useState(true);

  const createSingleSession = useCallback(async (userId: string) => {
    try {
      const deviceId = generateDeviceId();
      
      const { data, error } = await supabase.functions.invoke('session-manager', {
        body: {
          action: 'create_session',
          userId,
          deviceId,
          userAgent: navigator.userAgent,
          ipAddress: ''
        }
      });

      if (!error && data?.sessionToken) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          sessionToken: data.sessionToken,
          deviceId,
          expiresAt: data.expiresAt
        }));
        setSessionValid(true);
      }
    } catch (error) {
      console.error('Error creating single session:', error);
    }
  }, []);

  const validateSingleSession = useCallback(async () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return false;

      const { sessionToken, deviceId } = JSON.parse(stored);
      
      const { data, error } = await supabase.functions.invoke('session-manager', {
        body: {
          action: 'validate_session',
          sessionToken,
          deviceId
        }
      });

      if (error || !data?.valid) {
        localStorage.removeItem(STORAGE_KEY);
        setSessionValid(false);
        return false;
      }

      setSessionValid(true);
      return true;
    } catch (error) {
      console.error('Error validating session:', error);
      return false;
    }
  }, []);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Validate single session if user exists
      if (session?.user) {
        validateSingleSession();
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Create single session on sign in
      if (event === 'SIGNED_IN' && session?.user) {
        setTimeout(() => {
          createSingleSession(session.user.id);
        }, 0);
      }

      // Clear session storage on sign out
      if (event === 'SIGNED_OUT') {
        localStorage.removeItem(STORAGE_KEY);
        setSessionValid(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [createSingleSession, validateSingleSession]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
      },
    });
    return { error };
  };

  const signOut = async () => {
    // End single session first
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && user) {
        const { sessionToken, deviceId } = JSON.parse(stored);
        await supabase.functions.invoke('session-manager', {
          body: {
            action: 'logout',
            userId: user.id,
            sessionToken,
            deviceId,
            ipAddress: ''
          }
        });
      }
    } catch (error) {
      console.error('Error ending session:', error);
    }

    localStorage.removeItem(STORAGE_KEY);
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return {
    user,
    session,
    loading,
    sessionValid,
    signIn,
    signUp,
    signOut,
    validateSingleSession,
  };
};
