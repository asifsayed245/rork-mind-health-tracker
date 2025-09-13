-- Supabase Database Schema for Wellness App
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create check_ins table
CREATE TABLE IF NOT EXISTS public.check_ins (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    slot TEXT NOT NULL CHECK (slot IN ('morning', 'afternoon', 'evening', 'night')),
    mood INTEGER NOT NULL CHECK (mood >= 1 AND mood <= 5),
    stress INTEGER NOT NULL CHECK (stress >= 1 AND stress <= 5),
    energy INTEGER NOT NULL CHECK (energy >= 1 AND energy <= 5),
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create journal_entries table
CREATE TABLE IF NOT EXISTS public.journal_entries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('positive', 'negative', 'gratitude', 'free', 'reflection')),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    mood INTEGER NOT NULL CHECK (mood >= 1 AND mood <= 5),
    tags TEXT[] DEFAULT '{}',
    audio_uri TEXT,
    meta JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_settings table
CREATE TABLE IF NOT EXISTS public.user_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    notif_morning TIME DEFAULT '07:30',
    notif_afternoon TIME DEFAULT '12:30',
    notif_evening TIME DEFAULT '18:30',
    notif_night TIME DEFAULT '21:30',
    mood_low_cutoff DECIMAL DEFAULT 2.5,
    stress_high_cutoff DECIMAL DEFAULT 3.5,
    energy_low_cutoff DECIMAL DEFAULT 2.5,
    min_slots_per_day INTEGER DEFAULT 2,
    streak_days_required INTEGER DEFAULT 3,
    last_heavy_card_shown_at TIMESTAMP WITH TIME ZONE,
    last_heavy_card_dismissed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create activity_sessions table
CREATE TABLE IF NOT EXISTS public.activity_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('breathing', 'meditation', 'exercise')),
    duration INTEGER NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    post_mood INTEGER CHECK (post_mood >= 1 AND post_mood <= 5),
    post_stress INTEGER CHECK (post_stress >= 1 AND post_stress <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_check_ins_user_id ON public.check_ins(user_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_created_at ON public.check_ins(created_at);
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_id ON public.journal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_created_at ON public.journal_entries(created_at);
CREATE INDEX IF NOT EXISTS idx_journal_entries_type ON public.journal_entries(type);
CREATE INDEX IF NOT EXISTS idx_activity_sessions_user_id ON public.activity_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_sessions_created_at ON public.activity_sessions(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for check_ins
CREATE POLICY "Users can view their own check-ins" ON public.check_ins
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own check-ins" ON public.check_ins
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own check-ins" ON public.check_ins
    FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete their own check-ins" ON public.check_ins
    FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL);

-- Create RLS policies for journal_entries
CREATE POLICY "Users can view their own journal entries" ON public.journal_entries
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own journal entries" ON public.journal_entries
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own journal entries" ON public.journal_entries
    FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete their own journal entries" ON public.journal_entries
    FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL);

-- Create RLS policies for user_settings
CREATE POLICY "Users can view their own settings" ON public.user_settings
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own settings" ON public.user_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own settings" ON public.user_settings
    FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete their own settings" ON public.user_settings
    FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL);

-- Create RLS policies for activity_sessions
CREATE POLICY "Users can view their own activity sessions" ON public.activity_sessions
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own activity sessions" ON public.activity_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own activity sessions" ON public.activity_sessions
    FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete their own activity sessions" ON public.activity_sessions
    FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for user_settings updated_at
CREATE TRIGGER update_user_settings_updated_at 
    BEFORE UPDATE ON public.user_settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();