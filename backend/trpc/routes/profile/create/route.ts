import { z } from 'zod';
import { protectedProcedure } from '@/backend/trpc/create-context';
import type { Database } from '@/lib/supabase';

const createProfileSchema = z.object({
  fullName: z.string().min(2).max(100),
  age: z.number().int().min(13).max(120),
  gender: z.enum(['Male', 'Female', 'Other', 'Prefer not to say']).optional(),
  weight: z.number().positive().optional(),
  occupation: z.string().max(100).optional(),
  timezone: z.string().optional(),
  weightUnit: z.enum(['kg', 'lbs']).optional(),
});

export const createProfileProcedure = protectedProcedure
  .input(createProfileSchema)
  .mutation(async ({ ctx, input }) => {
    const { supabase, user } = ctx;
    
    console.log('Creating profile for user:', user.id);
    console.log('Profile data:', input);
    
    // Auto-detect timezone if not provided
    const timezone = input.timezone || 'UTC';
    
    const profileData: Database['public']['Tables']['user_profiles']['Insert'] = {
      user_id: user.id,
      full_name: input.fullName,
      age: input.age,
      gender: input.gender || 'Prefer not to say',
      weight: input.weight || null,
      occupation: input.occupation || null,
      timezone,
      weight_unit: input.weightUnit || 'kg',
    };
    
    console.log('Inserting profile data:', profileData);
    
    const { data, error } = await supabase
      .from('user_profiles')
      .insert(profileData as any)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating user profile:', error);
      throw new Error(`Failed to create user profile: ${error.message}`);
    }
    
    console.log('Profile created successfully:', data);
    return data;
  });