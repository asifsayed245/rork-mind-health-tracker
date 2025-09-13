import { z } from 'zod';
import { protectedProcedure, handleDatabaseError } from '@/backend/trpc/create-context';

export const getCheckInsProcedure = protectedProcedure
  .input(
    z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    })
  )
  .query(async ({ ctx, input }) => {
    const { supabase, user } = ctx;
    
    let query = supabase
      .from('check_ins')
      .select('*')
      .eq('user_id', user.id)
      .order('timestamp_iso', { ascending: false });

    if (input.startDate) {
      query = query.gte('timestamp_iso', input.startDate);
    }
    if (input.endDate) {
      query = query.lte('timestamp_iso', input.endDate);
    }

    const { data: checkIns, error } = await query;

    if (error) {
      handleDatabaseError(error, 'getCheckIns');
    }

    return checkIns;
  });

export const createCheckInProcedure = protectedProcedure
  .input(
    z.object({
      slot: z.enum(['morning', 'afternoon', 'evening', 'night']),
      mood: z.number().min(1).max(5),
      stress: z.number().min(1).max(5),
      energy: z.number().min(1).max(5),
      note: z.string().optional(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { supabase, user } = ctx;

    const { data, error } = await supabase
      .from('check_ins')
      .insert({
        user_id: user.id,
        slot: input.slot,
        mood: input.mood,
        stress: input.stress,
        energy: input.energy,
        note: input.note || null,
        timestamp_iso: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      handleDatabaseError(error, 'createCheckIn');
    }

    return data;
  });

export const getTodayCheckInsProcedure = protectedProcedure.query(async ({ ctx }) => {
  const { supabase, user } = ctx;
  console.log('getTodayCheckIns - fetching for user:', user.id);
  
  const today = new Date().toISOString().split('T')[0];
  console.log('getTodayCheckIns - today date:', today);
  
  const { data: checkIns, error } = await supabase
    .from('check_ins')
    .select('*')
    .eq('user_id', user.id)
    .gte('timestamp_iso', `${today}T00:00:00.000Z`)
    .lt('timestamp_iso', `${today}T23:59:59.999Z`)
    .order('timestamp_iso', { ascending: false });

  if (error) {
    handleDatabaseError(error, 'getTodayCheckIns');
  }

  console.log('getTodayCheckIns - success, count:', checkIns?.length || 0);
  return checkIns;
});