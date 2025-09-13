-- SUPABASE DATABASE SETUP SCRIPT
-- Copy and paste this entire script into your Supabase SQL Editor and run it

-- Enable Row Level Security (RLS) and UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    streak INTEGER DEFAULT 0,
    is_premium BOOLEAN DEFAULT false,
    onboarding_completed BOOLEAN DEFAULT false,
    notifications_enabled BOOLEAN DEFAULT true,
    biometric_lock_enabled BOOLEAN DEFAULT false,
    theme TEXT CHECK (theme IN ('dark', 'light')) DEFAULT 'dark',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    notif_morning TEXT,
    notif_afternoon TEXT,
    notif_evening TEXT,
    notif_night TEXT,
    thresholds JSONB DEFAULT '{
        "moodLowCutoff": 2.5,
        "stressHighCutoff": 3.5,
        "energyLowCutoff": 2.5,
        "minSlotsPerDay": 2,
        "streakDaysRequired": 3
    }'::jsonb,
    last_heavy_card_shown_at TIMESTAMP WITH TIME ZONE,
    last_heavy_card_dismissed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create check_ins table
CREATE TABLE IF NOT EXISTS check_ins (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    slot TEXT CHECK (slot IN ('morning', 'afternoon', 'evening', 'night')) NOT NULL,
    mood INTEGER CHECK (mood >= 1 AND mood <= 5) NOT NULL,
    stress INTEGER CHECK (stress >= 1 AND stress <= 5) NOT NULL,
    energy INTEGER CHECK (energy >= 1 AND energy <= 5) NOT NULL,
    note TEXT,
    timestamp_iso TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create journal_entries table
CREATE TABLE IF NOT EXISTS journal_entries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT CHECK (type IN ('positive', 'negative', 'gratitude', 'free', 'reflection')) NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    mood INTEGER CHECK (mood >= 1 AND mood <= 5) NOT NULL,
    tags TEXT[] DEFAULT '{}',
    audio_uri TEXT,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    date DATE NOT NULL,
    meta JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create activity_sessions table
CREATE TABLE IF NOT EXISTS activity_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT CHECK (type IN ('breathing', 'meditation', 'exercise')) NOT NULL,
    duration INTEGER NOT NULL,
    completed BOOLEAN NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    date DATE NOT NULL,
    post_mood INTEGER CHECK (post_mood >= 1 AND post_mood <= 5),
    post_stress INTEGER CHECK (post_stress >= 1 AND post_stress <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_user_id ON check_ins(user_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_timestamp ON check_ins(timestamp_iso);
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_id ON journal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_type ON journal_entries(type);
CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON journal_entries(date);
CREATE INDEX IF NOT EXISTS idx_journal_entries_timestamp ON journal_entries(timestamp);
CREATE INDEX IF NOT EXISTS idx_activity_sessions_user_id ON activity_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_sessions_date ON activity_sessions(date);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;

DROP POLICY IF EXISTS "Users can view own check-ins" ON check_ins;
DROP POLICY IF EXISTS "Users can insert own check-ins" ON check_ins;
DROP POLICY IF EXISTS "Users can update own check-ins" ON check_ins;
DROP POLICY IF EXISTS "Users can delete own check-ins" ON check_ins;

DROP POLICY IF EXISTS "Users can view own journal entries" ON journal_entries;
DROP POLICY IF EXISTS "Users can insert own journal entries" ON journal_entries;
DROP POLICY IF EXISTS "Users can update own journal entries" ON journal_entries;
DROP POLICY IF EXISTS "Users can delete own journal entries" ON journal_entries;

DROP POLICY IF EXISTS "Users can view own activity sessions" ON activity_sessions;
DROP POLICY IF EXISTS "Users can insert own activity sessions" ON activity_sessions;
DROP POLICY IF EXISTS "Users can update own activity sessions" ON activity_sessions;
DROP POLICY IF EXISTS "Users can delete own activity sessions" ON activity_sessions;

-- Create RLS policies for profiles
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for user_settings
CREATE POLICY "Users can view own settings" ON user_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON user_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON user_settings
    FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for check_ins
CREATE POLICY "Users can view own check-ins" ON check_ins
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own check-ins" ON check_ins
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own check-ins" ON check_ins
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own check-ins" ON check_ins
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for journal_entries
CREATE POLICY "Users can view own journal entries" ON journal_entries
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own journal entries" ON journal_entries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journal entries" ON journal_entries
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own journal entries" ON journal_entries
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for activity_sessions
CREATE POLICY "Users can view own activity sessions" ON activity_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity sessions" ON activity_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own activity sessions" ON activity_sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own activity sessions" ON activity_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers if they exist and recreate them
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
DROP TRIGGER IF EXISTS update_journal_entries_updated_at ON journal_entries;

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_journal_entries_updated_at BEFORE UPDATE ON journal_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Success message
SELECT 'Database setup completed successfully! All tables, indexes, RLS policies, and triggers have been created.' as setup_status;