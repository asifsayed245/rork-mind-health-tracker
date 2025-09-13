import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Test database connection via backend health check
    const testConnection = async () => {
      try {
        const baseUrl = typeof window !== 'undefined' && window.location 
          ? window.location.origin 
          : (process.env.EXPO_PUBLIC_RORK_API_BASE_URL || 'http://localhost:8081');
          
        const response = await fetch(`${baseUrl}/api/test-db`);
        const result = await response.json();
        
        if (result.status === 'error') {
          console.error('Database connection test failed:', result);
        } else if (result.status === 'warning') {
          console.warn('⚠️  Database connected but tables missing:', result.message);
          console.warn('📖 Please run the SQL schema in Supabase SQL Editor.');
        } else {
          console.log('✅ Database connection successful:', result.message);
        }
      } catch (err) {
        console.error('❌ Backend connection error:', err instanceof Error ? err.message : String(err));
        console.warn('💡 Make sure the backend server is running.');
      }
    };
    
    testConnection();

    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log('AuthContext - Initial session check:', {
        hasSession: !!session,
        hasUser: !!session?.user,
        userId: session?.user?.id,
        hasToken: !!session?.access_token,
        error: error?.message
      });
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('AuthContext - Auth state change:', {
        event,
        hasSession: !!session,
        hasUser: !!session?.user,
        userId: session?.user?.id,
        hasToken: !!session?.access_token
      });
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, name: string) => {
    console.log('Attempting to sign up user with email:', email);
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });

    if (error) {
      console.error('Auth signup error:', error);
      return { error };
    }

    console.log('Auth signup successful:', data.user?.id);

    if (!error && data.user) {
      console.log('Creating profile for user:', data.user.id);
      
      // Create user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: data.user.id,
          name,
          streak: 0,
          is_premium: false,
          onboarding_completed: false,
          notifications_enabled: true,
          biometric_lock_enabled: false,
          theme: 'dark',
        })
        .select();

      if (profileError) {
        console.error('Error creating profile:', {
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint,
          code: profileError.code
        });
      } else {
        console.log('Profile created successfully:', profileData);
      }

      // Create default user settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('user_settings')
        .insert({
          user_id: data.user.id,
          notif_morning: '07:30',
          notif_afternoon: '12:30',
          notif_evening: '18:30',
          notif_night: '21:30',
          thresholds: {
            moodLowCutoff: 2.5,
            stressHighCutoff: 3.5,
            energyLowCutoff: 2.5,
            minSlotsPerDay: 2,
            streakDaysRequired: 3,
          },
        })
        .select();

      if (settingsError) {
        console.error('Error creating user settings:', {
          message: settingsError.message,
          details: settingsError.details,
          hint: settingsError.hint,
          code: settingsError.code
        });
      } else {
        console.log('User settings created successfully:', settingsData);
      }
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return { error };
  };

  const value = {
    session,
    user,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}