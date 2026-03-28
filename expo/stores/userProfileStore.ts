import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { trpcClient } from '@/lib/trpc';
import type { UserProfileRow } from '@/lib/supabase';
import { useAuth } from './authStore';

interface UserProfileState {
  profile: UserProfileRow | null;
  loading: boolean;
  error: string | null;
  fetchProfile: () => Promise<void>;
  updateProfile: (data: Partial<UserProfileRow>) => Promise<void>;
  hasProfile: boolean;
  refetch: () => void;
}

export const [UserProfileProvider, useUserProfile] = createContextHook<UserProfileState>(() => {
  const [profile, setProfile] = useState<UserProfileRow | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, user } = useAuth();

  const fetchProfile = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setProfile(null);
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching profile for user:', user.id);
      const profileData = await trpcClient.profile.get.query();
      console.log('Profile fetched successfully:', profileData);
      setProfile(profileData);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to fetch profile');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

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

  const refetch = useCallback(() => {
    fetchProfile();
  }, [fetchProfile]);

  const hasProfile = useMemo(() => profile !== null, [profile]);

  // Auto-fetch profile when user becomes authenticated
  useEffect(() => {
    if (isAuthenticated && user && !profile && !loading) {
      console.log('Auto-fetching profile for authenticated user');
      fetchProfile();
    }
  }, [isAuthenticated, user, profile, loading, fetchProfile]);

  // Clear profile when user signs out
  useEffect(() => {
    if (!isAuthenticated || !user) {
      console.log('User signed out, clearing profile');
      setProfile(null);
      setError(null);
    }
  }, [isAuthenticated, user]);

  return useMemo(() => ({
    profile,
    loading,
    error,
    fetchProfile,
    updateProfile,
    hasProfile,
    refetch,
  }), [profile, loading, error, fetchProfile, updateProfile, hasProfile, refetch]);
});