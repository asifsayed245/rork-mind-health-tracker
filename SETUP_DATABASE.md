# Database Setup Instructions

## The Issue
The error "Could not find the table 'public.user_profiles' in the schema cache" occurs because the database tables haven't been created in your Supabase project yet.

## How to Fix

1. **Go to your Supabase project dashboard**
   - Visit https://supabase.com/dashboard
   - Select your project

2. **Open the SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Run the schema**
   - Copy the entire content from `supabase-schema.sql` file
   - Paste it into the SQL Editor
   - Click "Run" to execute the SQL

4. **Verify the tables were created**
   - Go to "Table Editor" in the left sidebar
   - You should see these tables:
     - `check_ins`
     - `journal_entries`
     - `user_profiles` ← This is the missing table causing the error
     - `user_settings`
     - `activity_sessions`

## What This Will Fix

After running the schema:
- ✅ Signup will work properly and create user profiles
- ✅ User's name will appear on the home screen instead of "User"
- ✅ Profile data entered during signup will be saved
- ✅ All profile-related features will function correctly

## Additional Changes Made

- ✅ Removed symbol requirement from password validation (now only requires 8+ characters with 1 number)
- ✅ Fixed TypeScript errors in the backend routes
- ✅ Home screen already configured to show user's name from profile

Once you run the SQL schema, everything should work perfectly!