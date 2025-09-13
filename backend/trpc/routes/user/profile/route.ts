import { z } from 'zod';
import { protectedProcedure, handleDatabaseError } from '@/backend/trpc/create-context';
import type { Updates } from '@/lib/supabase';

export const getUserProfileProcedure = protectedProcedure.query(async ({ ctx }) => {
  const { supabase, user } = ctx;
  console.log('getUserProfile - fetching for user:', user.id);
  
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error) {
    // If profile doesn't exist, create it
    if (error.code === 'PGRST116') {
      console.log('getUserProfile - profile not found, creating new profile for user:', user.id);
      
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          user_id: user.id,
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          streak: 0,
          is_premium: false,
          onboarding_completed: false,
          notifications_enabled: true,
          biometric_lock_enabled: false,
          theme: 'dark'
        })
        .select()
        .single();
      
      if (createError) {
        console.error('Error creating profile:', {
          message: createError.message,
          details: createError.details,
          hint: createError.hint,
          code: createError.code
        });
        handleDatabaseError(createError, 'createUserProfile');
      }
      
      console.log('getUserProfile - new profile created:', !!newProfile);
      return newProfile;
    }
    
    handleDatabaseError(error, 'getUserProfile');
  }

  console.log('getUserProfile - success:', !!profile);
  return profile;
});

export const updateUserProfileProcedure = protectedProcedure
  .input(
    z.object({
      name: z.string().optional(),
      theme: z.enum(['dark', 'light']).optional(),
      notifications_enabled: z.boolean().optional(),
      biometric_lock_enabled: z.boolean().optional(),
      onboarding_completed: z.boolean().optional(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { supabase, user } = ctx;

    const updateData: Updates<'profiles'> = {
      ...input,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('profiles')
      .update(updateData as any)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      handleDatabaseError(error, 'updateUserProfile');
    }

    return data;
  });

export const initializeUserDataProcedure = protectedProcedure.mutation(async ({ ctx }) => {
  const { supabase, user } = ctx;
  console.log('initializeUserData - initializing for user:', user.id);
  
  // Check if profile exists, create if not
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();
  
  let profile = existingProfile;
  
  if (!existingProfile) {
    console.log('initializeUserData - creating profile for user:', user.id);
    const { data: newProfile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: user.id,
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        streak: 0,
        is_premium: false,
        onboarding_completed: false,
        notifications_enabled: true,
        biometric_lock_enabled: false,
        theme: 'dark'
      })
      .select()
      .single();
    
    if (profileError) {
      console.error('Error creating profile in initialize:', {
        message: profileError.message,
        details: profileError.details,
        hint: profileError.hint,
        code: profileError.code
      });
      handleDatabaseError(profileError, 'createUserProfile');
    }
    
    profile = newProfile;
  }
  
  // Check if user settings exist, create if not
  const { data: existingSettings } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', user.id)
    .single();
  
  let settings = existingSettings;
  
  if (!existingSettings) {
    console.log('initializeUserData - creating settings for user:', user.id);
    const { data: newSettings, error: settingsError } = await supabase
      .from('user_settings')
      .insert({
        user_id: user.id,
        notif_morning: '08:00',
        notif_afternoon: '14:00',
        notif_evening: '18:00',
        notif_night: '21:00',
        thresholds: {
          moodLowCutoff: 2.5,
          stressHighCutoff: 3.5,
          energyLowCutoff: 2.5,
          minSlotsPerDay: 2,
          streakDaysRequired: 3
        }
      })
      .select()
      .single();
    
    if (settingsError) {
      console.error('Error creating settings in initialize:', {
        message: settingsError.message,
        details: settingsError.details,
        hint: settingsError.hint,
        code: settingsError.code
      });
      handleDatabaseError(settingsError, 'createUserSettings');
    }
    
    settings = newSettings;
  }
  
  console.log('initializeUserData - success for user:', user.id);
  return {
    profile,
    settings,
    initialized: true
  };
});