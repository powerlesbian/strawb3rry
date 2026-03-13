import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, Profile } from '../lib/supabase';

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile(userId: string, email: string | undefined): Promise<Profile> {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    return data || {
      id: userId,
      email: email || null,
      display_name: email?.split('@')[0] || null,
      avatar_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  async function refreshProfile() {
    if (user) {
      const p = await loadProfile(user.id, user.email);
      setProfile(p);
    }
  }

  // Load profile in a separate effect — never inside onAuthStateChange,
  // as Supabase queries inside auth callbacks cause a deadlock
  useEffect(() => {
    if (user) {
      loadProfile(user.id, user.email).then(setProfile);
    } else {
      setProfile(null);
    }
  }, [user]);

  useEffect(() => {
    const failsafe = setTimeout(() => setLoading(false), 3000);

    supabase.auth.getSession().then(({ data: { session } }) => {
      // Validate JWT format — corrupted tokens cause Supabase to throw internally
      if (session?.access_token) {
        try {
          const parts = session.access_token.split('.');
          if (parts.length !== 3) throw new Error('bad jwt');
          JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        } catch {
          supabase.auth.signOut();
          clearTimeout(failsafe);
          setLoading(false);
          return;
        }
      }
      setSession(session);
      setUser(session?.user ?? null);
      clearTimeout(failsafe);
      setLoading(false);
    }).catch(() => {
      clearTimeout(failsafe);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESH_FAILED' || event === 'SIGNED_OUT') {
        // Clear localStorage tokens directly — avoids calling auth methods
        // inside the auth state machine which can cause deadlocks
        Object.keys(localStorage)
          .filter(k => k.startsWith('sb-'))
          .forEach(k => localStorage.removeItem(k));
        setSession(null);
        setUser(null);
        setLoading(false);
        return;
      }
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => {
      clearTimeout(failsafe);
      subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  }

  return (
    <AuthContext.Provider value={{ user, profile, session, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
