import { createTRPCReact } from "@trpc/react-query";
import { httpLink, loggerLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";
import { supabase } from "@/lib/supabase";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  // Check for explicit API base URL (rork.com sets this)
  if (process.env.EXPO_PUBLIC_RORK_API_BASE_URL) {
    console.log('tRPC baseUrl (rork.com backend):', process.env.EXPO_PUBLIC_RORK_API_BASE_URL);
    return process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  }

  // For rork.com web environment - use same origin for backend routing
  if (typeof window !== 'undefined' && window.location && window.location.origin.includes('exp.direct')) {
    const baseUrl = window.location.origin;
    console.log('tRPC baseUrl (rork.com tunnel):', baseUrl);
    return baseUrl;
  }
  
  // For local development outside rork.com
  if (__DEV__ && typeof window !== 'undefined' && window.location && window.location.hostname === 'localhost') {
    const fallback = 'http://localhost:3001';
    console.log('tRPC baseUrl (local development):', fallback);
    return fallback;
  }
  
  // Check if running on Rork platform (web)
  if (typeof window !== 'undefined' && window.location) {
    const baseUrl = window.location.origin;
    console.log('tRPC baseUrl (web origin):', baseUrl);
    return baseUrl;
  }

  // For mobile on Rork platform, try to detect the tunnel URL
  if (process.env.EXPO_PUBLIC_TUNNEL_URL) {
    console.log('tRPC baseUrl (tunnel):', process.env.EXPO_PUBLIC_TUNNEL_URL);
    return process.env.EXPO_PUBLIC_TUNNEL_URL;
  }

  // For production, assume same origin
  console.log('tRPC baseUrl (production fallback): empty string');
  return '';
};

// Check if backend is available
const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const baseUrl = getBaseUrl();
    if (!baseUrl) return false;
    
    const response = await fetch(`${baseUrl}/api`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    
    return response.ok;
  } catch (error) {
    console.log('Backend health check failed:', error);
    return false;
  }
};

// Create a function to get the current session token
const getAuthToken = async (): Promise<string> => {
  try {
    console.log('tRPC auth - getting session...');
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('tRPC auth - session error:', {
        message: error.message,
        status: error.status,
        name: error.name
      });
      return '';
    }
    
    if (!session) {
      console.log('tRPC auth - no session available');
      return '';
    }
    
    if (!session.access_token) {
      console.log('tRPC auth - session exists but no access token');
      return '';
    }
    
    console.log('tRPC auth - token retrieved successfully:', {
      userId: session.user?.id,
      email: session.user?.email,
      tokenLength: session.access_token.length,
      expiresAt: session.expires_at
    });
    return session.access_token;
  } catch (error) {
    console.error('tRPC auth - error getting session:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return '';
  }
};

export const trpcClient = trpc.createClient({
  links: [
    loggerLink({
      enabled: () => __DEV__,
      logger(opts) {
        const { type, path, direction } = opts;
        
        if (type === 'query' && direction === 'up') {
          console.log(`>> tRPC query: ${path}`);
        }
        
        if (type === 'query' && direction === 'down') {
          console.log(`<< tRPC query: ${path} completed`);
        }
        
        if (type === 'mutation' && direction === 'up') {
          console.log(`>> tRPC mutation: ${path}`);
        }
        
        if (type === 'mutation' && direction === 'down') {
          console.log(`<< tRPC mutation: ${path} completed`);
        }
      },
    }),
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      async headers() {
        const token = await getAuthToken();
        const headers = {
          authorization: token ? `Bearer ${token}` : '',
        };
        console.log('tRPC headers - sending headers:', {
          hasAuth: !!headers.authorization,
          authLength: headers.authorization.length
        });
        return headers;
      },
      fetch(url, options) {
        console.log('tRPC fetch - attempting request to:', url);
        console.log('tRPC fetch - base URL:', getBaseUrl());
        
        return fetch(url, {
          ...options,
          headers: {
            ...options?.headers,
          },
        }).then(async (response) => {
          console.log('tRPC fetch - response status:', response.status);
          
          if (!response.ok) {
            console.error('tRPC fetch error:', {
              status: response.status,
              statusText: response.statusText,
              url
            });
            
            // Try to get error details
            try {
              const errorText = await response.text();
              console.error('tRPC error response:', errorText);
              
              // Check if we're getting HTML instead of JSON (common when backend is not running)
              if (errorText.includes('<!DOCTYPE') || errorText.includes('<html>') || errorText.includes('<title>')) {
                console.error('❌ Backend connection error: Unexpected token \'<\', "<!DOCTYPE "... is not valid JSON');
                console.error('This usually means the backend server is not running or misconfigured');
                console.error('URL attempted:', url);
                console.error('Base URL:', getBaseUrl());
                
                // Throw a proper error that tRPC can handle
                throw new Error('Backend server not running: Unexpected token \'<\', "<!DOCTYPE "... is not valid JSON');
              }
            } catch (e) {
              console.error('Could not read error response:', e);
            }
          }
          return response;
        }).catch((error) => {
          // Handle network errors (backend not running)
          if (error.message.includes('Failed to fetch') || error.message.includes('Network request failed') || error.message.includes('Backend server not running')) {
            console.error('❌ Backend connection error: Network error or backend not running:', error.message);
          } else {
            console.error('❌ Backend connection error:', {
              message: error.message,
              url,
              baseUrl: getBaseUrl()
            });
          }
          
          // For development, provide helpful error message
          if (__DEV__) {
            console.warn('🔧 Rork.com Backend Setup:');
            console.warn('1. Make sure backend is enabled in rork.config.json');
            console.warn('2. Backend should start automatically with the platform');
            console.warn('3. Check rork.com dashboard for backend status');
          }
          
          // Re-throw the error so tRPC can handle it properly
          throw error;
        });
      },
    }),
  ],
});