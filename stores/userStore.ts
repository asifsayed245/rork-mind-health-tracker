import { create } from 'zustand';
import { combine } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserProfile {
  id: string;
  name: string;
  streak: number;
  isPremium: boolean;
  onboardingCompleted: boolean;
  notificationsEnabled: boolean;
  biometricLockEnabled: boolean;
  theme: 'dark' | 'light';
  createdAt: string;
}



export const useUserStore = create(
  combine(
    {
      profile: null as UserProfile | null,
      isLoading: true,
    },
    (set, get) => ({
      setProfile: (profile: UserProfile) => set({ profile }),
      
      updateProfile: async (updates: Partial<UserProfile>) => {
        const currentProfile = get().profile;
        if (currentProfile) {
          const updatedProfile = { ...currentProfile, ...updates };
          set({ profile: updatedProfile });
          try {
            await AsyncStorage.setItem('userProfile', JSON.stringify(updatedProfile));
          } catch (error) {
            console.error('Failed to save profile:', error);
          }
        }
      },
      
      loadProfile: async () => {
        try {
          const stored = await AsyncStorage.getItem('userProfile');
          if (stored) {
            const profile = JSON.parse(stored);
            set({ profile, isLoading: false });
          } else {
            const defaultProfile: UserProfile = {
              id: Date.now().toString(),
              name: 'User',
              streak: 0,
              isPremium: false,
              onboardingCompleted: false,
              notificationsEnabled: true,
              biometricLockEnabled: false,
              theme: 'dark',
              createdAt: new Date().toISOString(),
            };
            set({ profile: defaultProfile, isLoading: false });
            await AsyncStorage.setItem('userProfile', JSON.stringify(defaultProfile));
          }
        } catch (error) {
          console.error('Failed to load profile:', error);
          set({ isLoading: false });
        }
      },
      
      saveProfile: async () => {
        const profile = get().profile;
        if (profile) {
          try {
            await AsyncStorage.setItem('userProfile', JSON.stringify(profile));
          } catch (error) {
            console.error('Failed to save profile:', error);
          }
        }
      },
    })
  )
);