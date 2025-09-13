# Database Setup Instructions

## The Problem
Your app is showing database connection errors because the required tables haven't been created in your Supabase database yet.

## Quick Fix

1. **Go to your Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project: `qgsmmpgzerpovijkgncp`

2. **Open the SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run the Database Schema**
   - Copy the entire content from the file `supabase-schema.sql` in your project root
   - Paste it into the SQL Editor
   - Click "Run" to execute the SQL

4. **Verify Setup**
   - After running the SQL, you should see tables created in the "Table Editor"
   - The required tables are:
     - `profiles`
     - `user_settings` 
     - `check_ins`
     - `journal_entries`
     - `activity_sessions`

## What This Does
- Creates all required database tables with proper structure
- Sets up Row Level Security (RLS) policies for data protection
- Creates indexes for better performance
- Adds triggers for automatic timestamp updates

## After Setup
Once you've run the SQL schema:
1. Refresh your app
2. The database connection errors should be resolved
3. User profiles and settings will be automatically created when users log in

## Test the Connection
You can test if everything is working by visiting:
`http://localhost:8081/api/test-db`

This will show you the status of your database connection and tables.