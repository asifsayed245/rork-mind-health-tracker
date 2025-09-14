import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useMemo } from 'react';
import { trpcClient } from '@/lib/trpc';
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

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const profileData = await trpcClient.profile.get.query();
      setProfile(profileData);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to fetch profile');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

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