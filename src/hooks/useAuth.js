import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '../lib/supabase';
import { DEV_MODE } from '../lib/config';

const MOCK_USER = {
  id: 'dev-user-123',
  email: 'dev@starlog.app',
};

const MOCK_PROFILE = {
  id: 'dev-user-123',
  username: 'devuser',
  display_name: 'Dev User',
  avatar_url: null,
  native_language: 'en',
  is_verified: true,
  verified_languages: ['en', 'pt'],
  contribution_count: 42,
  review_count: 15,
  settings: {},
};

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(DEV_MODE ? MOCK_USER : null);
  const [profile, setProfile] = useState(DEV_MODE ? MOCK_PROFILE : null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Skip auth setup in dev mode
    if (DEV_MODE) {
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes — keep this synchronous to avoid
    // deadlocking the Supabase auth lock (Navigator Locks API).
    // Profile fetching is handled by the separate useEffect below.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (!session?.user) {
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Fetch profile whenever user changes — kept separate from
  // onAuthStateChange to avoid Supabase auth lock deadlock.
  useEffect(() => {
    if (DEV_MODE || !user) return;
    fetchProfile(user.id);
  }, [user?.id]);

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        // No profile exists — create one (e.g. user signed up on marketing site)
        const { data: { user: authUser } } = await supabase.auth.getUser();
        const { data: newProfile } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            display_name: authUser?.user_metadata?.display_name || authUser?.user_metadata?.full_name || authUser?.email?.split('@')[0],
            avatar_url: authUser?.user_metadata?.avatar_url || null,
          })
          .select()
          .single();
        setProfile(newProfile);
        return;
      }

      if (error) {
        console.error('Error fetching profile:', error);
      }

      setProfile(data);
    } catch (err) {
      console.error('Profile fetch error:', err);
    }
  };

  const signUp = async (email, password, metadata = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { data, error };
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { data, error };
  };

  const signOut = async () => {
    // Clear Supabase session from localStorage
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('sb-')) {
        localStorage.removeItem(key);
      }
    });
    // Hard reload to /login — this reinitializes the Supabase client
    // from the now-empty localStorage, avoiding issues with the
    // in-memory session state writing back to storage
    window.location.href = '/login';
  };

  const resetPassword = async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    return { data, error };
  };

  const updatePassword = async (newPassword) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { data, error };
  };

  const updateProfile = async (updates) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (!error && data) {
      setProfile(data);
    }

    return { data, error };
  };

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    refreshProfile: () => user && fetchProfile(user.id),
    isVerified: profile?.is_verified ?? false,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
