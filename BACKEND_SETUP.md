# Backend Server Setup

## Issue
The app is trying to connect to a backend server at `http://localhost:8081/api/trpc` but no server is running.

## Solution Options

### Option 1: Start the Backend Server (Recommended)
The backend code exists in the `/backend` folder but needs to be started as a separate process.

1. **Install dependencies** (if not already done):
   ```bash
   npm install
   # or
   bun install
   ```

2. **Start the backend server**:
   ```bash
   # You need to create a start script or run the backend directly
   # The backend uses Hono and should be started on port 8081
   node backend/hono.ts
   # or
   bun run backend/hono.ts
   ```

3. **Verify the server is running**:
   - Open `http://localhost:8081/api` in your browser
   - You should see: `{"status":"ok","message":"API is running"}`

### Option 2: Use Mock Data (Temporary)
If you can't start the backend server, you can temporarily modify the app to use mock data instead of tRPC calls.

## Current Status
- ✅ Backend code exists and is properly configured
- ✅ tRPC routes are defined
- ✅ Database schema is available
- ❌ Backend server is not running
- ❌ Database tables may not be created yet

## Next Steps
1. Start the backend server
2. Run the database schema in Supabase (see `supabase-schema.sql`)
3. Test the connection by visiting the dashboard

## Files Involved
- `/backend/hono.ts` - Main backend server
- `/backend/trpc/app-router.ts` - tRPC routes
- `/lib/trpc.ts` - Frontend tRPC client
- `/.env` - Environment variables