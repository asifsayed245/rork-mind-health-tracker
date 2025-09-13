import { z } from 'zod';
import { protectedProcedure, handleDatabaseError } from '@/backend/trpc/create-context';

export const getJournalEntriesProcedure = protectedProcedure
  .input(
    z.object({
      type: z.enum(['all', 'positive', 'negative', 'gratitude', 'free', 'reflection']).optional(),
      limit: z.number().optional(),
      offset: z.number().optional(),
    })
  )
  .query(async ({ ctx, input }) => {
    const { supabase, user } = ctx;
    console.log('getJournalEntries - fetching for user:', user.id, 'type:', input.type);
    
    let query = supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('timestamp', { ascending: false });

    if (input.type && input.type !== 'all') {
      query = query.eq('type', input.type);
    }

    if (input.limit) {
      query = query.limit(input.limit);
    }

    if (input.offset) {
      query = query.range(input.offset, input.offset + (input.limit || 10) - 1);
    }

    const { data: entries, error } = await query;

    if (error) {
      handleDatabaseError(error, 'getJournalEntries');
    }

    console.log('getJournalEntries - success, count:', entries?.length || 0);
    return entries;
  });

export const createJournalEntryProcedure = protectedProcedure
  .input(
    z.object({
      type: z.enum(['positive', 'negative', 'gratitude', 'free', 'reflection']),
      title: z.string(),
      content: z.string(),
      mood: z.number().min(1).max(5),
      tags: z.array(z.string()).optional(),
      meta: z.any().optional(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { supabase, user } = ctx;

    const now = new Date();
    const { data, error } = await supabase
      .from('journal_entries')
      .insert({
        user_id: user.id,
        type: input.type,
        title: input.title,
        content: input.content,
        mood: input.mood,
        tags: input.tags || [],
        meta: input.meta || null,
        timestamp: now.toISOString(),
        date: now.toISOString().split('T')[0],
      })
      .select()
      .single();

    if (error) {
      handleDatabaseError(error, 'createJournalEntry');
    }

    return data;
  });

export const updateJournalEntryProcedure = protectedProcedure
  .input(
    z.object({
      id: z.string(),
      title: z.string().optional(),
      content: z.string().optional(),
      mood: z.number().min(1).max(5).optional(),
      tags: z.array(z.string()).optional(),
      meta: z.any().optional(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { supabase, user } = ctx;

    const { id, ...updates } = input;

    const { data, error } = await supabase
      .from('journal_entries')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      handleDatabaseError(error, 'updateJournalEntry');
    }

    return data;
  });

export const deleteJournalEntryProcedure = protectedProcedure
  .input(z.object({ id: z.string() }))
  .mutation(async ({ ctx, input }) => {
    const { supabase, user } = ctx;

    const { error } = await supabase
      .from('journal_entries')
      .delete()
      .eq('id', input.id)
      .eq('user_id', user.id);

    if (error) {
      handleDatabaseError(error, 'deleteJournalEntry');
    }

    return { success: true };
  });

export const getJournalEntryCountsProcedure = protectedProcedure.query(async ({ ctx }) => {
  const { supabase, user } = ctx;

  const { data: entries, error } = await supabase
    .from('journal_entries')
    .select('type')
    .eq('user_id', user.id);

  if (error) {
    handleDatabaseError(error, 'getJournalEntryCounts');
  }

  const counts = {
    all: entries?.length || 0,
    positive: entries?.filter(e => e.type === 'positive').length || 0,
    negative: entries?.filter(e => e.type === 'negative').length || 0,
    gratitude: entries?.filter(e => e.type === 'gratitude').length || 0,
    reflection: entries?.filter(e => e.type === 'reflection').length || 0,
  };

  return counts;
});