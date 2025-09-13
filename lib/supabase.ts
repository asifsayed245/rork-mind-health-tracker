import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Replace these with your actual Supabase credentials
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

// Custom storage for React Native
const customStorage = {
  getItem: async (key: string) => {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return AsyncStorage.getItem(key);
  },
  setItem: async (key: string, value: string) => {
    if (Platform.OS === 'web') {
      return localStorage.setItem(key, value);
    }
    return AsyncStorage.setItem(key, value);
  },
  removeItem: async (key: string) => {
    if (Platform.OS === 'web') {
      return localStorage.removeItem(key);
    }
    return AsyncStorage.removeItem(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: customStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Database types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          streak: number;
          is_premium: boolean;
          onboarding_completed: boolean;
          notifications_enabled: boolean;
          biometric_lock_enabled: boolean;
          theme: 'dark' | 'light';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          streak?: number;
          is_premium?: boolean;
          onboarding_completed?: boolean;
          notifications_enabled?: boolean;
          biometric_lock_enabled?: boolean;
          theme?: 'dark' | 'light';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          streak?: number;
          is_premium?: boolean;
          onboarding_completed?: boolean;
          notifications_enabled?: boolean;
          biometric_lock_enabled?: boolean;
          theme?: 'dark' | 'light';
          updated_at?: string;
        };
      };
      check_ins: {
        Row: {
          id: string;
          user_id: string;
          slot: 'morning' | 'afternoon' | 'evening' | 'night';
          mood: number;
          stress: number;
          energy: number;
          note: string | null;
          timestamp_iso: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          slot: 'morning' | 'afternoon' | 'evening' | 'night';
          mood: number;
          stress: number;
          energy: number;
          note?: string | null;
          timestamp_iso: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          slot?: 'morning' | 'afternoon' | 'evening' | 'night';
          mood?: number;
          stress?: number;
          energy?: number;
          note?: string | null;
          timestamp_iso?: string;
        };
      };
      journal_entries: {
        Row: {
          id: string;
          user_id: string;
          type: 'positive' | 'negative' | 'gratitude' | 'free' | 'reflection';
          title: string;
          content: string;
          mood: number;
          tags: string[];
          audio_uri: string | null;
          timestamp: string;
          date: string;
          meta: any | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: 'positive' | 'negative' | 'gratitude' | 'free' | 'reflection';
          title: string;
          content: string;
          mood: number;
          tags?: string[];
          audio_uri?: string | null;
          timestamp: string;
          date: string;
          meta?: any | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: 'positive' | 'negative' | 'gratitude' | 'free' | 'reflection';
          title?: string;
          content?: string;
          mood?: number;
          tags?: string[];
          audio_uri?: string | null;
          timestamp?: string;
          date?: string;
          meta?: any | null;
          updated_at?: string;
        };
      };
      user_settings: {
        Row: {
          id: string;
          user_id: string;
          notif_morning: string | null;
          notif_afternoon: string | null;
          notif_evening: string | null;
          notif_night: string | null;
          thresholds: any;
          last_heavy_card_shown_at: string | null;
          last_heavy_card_dismissed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          notif_morning?: string | null;
          notif_afternoon?: string | null;
          notif_evening?: string | null;
          notif_night?: string | null;
          thresholds?: any;
          last_heavy_card_shown_at?: string | null;
          last_heavy_card_dismissed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          notif_morning?: string | null;
          notif_afternoon?: string | null;
          notif_evening?: string | null;
          notif_night?: string | null;
          thresholds?: any;
          last_heavy_card_shown_at?: string | null;
          last_heavy_card_dismissed_at?: string | null;
          updated_at?: string;
        };
      };
      activity_sessions: {
        Row: {
          id: string;
          user_id: string;
          type: 'breathing' | 'meditation' | 'exercise';
          duration: number;
          completed: boolean;
          timestamp: string;
          date: string;
          post_mood: number | null;
          post_stress: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: 'breathing' | 'meditation' | 'exercise';
          duration: number;
          completed: boolean;
          timestamp: string;
          date: string;
          post_mood?: number | null;
          post_stress?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: 'breathing' | 'meditation' | 'exercise';
          duration?: number;
          completed?: boolean;
          timestamp?: string;
          date?: string;
          post_mood?: number | null;
          post_stress?: number | null;
        };
      };
    };
  };
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];