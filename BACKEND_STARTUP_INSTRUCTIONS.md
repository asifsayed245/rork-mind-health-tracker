# Backend Server Startup Instructions

## Issue
The app is showing the error: "❌ Backend connection error: Unexpected token '<', "<!DOCTYPE "... is not valid JSON"

This error occurs because the backend server is not running.

## Solution
The backend server needs to be started automatically by the Rork platform. 

### For Platform Users (Recommended)
**Contact support** to have the backend started automatically. The platform should handle this automatically based on the `rork.config.json` configuration.

### For Developers (Manual Setup)
If you need to start the backend manually for development:

1. **Install Bun** (if not already installed):
   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```

2. **Start the backend server**:
   ```bash
   bun run backend/server.ts
   ```
   
   Or use the startup script:
   ```bash
   node start-backend.js
   ```

3. **Verify the backend is running**:
   - Open http://localhost:8081/api in your browser
   - You should see: `{"status":"ok","message":"API is running"}`

### Configuration Files
The backend configuration is defined in:
- `rork.config.json` - Platform configuration
- `backend/hono.ts` - Main backend application
- `backend/server.ts` - Server startup script

### Environment Variables
Make sure these are set in your `.env` file:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

## Expected Behavior
Once the backend is running:
- The app should connect automatically
- The backend status warning should disappear
- All tRPC queries should work properly
- Database operations should function correctly

## Support
If you continue to experience issues, please contact support with:
- This error message
- Your project configuration
- Any console logs from the browser/app