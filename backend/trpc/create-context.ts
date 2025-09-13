import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { createClient } from '@supabase/supabase-js';

import type { User } from "@supabase/supabase-js";

// Create Supabase client for backend
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:');
  console.error('EXPO_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('EXPO_PUBLIC_SUPABASE_ANON_KEY:', !!supabaseAnonKey);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  throw new Error('Missing Supabase environment variables');
}

// Create admin client for backend operations (with service role key if available)
const adminSupabase = createClient(
  supabaseUrl, 
  supabaseServiceKey || supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Create regular client for user operations
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Auto-setup database schema if tables don't exist
const setupDatabaseSchema = async () => {
  try {
    console.log('🔍 Checking database schema...');
    
    // Check if profiles table exists using admin client
    const { error: profileError } = await adminSupabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (profileError && profileError.code === '42P01') {
      console.log('📋 Database tables not found. Attempting to set up schema...');
      
      if (!supabaseServiceKey) {
        console.error('❌ Cannot auto-setup database: SUPABASE_SERVICE_ROLE_KEY is required');
        console.error('Please manually run the SQL schema in Supabase SQL Editor.');
        console.error('Copy the content from supabase-schema.sql and execute it.');
        return;
      }
      
      // Try to read and execute the schema
      try {
        const fs = await import('fs');
        const path = await import('path');
        
        const schemaPath = path.join(process.cwd(), 'supabase-schema.sql');
        
        if (fs.existsSync(schemaPath)) {
          const schema = fs.readFileSync(schemaPath, 'utf8');
          
          console.log('📝 Executing database schema...');
          
          // Execute the entire schema as one query
          const { error: schemaError } = await adminSupabase.rpc('exec_sql', {
            sql: schema
          });
          
          if (schemaError) {
            console.error('❌ Schema execution failed:', schemaError.message);
            console.error('Please manually run the SQL schema in Supabase SQL Editor.');
          } else {
            console.log('✅ Database schema setup completed successfully');
          }
        } else {
          console.error('❌ Schema file not found at:', schemaPath);
          console.error('Please ensure supabase-schema.sql exists in the project root.');
        }
      } catch (setupError) {
        console.error('❌ Database schema setup failed:', setupError instanceof Error ? setupError.message : String(setupError));
        console.error('Please manually run the SQL schema in Supabase SQL Editor.');
      }
    } else if (profileError) {
      console.error('❌ Database connection error:', profileError.message);
    } else {
      console.log('✅ Database schema already exists');
    }
  } catch (error) {
    console.error('❌ Database schema check failed:', error instanceof Error ? error.message : String(error));
  }
};

// Initialize database schema on startup
setupDatabaseSchema();

// Context creation function
export const createContext = async (opts: FetchCreateContextFnOptions) => {
  // Get the authorization header
  const authHeader = opts.req.headers.get('authorization');
  console.log('tRPC Context - Request URL:', opts.req.url);
  console.log('tRPC Context - auth header present:', !!authHeader);
  console.log('tRPC Context - auth header value:', authHeader ? `Bearer ${authHeader.substring(7, 20)}...` : 'none');
  
  let user: User | null = null;
  let authenticatedSupabase = supabase;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      // Extract the token from "Bearer <token>"
      const token = authHeader.replace('Bearer ', '');
      console.log('tRPC Context - token extracted, length:', token.length);
      
      if (token.length < 10) {
        console.error('tRPC Context - token too short, likely invalid');
        return {
          req: opts.req,
          supabase,
          user: null,
        };
      }
      
      // Create an authenticated Supabase client with the user's token
      // This ensures RLS policies work correctly by setting the Authorization header
      authenticatedSupabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      });
      
      // Get user from Supabase
      const { data: { user: authUser }, error } = await supabase.auth.getUser(token);
      
      if (error) {
        console.error('tRPC Context - Supabase auth error:', {
          message: error.message,
          status: error.status,
          name: error.name
        });
      } else if (authUser) {
        user = authUser;
        console.log('tRPC Context - user authenticated successfully:', {
          id: authUser.id,
          email: authUser.email,
          aud: authUser.aud
        });
      } else {
        console.log('tRPC Context - no user returned from Supabase');
      }
    } catch (error) {
      console.error('tRPC Context - Auth error:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  } else {
    console.log('tRPC Context - no valid authorization header (missing Bearer prefix or empty)');
  }
  
  return {
    req: opts.req,
    supabase: authenticatedSupabase,
    user,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;

// Initialize tRPC
const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

// Protected procedure that requires authentication
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  console.log('Protected procedure - user exists:', !!ctx.user, ctx.user?.id);
  
  if (!ctx.user) {
    console.error('Protected procedure - no user found in context');
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource',
    });
  }
  
  return next({
    ctx: {
      ...ctx,
      user: ctx.user, // Ensure user is not null
    },
  });
});

// Helper function to handle database errors properly
export const handleDatabaseError = (error: any, operation: string) => {
  console.error(`Database error in ${operation}:`, {
    message: error.message,
    details: error.details,
    hint: error.hint,
    code: error.code,
    operation
  });
  
  // Check if tables don't exist
  if (error.code === '42P01') {
    throw new TRPCError({
      code: 'PRECONDITION_FAILED',
      message: 'Database tables not found. Please run the SQL schema in Supabase SQL Editor first. Copy the content from supabase-schema.sql and execute it.',
      cause: error
    });
  }
  
  // Check for authentication/authorization errors
  if (error.code === 'PGRST301' || error.message?.includes('JWT')) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication failed. Please log in again.',
      cause: error
    });
  }
  
  // Check for RLS policy violations
  if (error.code === '42501' || error.message?.includes('policy')) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Access denied. You can only access your own data.',
      cause: error
    });
  }
  
  // Generic database error
  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: `${operation} failed: ${error.message || 'Unknown database error'}`,
    cause: error
  });
};