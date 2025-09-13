# Database Setup Instructions

## Step 1: Create Tables in Supabase

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Navigate to your project: https://supabase.com/dashboard/project/qgsmmpgzerpovijkgncp
3. Go to the SQL Editor (left sidebar)
4. Copy and paste the entire content from `supabase-schema.sql` file
5. Click "Run" to execute the SQL

## Step 2: Verify Tables Created

After running the SQL, you should see these tables in your Database > Tables section:
- `profiles`
- `user_settings` 
- `check_ins`
- `journal_entries`
- `activity_sessions`

## Step 3: Test Database Connection

1. Restart your development server
2. The app should now connect successfully to the database
3. You can test the connection by visiting: http://localhost:8081/api/test-db

## Troubleshooting

If you get errors:
1. Make sure all SQL commands executed successfully
2. Check that RLS (Row Level Security) policies were created
3. Verify your environment variables are correct in `.env`

## What the SQL Does

- Creates all necessary tables with proper relationships
- Sets up Row Level Security (RLS) policies for data protection
- Creates indexes for better performance
- Sets up triggers for automatic timestamp updates
- Enables UUID extension for unique identifiers

Once this is complete, your app should work without database connection errors.