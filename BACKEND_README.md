# Mind Health Tracker - Backend Setup

## Backend Connection Error Fix

The error "Unexpected token '<', "<!DOCTYPE "..." indicates that the tRPC client is receiving an HTML response instead of JSON. This happens when the backend server is not running.

## Rork Platform Integration

This app uses a Hono backend with tRPC for API communication. The backend needs to be automatically started by the Rork platform.

### Configuration Files

1. **rork.config.json** - Tells Rork platform how to handle the backend
2. **backend/hono.ts** - Main backend application
3. **backend/server.ts** - Server entry point
4. **lib/trpc.ts** - tRPC client configuration

### Backend Features

- **Health Check**: `GET /api` - Returns server status
- **Database Test**: `GET /api/test-db` - Tests Supabase connection
- **tRPC API**: `/api/trpc/*` - All app API endpoints

### Error Handling

The app includes:
- Backend status monitoring
- Automatic retry functionality  
- User-friendly error messages
- Graceful fallbacks when backend is unavailable

### Development

To run the backend locally:
```bash
bun run backend/server.ts
```

The backend will start on port 8081 and provide:
- API health check: http://localhost:8081/api
- Database test: http://localhost:8081/api/test-db
- tRPC endpoint: http://localhost:8081/api/trpc

### Platform Integration

The Rork platform should automatically:
1. Detect the backend configuration in `rork.config.json`
2. Start the backend server using `backend/hono.ts`
3. Route `/api/*` requests to the backend
4. Handle environment variables and database connections

### Troubleshooting

If you see backend connection errors:
1. Check that the backend server is running
2. Verify environment variables are set
3. Test database connection at `/api/test-db`
4. Check browser console for detailed error messages

The app includes a BackendStatus component that will show connection status and provide retry functionality.