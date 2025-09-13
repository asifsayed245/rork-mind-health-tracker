import { protectedProcedure } from '@/backend/trpc/create-context';
import { supabase } from '@/lib/supabase';

export const getJournalEntriesProcedure = protectedProcedure
  .query(async ({ ctx }) => {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', ctx.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch journal entries: ${error.message}`);
    }

    return data || [];
  });