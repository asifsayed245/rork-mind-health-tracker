import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase';

const supabaseUrl = 'https://idpluynoftfxthsjbkhl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkcGx1eW5vZnRmeHRoc2pia2hsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3NzI4NzMsImV4cCI6MjA3MzM0ODg3M30.fTuklWvF1-9CS3LZ5by1l4z44HZ0usc8rfFGpWNXggM';

// Context creation function
export const createContext = async (opts: FetchCreateContextFnOptions) => {
  // Get the authorization header
  const authHeader = opts.req.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  
  // Create a Supabase client for this request with proper typing
  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      headers: token ? {
        Authorization: `Bearer ${token}`
      } : {}
    }
  });
  
  let user = null;
  if (token) {
    // Get user from token
    const { data: { user: authUser }, error } = await supabase.auth.getUser(token);
    if (!error && authUser) {
      user = authUser;
    }
  }

  return {
    req: opts.req,
    user,
    supabase,
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
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource',
    });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});