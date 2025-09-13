import { z } from 'zod';
import { protectedProcedure } from '@/backend/trpc/create-context';
import { supabase } from '@/lib/supabase';

export const addCheckInProcedure = protectedProcedure
  .input(z.object({
    slot: z.enum(['morning', 'afternoon', 'evening', 'night']),
    mood: z.number().min(1).max(5),
    stress: z.number().min(1).max(5),
    energy: z.number().min(1).max(5),
    note: z.string().optional(),
  }))
  .mutation(async ({ input, ctx }) => {
    const { data, error } = await supabase
      .from('check_ins')
      .insert({
        user_id: ctx.user.id,
        slot: input.slot,
        mood: input.mood,
        stress: input.stress,
        energy: input.energy,
        note: input.note || null,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add check-in: ${error.message}`);
    }

    return data;
  });