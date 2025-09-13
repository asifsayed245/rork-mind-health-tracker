# Backend Setup Instructions

## Current Issues and Solutions

The backend is returning HTML instead of JSON, which indicates configuration issues. Here's how to fix them:

### 1. Database Setup (CRITICAL)

**Problem**: Database tables don't exist yet
**Solution**: 

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/qgsmmpgzerpovijkgncp
2. Navigate to **SQL Editor** in the left sidebar
3. Copy the entire content from `supabase-schema.sql` file in this project
4. Paste it into the SQL Editor and click **Run**

This will create all required tables, indexes, RLS policies, and triggers.

### 2. Service Role Key (IMPORTANT)

**Problem**: Missing or incorrect service role key
**Solution**:

1. Go to Supabase Dashboard > Settings > API
2. Copy the **service_role** secret key (NOT the anon key)
3. Replace the `SUPABASE_SERVICE_ROLE_KEY` value in the `.env` file

### 3. Backend Connection Issues

**Problem**: Backend returning HTML instead of JSON
**Possible causes**:
- Backend server not properly started
- Incorrect routing configuration
- Missing environment variables

**Solution**: The backend should start automatically on the Rork platform. If issues persist, contact support.

### 4. Authentication Issues

**Problem**: "Access denied. You can only access your own data" errors
**Solution**: 
- Ensure you're logged in with a valid account
- Database RLS policies are properly set up (step 1 above)
- User profile is created after login

## Testing the Setup

1. After running the SQL schema, go to Settings > Test Database in the app
2. This will verify:
   - Database connection
   - All tables exist
   - Basic functionality works

## Expected Behavior After Setup

- Backend status should show "Connected" 
- No more "Backend Configuration Error" messages
- Check-ins and journal entries should save to database
- User profile should load correctly

## If Problems Persist

1. Check browser console for detailed error messages
2. Verify all environment variables are set correctly
3. Ensure Supabase project is active and not paused
4. Contact support with specific error messages