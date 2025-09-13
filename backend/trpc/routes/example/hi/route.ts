import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";

export const hiProcedure = publicProcedure
  .input(z.object({ name: z.string() }))
  .mutation(({ input }) => {
    return {
      hello: input.name,
      date: new Date(),
    };
  });

export const testDbProcedure = publicProcedure.query(async ({ ctx }) => {
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    const { error } = await ctx.supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Database test error:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      
      return {
        success: false,
        error: {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        },
        timestamp: new Date().toISOString()
      };
    }
    
    console.log('Database connection successful');
    return {
      success: true,
      message: 'Database connection successful',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Database connection test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    };
  }
});

export default hiProcedure;