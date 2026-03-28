import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://idpluynoftfxthsjbkhl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkcGx1eW5vZnRmeHRoc2pia2hsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3NzI4NzMsImV4cCI6MjA3MzM0ODg3M30.fTuklWvF1-9CS3LZ5by1l4z44HZ0usc8rfFGpWNXggM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Database {
  public: {
    Tables: {
      check_ins: {
        Row: {
          id: string;
          user_id: string | null;
          slot: 'morning' | 'afternoon' | 'evening' | 'night';
          mood: number;
          stress: number;
          energy: number;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          slot: 'morning' | 'afternoon' | 'evening' | 'night';
          mood: number;
          stress: number;
          energy: number;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          slot?: 'morning' | 'afternoon' | 'evening' | 'night';
          mood?: number;
          stress?: number;
          energy?: number;
          note?: string | null;
          created_at?: string;
        };
      };
      journal_entries: {
        Row: {
          id: string;
          user_id: string | null;
          type: 'positive' | 'negative' | 'gratitude' | 'free' | 'reflection';
          title: string;
          content: string;
          mood: number;
          tags: string[];
          audio_uri: string | null;
          created_at: string;
          meta: any | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          type: 'positive' | 'negative' | 'gratitude' | 'free' | 'reflection';
          title: string;
          content: string;
          mood: number;
          tags?: string[];
          audio_uri?: string | null;
          created_at?: string;
          meta?: any | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          type?: 'positive' | 'negative' | 'gratitude' | 'free' | 'reflection';
          title?: string;
          content?: string;
          mood?: number;
          tags?: string[];
          audio_uri?: string | null;
          created_at?: string;
          meta?: any | null;
        };
      };
      user_profiles: {
        Row: {
          id: string;
          user_id: string | null;
          full_name: string;
          age: number;
          gender: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
          weight: number | null;
          occupation: string | null;
          timezone: string;
          weight_unit: 'kg' | 'lbs';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          full_name: string;
          age: number;
          gender?: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
          weight?: number | null;
          occupation?: string | null;
          timezone?: string;
          weight_unit?: 'kg' | 'lbs';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          full_name?: string;
          age?: number;
          gender?: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
          weight?: number | null;
          occupation?: string | null;
          timezone?: string;
          weight_unit?: 'kg' | 'lbs';
          created_at?: string;
          updated_at?: string;
        };
      };
      user_settings: {
        Row: {
          id: string;
          user_id: string | null;
          notif_morning: string | null;
          notif_afternoon: string | null;
          notif_evening: string | null;
          notif_night: string | null;
          mood_low_cutoff: number;
          stress_high_cutoff: number;
          energy_low_cutoff: number;
          min_slots_per_day: number;
          streak_days_required: number;
          last_heavy_card_shown_at: string | null;
          last_heavy_card_dismissed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          notif_morning?: string | null;
          notif_afternoon?: string | null;
          notif_evening?: string | null;
          notif_night?: string | null;
          mood_low_cutoff?: number;
          stress_high_cutoff?: number;
          energy_low_cutoff?: number;
          min_slots_per_day?: number;
          streak_days_required?: number;
          last_heavy_card_shown_at?: string | null;
          last_heavy_card_dismissed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          notif_morning?: string | null;
          notif_afternoon?: string | null;
          notif_evening?: string | null;
          notif_night?: string | null;
          mood_low_cutoff?: number;
          stress_high_cutoff?: number;
          energy_low_cutoff?: number;
          min_slots_per_day?: number;
          streak_days_required?: number;
          last_heavy_card_shown_at?: string | null;
          last_heavy_card_dismissed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      activity_sessions: {
        Row: {
          id: string;
          user_id: string | null;
          type: 'breathing' | 'meditation' | 'exercise';
          duration: number;
          completed: boolean;
          post_mood: number | null;
          post_stress: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          type: 'breathing' | 'meditation' | 'exercise';
          duration: number;
          completed: boolean;
          post_mood?: number | null;
          post_stress?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          type?: 'breathing' | 'meditation' | 'exercise';
          duration?: number;
          completed?: boolean;
          post_mood?: number | null;
          post_stress?: number | null;
          created_at?: string;
        };
      };
    };
  };
}

export type CheckInRow = Database['public']['Tables']['check_ins']['Row'];
export type JournalEntryRow = Database['public']['Tables']['journal_entries']['Row'];
export type UserProfileRow = Database['public']['Tables']['user_profiles']['Row'];
export type UserSettingsRow = Database['public']['Tables']['user_settings']['Row'];
export type ActivitySessionRow = Database['public']['Tables']['activity_sessions']['Row'];