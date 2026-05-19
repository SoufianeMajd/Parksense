import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';

const SESSION_TIMEOUT_MS = 10 * 20 * 1000; // 10 * 20 secondes (POUR LE TEST)
const WARNING_TIMEOUT_SEC = 20;  // 20 secondes (POUR LE TEST)

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRole: string | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  userRole: null,
  signOut: async () => { },
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(WARNING_TIMEOUT_SEC);

  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimers = useCallback(() => {
    if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
  }, []);

  const signOut = useCallback(async () => {
    clearTimers();
    setShowWarning(false);
    await supabase.auth.signOut();
  }, [clearTimers]);

  const startSessionTimer = useCallback(() => {
    clearTimers();
    setShowWarning(false);
    // Start the session timer
    sessionTimerRef.current = setTimeout(() => {
      // Time is up, show warning modal and start countdown
      setCountdown(WARNING_TIMEOUT_SEC);
      setShowWarning(true);
    }, SESSION_TIMEOUT_MS);
  }, [clearTimers]);

  // Handle countdown interval
  useEffect(() => {
    if (showWarning) {
      countdownIntervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            // Time ran out
            clearInterval(countdownIntervalRef.current!);
            signOut();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    }
    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [showWarning, signOut]);

  // Manage timers when session changes
  useEffect(() => {
    if (session) {
      startSessionTimer();
    } else {
      clearTimers();
      setShowWarning(false);
    }
    return () => clearTimers();
  }, [session, startSessionTimer, clearTimers]);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      if (data) {
        setUserRole(data.role);
      }
    } catch (e) {
      console.log("Error fetching role:", e);
      setUserRole('User'); // fallback
    }
  };

  useEffect(() => {
    const initSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchUserRole(session.user.id);
      } else {
        setUserRole(null);
      }
      setLoading(false);
    };
    
    initSession();

    // Écouter les changements d'état (login, logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setLoading(true);
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchUserRole(session.user.id);
      } else {
        setUserRole(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading, userRole, signOut }}>
      {children}
      <Modal visible={showWarning} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Session Expirée</Text>
            <Text style={styles.modalText}>
              Votre session expire. Voulez-vous rester connecté ?
            </Text>
            <Text style={styles.countdownText}>
              Déconnexion dans {countdown} seconde{countdown > 1 ? 's' : ''}...
            </Text>
            <View style={styles.row}>
              <TouchableOpacity style={styles.cancelBtn} onPress={signOut}>
                <Text style={styles.cancelText}>Se déconnecter</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.continueBtn} onPress={startSessionTimer}>
                <Text style={styles.continueText}>Continuer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

const styles = StyleSheet.create({
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  modalText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    color: '#666',
  },
  countdownText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#e53935',
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    marginRight: 8,
  },
  cancelText: {
    color: '#e53935',
    fontSize: 16,
    fontWeight: '600',
  },
  continueBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#2196F3',
    borderRadius: 8,
    marginLeft: 8,
  },
  continueText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
