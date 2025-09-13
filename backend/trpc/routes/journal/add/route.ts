import { z } from 'zod';
import { protectedProcedure } from '@/backend/trpc/create-context';
import { supabase } from '@/lib/supabase';

export const addJournalEntryProcedure = protectedProcedure
  .input(z.object({
    type: z.enum(['positive', 'negative', 'gratitude', 'free', 'reflection']),
    title: z.string(),
    content: z.string(),
    mood: z.number().min(1).max(5),
    tags: z.array(z.string()).optional(),
    audioUri: z.string().optional(),
    meta: z.any().optional(),
  }))
  .mutation(async ({ input, ctx }) => {
    const { data, error } = await supabase
      .from('journal_entries')
      .insert({
        user_id: ctx.user.id,
        type: input.type,
        title: input.title,
        content: input.content,
        mood: input.mood,
        tags: input.tags || [],
        audio_uri: input.audioUri || null,
        meta: input.meta || null,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add journal entry: ${error.message}`);
    }

    return data;
  });