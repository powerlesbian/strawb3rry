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

  useEffect(() => {
    // Failsafe timeout - always stop loading after 3 seconds
    const failsafe = setTimeout(() => {
      setLoading(false);
    }, 3000);

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      // Validate the JWT is parseable before using it — a corrupted token
      // causes Supabase to throw TypeError internally, preventing auth from resolving
      if (session?.access_token) {
        try {
          const parts = session.access_token.split('.');
          if (parts.length !== 3) throw new Error('bad jwt');
          JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        } catch {
          await supabase.auth.signOut();
          clearTimeout(failsafe);
          setLoading(false);
          return;
        }
      }
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        const p = await loadProfile(session.user.id, session.user.email);
        setProfile(p);
      }
      clearTimeout(failsafe);
      setLoading(false);
    }).catch(() => {
      clearTimeout(failsafe);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Expired or invalid refresh token — force a clean sign-out
      if (event === 'TOKEN_REFRESH_FAILED') {
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        const p = await loadProfile(session.user.id, session.user.email);
        setProfile(p);
      } else {
        setProfile(null);
      }
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
