import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import type { UserProfileRow } from '@/lib/supabase';

interface UserProfileState {
  profile: UserProfileRow | null;
  loading: boolean;
  error: string | null;
  fetchProfile: () => Promise<void>;
  updateProfile: (data: Partial<UserProfileRow>) => Promise<void>;
  hasProfile: boolean;
}

export const [UserProfileProvider, useUserProfile] = createContextHook<UserProfileState>(() => {
  const [profile, setProfile] = useState<UserProfileRow | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getProfileQuery = trpc.profile.get.useQuery({
    enabled: false, // We'll manually trigger this
    retry: false,
  });

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const profileData = await getProfileQuery.refetch();
      if (profileData.data) {
        setProfile(profileData.data);
      } else {
        setProfile(null);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to fetch profile');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [getProfileQuery]);

  const updateProfile = useCallback(async (data: Partial<UserProfileRow>) => {
    if (!profile) return;
    
    setLoading(true);
    setError(null);
    try {
      // Update local state optimistically
      setProfile(prev => prev ? { ...prev, ...data } : null);
      
      // TODO: Add update profile mutation when needed
      console.log('Profile update:', data);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
      // Revert optimistic update
      await fetchProfile();
    } finally {
      setLoading(false);
    }
  }, [profile, fetchProfile]);

  const hasProfile = profile !== null;

  return useMemo(() => ({
    profile,
    loading,
    error,
    fetchProfile,
    updateProfile,
    hasProfile,
  }), [profile, loading, error, fetchProfile, updateProfile, hasProfile]);
});