import { protectedProcedure } from '@/backend/trpc/create-context';

export const getProfileProcedure = protectedProcedure
  .query(async ({ ctx }) => {
    const { supabase, user } = ctx;
    
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No profile found
        return null;
      }
      console.error('Error fetching user profile:', error);
      throw new Error('Failed to fetch user profile');
    }
    
    return data;
  });