import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { cors } from "hono/cors";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";

// Create the main app - this will be mounted at /api by the Rork platform
const app = new Hono();

// Add error handling middleware first
app.onError((err, c) => {
  console.error('❌ Backend error:', {
    message: err?.message || 'Unknown error',
    stack: err?.stack,
    url: c.req.url,
    method: c.req.method,
    timestamp: new Date().toISOString()
  });
  return c.json({ 
    error: 'Internal server error', 
    message: err?.message || 'Unknown error occurred',
    timestamp: new Date().toISOString()
  }, 500);
});

// Add comprehensive logging middleware
app.use('*', async (c, next) => {
  const start = Date.now();
  console.log(`📡 ${c.req.method} ${c.req.url}`);
  
  await next();
  
  const end = Date.now();
  console.log(`✅ ${c.req.method} ${c.req.url} - ${c.res.status} (${end - start}ms)`);
});

// Enable CORS for all routes with comprehensive configuration
app.use("*", cors({
  origin: [
    "http://localhost:8081", 
    "http://localhost:3000", 
    "http://localhost:19006",
    "http://localhost:19000",
    /^https:\/\/.*\.rork\.com$/,
    /^https:\/\/.*\.ngrok\.io$/,
    /^https:\/\/.*\.ngrok-free\.app$/
  ],
  credentials: true,
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowHeaders: ["Content-Type", "Authorization", "Accept", "Origin", "X-Requested-With"],
  exposeHeaders: ["Content-Length", "X-Kuma-Revision"]
}));

// Mount tRPC router at /trpc - Multiple approaches for compatibility
console.log('🔧 Setting up tRPC routes...');

// Primary tRPC setup
app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext,
  })
);

// Backup tRPC handler for any missed routes
app.all("/trpc/*", async (c) => {
  console.log('🔄 Fallback tRPC handler:', c.req.method, c.req.url);
  try {
    return await trpcServer({
      router: appRouter,
      createContext,
    })(c.req.raw);
  } catch (error) {
    console.error('❌ tRPC handler error:', error);
    return c.json({ 
      error: 'tRPC handler failed', 
      details: error instanceof Error ? error.message : String(error) 
    }, 500);
  }
});

// Simple health check endpoint at /api/
app.get("/", (c) => {
  console.log('🏥 Health check endpoint hit at /api/');
  return c.json({ 
    status: "ok", 
    message: "🚀 Hono API is running with Bun!",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    runtime: "bun",
    bunVersion: typeof Bun !== 'undefined' ? Bun.version : 'unknown',
    endpoints: {
      health: "/api/",
      ping: "/api/ping", 
      trpc: "/api/trpc",
      trpcTest: "/api/trpc-test",
      testDb: "/api/test-db",
      setupDb: "/api/setup-db"
    }
  });
});

// Add a simple ping endpoint
app.get("/ping", (c) => {
  console.log('🏓 Ping endpoint hit at /api/ping');
  return c.json({ 
    message: 'pong', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Test tRPC endpoint manually (for debugging)
app.get("/trpc-test", (c) => {
  console.log('🧪 tRPC test endpoint hit');
  return c.json({ 
    message: "✅ tRPC endpoint is reachable",
    note: "Actual tRPC calls should be POST to /api/trpc with proper tRPC format",
    trpcEndpoint: "/api/trpc",
    availableRoutes: "Check your app-router.ts for available procedures"
  });
});

// Database connection test endpoint
app.get("/test-db", async (c) => {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    
    console.log('🗄️  Testing database connection...');
    console.log('Supabase URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
    console.log('Supabase Key:', supabaseAnonKey ? '✅ Set' : '❌ Missing');
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return c.json({ 
        status: "error", 
        message: "❌ Missing Supabase environment variables",
        details: {
          hasUrl: !!supabaseUrl,
          hasKey: !!supabaseAnonKey,
          envVars: {
            EXPO_PUBLIC_SUPABASE_URL: supabaseUrl ? 'SET' : 'MISSING',
            EXPO_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey ? 'SET' : 'MISSING'
          }
        }
      }, 500);
    }
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log('✅ Supabase client created successfully');
    
    // Test basic connection
    const { data: authData, error: authError } = await supabase.auth.getSession();
    console.log('🔐 Auth test result:', { hasData: !!authData, error: authError?.message });
    
    // Test required tables
    const tables = ['profiles', 'user_settings', 'check_ins', 'journal_entries', 'activity_sessions'];
    const tableResults = [];
    
    for (const table of tables) {
      try {
        const { error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        tableResults.push({
          table,
          exists: !error,
          error: error?.message
        });
      } catch (err) {
        tableResults.push({
          table,
          exists: false,
          error: err instanceof Error ? err.message : String(err)
        });
      }
    }
    
    const missingTables = tableResults.filter(t => !t.exists);
    
    if (missingTables.length > 0) {
      return c.json({ 
        status: "warning", 
        message: `⚠️  Database connected but ${missingTables.length} tables are missing`,
        instructions: "Please run the SQL schema in Supabase SQL Editor. Copy the content from supabase-schema.sql and execute it.",
        tableResults,
        missingTables: missingTables.map(t => t.table)
      }, 200);
    }
    
    return c.json({ 
      status: "ok", 
      message: "✅ Database connection and all tables verified successfully",
      supabaseUrl: supabaseUrl,
      tableResults,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('❌ Database connection test failed:', errorMsg);
    return c.json({ 
      status: "error", 
      message: "❌ Database connection test failed",
      error: errorMsg
    }, 500);
  }
});

// Database setup endpoint (simplified for Bun environment)
app.post("/setup-db", async (c) => {
  try {
    return c.json({ 
      status: "info", 
      message: "🛠️  Manual database setup required",
      instructions: [
        "1. Go to your Supabase project dashboard",
        "2. Navigate to SQL Editor",
        "3. Copy the contents of your supabase-schema.sql file",
        "4. Execute the SQL statements",
        "5. Test again using /api/test-db"
      ],
      reason: "File system access is limited in this environment"
    }, 200);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('❌ Database setup failed:', errorMsg);
    return c.json({ 
      status: "error", 
      message: "❌ Database setup failed",
      error: errorMsg
    }, 500);
  }
});

console.log('✅ Hono app configured successfully');

export default app;