# Backend Server Fix

## Problem
The app is showing "tRPC network error - Backend server not running" because the backend server is not started.

## Quick Fix

### Option 1: Start Backend Server (Recommended)
Run this command in your terminal:

```bash
node start-backend.js
```

This will start the backend server on `http://localhost:8081`.

### Option 2: Manual Backend Start
If the above doesn't work, try:

```bash
bun run backend/hono.ts
```

### Option 3: Alternative Runtime
If you don't have bun installed:

```bash
npx tsx backend/hono.ts
```

## Verification
1. After starting the backend, visit: `http://localhost:8081/api`
2. You should see: `{"status":"ok","message":"API is running"}`
3. Test database connection: `http://localhost:8081/api/test-db`

## What This Fixes
- ✅ tRPC network errors
- ✅ Backend API connectivity
- ✅ Database connection testing
- ✅ User authentication flows
- ✅ Data fetching in the app

## Platform Note
On the Rork platform, the backend should start automatically. If you're still seeing this error after following the steps above, please contact support as this indicates a platform configuration issue.

## Files Modified
- `lib/trpc.ts` - Better error handling
- `contexts/AuthContext.tsx` - Improved connection testing
- `start-backend.js` - Backend startup script
- `.env` - Backend URL configuration

The app will now show more helpful error messages and won't crash when the backend is unavailable.