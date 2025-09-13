import { protectedProcedure } from '@/backend/trpc/create-context';

export const getCheckInsProcedure = protectedProcedure
  .query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from('check_ins')
      .select('*')
      .eq('user_id', ctx.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch check-ins: ${error.message}`);
    }

    return data || [];
  });