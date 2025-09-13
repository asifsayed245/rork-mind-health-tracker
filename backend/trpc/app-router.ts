import { createTRPCRouter, publicProcedure } from "./create-context";

// Import all your route procedures
import hiRoute from "./routes/example/hi/route";
import { 
  getUserProfileProcedure, 
  updateUserProfileProcedure, 
  initializeUserDataProcedure 
} from "./routes/user/profile/route";
import { 
  getCheckInsProcedure, 
  createCheckInProcedure, 
  getTodayCheckInsProcedure 
} from "./routes/checkins/route";
import { 
  getJournalEntriesProcedure, 
  createJournalEntryProcedure, 
  updateJournalEntryProcedure, 
  deleteJournalEntryProcedure, 
  getJournalEntryCountsProcedure 
} from "./routes/journal/route";

export const appRouter = createTRPCRouter({
  // Example routes
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  
  // Health check routes
  health: createTRPCRouter({
    dbTest: publicProcedure.query(async ({ ctx }) => {
      try {
        console.log('Testing database connection...');
        
        // Test basic connection first
        const { data: connectionTest, error: connectionError } = await ctx.supabase
          .from('profiles')
          .select('count')
          .limit(1);
        
        if (connectionError) {
          console.error('Database connection error:', {
            message: connectionError.message,
            details: connectionError.details,
            hint: connectionError.hint,
            code: connectionError.code
          });
          
          // If table doesn't exist, that's expected for first run
          if (connectionError.code === '42P01') {
            return { 
              status: 'warning', 
              message: 'Database connected but tables not found. Please run the SQL schema in Supabase.',
              error: connectionError
            };
          }
          
          throw new Error(`Database error: ${connectionError.message}`);
        }
        
        console.log('Database connection and tables verified successfully');
        return { 
          status: 'ok', 
          message: 'Database connection and tables verified successfully',
          data: connectionTest
        };
      } catch (err) {
        console.error('Database connection test failed:', err);
        throw new Error(`Database connection failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }),
  }),
  
  // User routes
  user: createTRPCRouter({
    getProfile: getUserProfileProcedure,
    updateProfile: updateUserProfileProcedure,
    initialize: initializeUserDataProcedure,
  }),
  
  // Check-ins routes
  checkIns: createTRPCRouter({
    getAll: getCheckInsProcedure,
    create: createCheckInProcedure,
    getToday: getTodayCheckInsProcedure,
  }),
  
  // Journal routes
  journal: createTRPCRouter({
    getEntries: getJournalEntriesProcedure,
    create: createJournalEntryProcedure,
    update: updateJournalEntryProcedure,
    delete: deleteJournalEntryProcedure,
    getCounts: getJournalEntryCountsProcedure,
  }),
});

export type AppRouter = typeof appRouter;