import { create } from 'zustand';
import { combine } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CheckIn {
  id: string;
  userId?: string;
  slot: 'morning' | 'afternoon' | 'evening' | 'night';
  mood: number;
  stress: number;
  energy: number;
  note?: string;
  timestampISO: string;
}

export interface DailyAggregate {
  date: string;
  slotsCount: number;
  moodAvg: number;
  stressAvg: number;
  energyAvg: number;
}

export interface UserSettings {
  id: string;
  userId?: string;
  notifMorning?: string;
  notifAfternoon?: string;
  notifEvening?: string;
  notifNight?: string;
  thresholds: {
    moodLowCutoff: number;
    stressHighCutoff: number;
    energyLowCutoff: number;
    minSlotsPerDay: number;
    streakDaysRequired: number;
  };
  lastHeavyCardShownAt?: string;
  lastHeavyCardDismissedAt?: string;
}

export interface ActivitySession {
  id: string;
  type: 'breathing' | 'meditation' | 'exercise';
  duration: number;
  completed: boolean;
  timestamp: string;
  date: string;
  postMood?: number;
  postStress?: number;
}



export const useCheckInStore = create(
  combine(
    {
      checkIns: [] as CheckIn[],
      todayCheckIns: [] as CheckIn[],
      activitySessions: [] as ActivitySession[],
      userSettings: null as UserSettings | null,
      isLoading: true,
    },
    (set, get) => ({
      addCheckIn: async (checkInData: Omit<CheckIn, 'id' | 'timestampISO'>) => {
        const newCheckIn: CheckIn = {
          ...checkInData,
          id: Date.now().toString(),
          timestampISO: new Date().toISOString(),
        };
        
        const checkIns = [...get().checkIns, newCheckIn];
        const today = new Date().toISOString().split('T')[0];
        const todayCheckIns = checkIns.filter(c => c.timestampISO.split('T')[0] === today);
        
        set({ checkIns, todayCheckIns });
        
        try {
          await AsyncStorage.setItem('checkIns', JSON.stringify(checkIns));
        } catch (error) {
          console.error('Failed to save check-in:', error);
        }
      },
      
      loadCheckIns: async () => {
        try {
          const stored = await AsyncStorage.getItem('checkIns');
          const checkIns = stored ? JSON.parse(stored) : [];
          const today = new Date().toISOString().split('T')[0];
          const todayCheckIns = checkIns.filter((checkIn: CheckIn) => 
            checkIn.timestampISO?.split('T')[0] === today
          );
          set({ checkIns, todayCheckIns, isLoading: false });
        } catch (error) {
          console.error('Failed to load check-ins:', error);
          set({ isLoading: false });
        }
      },
      
      getTodayCheckIns: () => {
        return get().todayCheckIns;
      },
      
      getCheckInBySlot: (slot: CheckIn['slot']) => {
        return get().todayCheckIns.find(checkIn => checkIn.slot === slot) || null;
      },
      
      getCheckInsByDateRange: (startISO: string, endISO: string) => {
        return get().checkIns.filter(checkIn => {
          const checkInDate = checkIn.timestampISO.split('T')[0];
          return checkInDate >= startISO && checkInDate <= endISO;
        });
      },
      
      getDailyAggregates: (days: string[]): DailyAggregate[] => {
        return days.map(date => {
          const dayCheckIns = get().checkIns.filter(c => 
            c.timestampISO.split('T')[0] === date
          );
          
          if (dayCheckIns.length === 0) {
            return {
              date,
              slotsCount: 0,
              moodAvg: 0,
              stressAvg: 0,
              energyAvg: 0,
            };
          }
          
          return {
            date,
            slotsCount: dayCheckIns.length,
            moodAvg: dayCheckIns.reduce((sum, c) => sum + c.mood, 0) / dayCheckIns.length,
            stressAvg: dayCheckIns.reduce((sum, c) => sum + c.stress, 0) / dayCheckIns.length,
            energyAvg: dayCheckIns.reduce((sum, c) => sum + c.energy, 0) / dayCheckIns.length,
          };
        });
      },
      
      isToughDay: (agg: DailyAggregate, thresholds: UserSettings['thresholds']) => {
        return (
          agg.moodAvg <= thresholds.moodLowCutoff &&
          agg.stressAvg >= thresholds.stressHighCutoff &&
          agg.energyAvg <= thresholds.energyLowCutoff &&
          agg.slotsCount >= thresholds.minSlotsPerDay
        );
      },
      
      hasConsecutiveToughStreak: (aggs: DailyAggregate[], requiredDays: number) => {
        const settings = get().userSettings;
        if (!settings) return false;
        
        let consecutiveCount = 0;
        for (let i = aggs.length - 1; i >= 0; i--) {
          const isTough = (
            aggs[i].moodAvg <= settings.thresholds.moodLowCutoff &&
            aggs[i].stressAvg >= settings.thresholds.stressHighCutoff &&
            aggs[i].energyAvg <= settings.thresholds.energyLowCutoff &&
            aggs[i].slotsCount >= settings.thresholds.minSlotsPerDay
          );
          
          if (isTough) {
            consecutiveCount++;
            if (consecutiveCount >= requiredDays) {
              return true;
            }
          } else {
            consecutiveCount = 0;
          }
        }
        return false;
      },
      
      shouldShowHeavyCard: () => {
        const settings = get().userSettings;
        if (!settings) return false;
        
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          last7Days.push(date.toISOString().split('T')[0]);
        }
        
        const aggs = last7Days.map(date => {
          const dayCheckIns = get().checkIns.filter(c => 
            c.timestampISO.split('T')[0] === date
          );
          
          if (dayCheckIns.length === 0) {
            return {
              date,
              slotsCount: 0,
              moodAvg: 0,
              stressAvg: 0,
              energyAvg: 0,
            };
          }
          
          return {
            date,
            slotsCount: dayCheckIns.length,
            moodAvg: dayCheckIns.reduce((sum, c) => sum + c.mood, 0) / dayCheckIns.length,
            stressAvg: dayCheckIns.reduce((sum, c) => sum + c.stress, 0) / dayCheckIns.length,
            energyAvg: dayCheckIns.reduce((sum, c) => sum + c.energy, 0) / dayCheckIns.length,
          };
        });
        
        let consecutiveCount = 0;
        for (let i = aggs.length - 1; i >= 0; i--) {
          const isTough = (
            aggs[i].moodAvg <= settings.thresholds.moodLowCutoff &&
            aggs[i].stressAvg >= settings.thresholds.stressHighCutoff &&
            aggs[i].energyAvg <= settings.thresholds.energyLowCutoff &&
            aggs[i].slotsCount >= settings.thresholds.minSlotsPerDay
          );
          
          if (isTough) {
            consecutiveCount++;
            if (consecutiveCount >= settings.thresholds.streakDaysRequired) {
              break;
            }
          } else {
            consecutiveCount = 0;
          }
        }
        
        if (consecutiveCount < settings.thresholds.streakDaysRequired) return false;
        
        const lastShown = settings.lastHeavyCardShownAt ? new Date(settings.lastHeavyCardShownAt) : null;
        const lastDismissed = settings.lastHeavyCardDismissedAt ? new Date(settings.lastHeavyCardDismissedAt) : null;
        
        const sevenDaysAgoTime = sevenDaysAgo.getTime();
        
        if (lastShown && lastShown.getTime() > sevenDaysAgoTime) return false;
        if (lastDismissed && lastDismissed.getTime() > sevenDaysAgoTime) return false;
        
        return true;
      },
      
      markHeavyCardShown: async () => {
        const settings = get().userSettings;
        if (settings) {
          const updatedSettings = {
            ...settings,
            lastHeavyCardShownAt: new Date().toISOString(),
          };
          set({ userSettings: updatedSettings });
          try {
            await AsyncStorage.setItem('userSettings', JSON.stringify(updatedSettings));
          } catch (error) {
            console.error('Failed to save user settings:', error);
          }
        }
      },
      
      markHeavyCardDismissed: async () => {
        const settings = get().userSettings;
        if (settings) {
          const updatedSettings = {
            ...settings,
            lastHeavyCardDismissedAt: new Date().toISOString(),
          };
          set({ userSettings: updatedSettings });
          try {
            await AsyncStorage.setItem('userSettings', JSON.stringify(updatedSettings));
          } catch (error) {
            console.error('Failed to save user settings:', error);
          }
        }
      },
      
      getWeeklyAverage: () => {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        const recentCheckIns = get().checkIns.filter(
          checkIn => new Date(checkIn.timestampISO) >= weekAgo
        );
        
        if (recentCheckIns.length === 0) return 0;
        
        const average = recentCheckIns.reduce(
          (sum, checkIn) => sum + (checkIn.mood + checkIn.energy - checkIn.stress) / 3,
          0
        ) / recentCheckIns.length;
        
        return Math.round(average * 20);
      },
      
      getDailyScore: () => {
        const todayCheckIns = get().todayCheckIns;
        return Math.round((todayCheckIns.length / 4) * 100);
      },
      
      getStreak: () => {
        const now = new Date();
        let streak = 0;
        
        for (let i = 0; i < 365; i++) {
          const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          const dateStr = date.toISOString().split('T')[0];
          const dayCheckIns = get().checkIns.filter(c => 
            c.timestampISO.split('T')[0] === dateStr
          );
          
          if (dayCheckIns.length === 4) {
            streak++;
          } else if (i === 0) {
            break;
          } else {
            break;
          }
        }
        
        return streak;
      },
      
      addActivitySession: async (sessionData: Omit<ActivitySession, 'id' | 'timestamp' | 'date'>) => {
        const now = new Date();
        const newSession: ActivitySession = {
          ...sessionData,
          id: Date.now().toString(),
          timestamp: now.toISOString(),
          date: now.toISOString().split('T')[0],
        };
        
        const sessions = [...get().activitySessions, newSession];
        set({ activitySessions: sessions });
        
        try {
          await AsyncStorage.setItem('activitySessions', JSON.stringify(sessions));
        } catch (error) {
          console.error('Failed to save activity session:', error);
        }
      },
      
      loadUserSettings: async () => {
        try {
          const stored = await AsyncStorage.getItem('userSettings');
          if (stored) {
            const settings = JSON.parse(stored);
            set({ userSettings: settings });
          } else {
            const defaultSettings: UserSettings = {
              id: Date.now().toString(),
              notifMorning: '07:30',
              notifAfternoon: '12:30',
              notifEvening: '18:30',
              notifNight: '21:30',
              thresholds: {
                moodLowCutoff: 2.5,
                stressHighCutoff: 3.5,
                energyLowCutoff: 2.5,
                minSlotsPerDay: 2,
                streakDaysRequired: 3,
              },
            };
            set({ userSettings: defaultSettings });
            await AsyncStorage.setItem('userSettings', JSON.stringify(defaultSettings));
          }
        } catch (error) {
          console.error('Failed to load user settings:', error);
        }
      },
      
      updateUserSettings: async (updates: Partial<UserSettings>) => {
        const current = get().userSettings;
        if (current) {
          const updated = { ...current, ...updates };
          set({ userSettings: updated });
          try {
            await AsyncStorage.setItem('userSettings', JSON.stringify(updated));
          } catch (error) {
            console.error('Failed to save user settings:', error);
          }
        }
      },
      
      loadActivitySessions: async () => {
        try {
          const stored = await AsyncStorage.getItem('activitySessions');
          const sessions = stored ? JSON.parse(stored) : [];
          set({ activitySessions: sessions });
        } catch (error) {
          console.error('Failed to load activity sessions:', error);
        }
      },
    })
  )
);