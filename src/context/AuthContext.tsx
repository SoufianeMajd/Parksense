import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import { Alert } from 'react-native';

const SESSION_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
const WARNING_TIMEOUT_MS = 1 * 60 * 1000;  // 1 minute

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimers = useCallback(() => {
    if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
  }, []);

  const signOut = useCallback(async () => {
    clearTimers();
    await supabase.auth.signOut();
  }, [clearTimers]);

  const startSessionTimer = useCallback(() => {
    clearTimers();
    // Start the 15-minute timer
    sessionTimerRef.current = setTimeout(() => {
      // 15 minutes passed, show warning alert
      Alert.alert(
        'Session Expirée',
        'Votre session expire. Voulez-vous rester connecté ?',
        [
          { 
            text: 'Se déconnecter', 
            style: 'cancel', 
            onPress: () => signOut() 
          },
          { 
            text: 'Continuer', 
            onPress: () => {
              // User clicked continue, restart the session timer
              startSessionTimer();
            } 
          }
        ],
        { cancelable: false }
      );

      // Start the 1-minute auto-logout timer
      warningTimerRef.current = setTimeout(() => {
        // If no response after 1 minute, log out automatically
        signOut();
      }, WARNING_TIMEOUT_MS);

    }, SESSION_TIMEOUT_MS);
  }, [clearTimers, signOut]);

  // Manage timers when session changes
  useEffect(() => {
    if (session) {
      startSessionTimer();
    } else {
      clearTimers();
    }
    return () => clearTimers();
  }, [session, startSessionTimer, clearTimers]);

  useEffect(() => {
    // Obtenir la session actuelle
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Écouter les changements d'état (login, logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
