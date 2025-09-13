import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { trpc } from '@/lib/trpc';
import { 
  ScoringSettings, 
  DEFAULT_SCORING_SETTINGS, 
  computeDailyCheckinScore,
  computePeriodWellbeingScore,
  getDailyScoresForPeriod,
  normalizeWeights
} from '@/lib/scoring';

// Database types
interface DbCheckIn {
  id: string;
  user_id: string | null;
  slot: 'morning' | 'afternoon' | 'evening' | 'night';
  mood: number;
  stress: number;
  energy: number;
  note: string | null;
  created_at: string;
}

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
  scoring: ScoringSettings;
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

export const [CheckInProvider, useCheckInStore] = createContextHook(() => {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [todayCheckIns, setTodayCheckIns] = useState<CheckIn[]>([]);
  const [activitySessions, setActivitySessions] = useState<ActivitySession[]>([]);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Use tRPC hooks
  const checkInsQuery = trpc.checkins.get.useQuery();
  const addCheckInMutation = trpc.checkins.add.useMutation();

  const convertDbCheckInToLocal = useCallback((dbCheckIn: DbCheckIn): CheckIn => ({
    id: dbCheckIn.id,
    userId: dbCheckIn.user_id || undefined,
    slot: dbCheckIn.slot,
    mood: dbCheckIn.mood,
    stress: dbCheckIn.stress,
    energy: dbCheckIn.energy,
    note: dbCheckIn.note || undefined,
    timestampISO: dbCheckIn.created_at,
  }), []);

  const updateCheckInsFromData = useCallback((data: DbCheckIn[]) => {
    const convertedCheckIns: CheckIn[] = data.map(convertDbCheckInToLocal);
    const today = new Date().toISOString().split('T')[0];
    const todayFiltered = convertedCheckIns.filter((checkIn: CheckIn) => 
      checkIn.timestampISO?.split('T')[0] === today
    );
    
    setCheckIns(convertedCheckIns);
    setTodayCheckIns(todayFiltered);
    setIsLoading(false);
    
    // Save to AsyncStorage as backup
    AsyncStorage.setItem('checkIns', JSON.stringify(convertedCheckIns)).catch(console.error);
  }, [convertDbCheckInToLocal]);

  const loadFromAsyncStorage = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem('checkIns');
      const storedCheckIns = stored ? JSON.parse(stored) : [];
      const today = new Date().toISOString().split('T')[0];
      const todayFiltered = storedCheckIns.filter((checkIn: CheckIn) => 
        checkIn.timestampISO?.split('T')[0] === today
      );
      setCheckIns(storedCheckIns);
      setTodayCheckIns(todayFiltered);
    } catch (asyncError) {
      console.error('Failed to load check-ins from AsyncStorage:', asyncError);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addCheckIn = useCallback(async (checkInData: Omit<CheckIn, 'id' | 'timestampISO'>) => {
    try {
      const result = await addCheckInMutation.mutateAsync({
        slot: checkInData.slot,
        mood: checkInData.mood,
        stress: checkInData.stress,
        energy: checkInData.energy,
        note: checkInData.note,
      });

      // Convert database format to local format
      const dbCheckIn = result as DbCheckIn;
      const newCheckIn = convertDbCheckInToLocal(dbCheckIn);
      
      const updatedCheckIns = [...checkIns, newCheckIn];
      const today = new Date().toISOString().split('T')[0];
      const updatedTodayCheckIns = updatedCheckIns.filter(c => c.timestampISO.split('T')[0] === today);
      
      setCheckIns(updatedCheckIns);
      setTodayCheckIns(updatedTodayCheckIns);
      
      // Save to AsyncStorage as backup
      AsyncStorage.setItem('checkIns', JSON.stringify(updatedCheckIns)).catch(console.error);
    } catch (error) {
      console.error('Failed to save check-in:', error);
      throw error;
    }
  }, [addCheckInMutation, checkIns, convertDbCheckInToLocal]);

  const loadCheckIns = useCallback(async () => {
    try {
      // Always try to load from AsyncStorage first for immediate data
      await loadFromAsyncStorage();
      
      // Then try to fetch fresh data from server
      const result = await checkInsQuery.refetch();
      if (result.data) {
        updateCheckInsFromData(result.data as DbCheckIn[]);
      }
    } catch (error) {
      console.error('Failed to load check-ins:', error);
      // AsyncStorage was already loaded above, so we're good
    }
  }, [checkInsQuery.refetch, updateCheckInsFromData, loadFromAsyncStorage]);
      
  const getTodayCheckIns = useCallback(() => {
    return todayCheckIns;
  }, [todayCheckIns]);
  
  const getCheckInBySlot = useCallback((slot: CheckIn['slot']) => {
    return todayCheckIns.find(checkIn => checkIn.slot === slot) || null;
  }, [todayCheckIns]);
  
  const getCheckInsByDateRange = useCallback((startISO: string, endISO: string) => {
    return checkIns.filter(checkIn => {
      const checkInDate = checkIn.timestampISO.split('T')[0];
      return checkInDate >= startISO && checkInDate <= endISO;
    });
  }, [checkIns]);
  
  const getDailyAggregates = useCallback((days: string[]): DailyAggregate[] => {
    return days.map(date => {
      const dayCheckIns = checkIns.filter(c => 
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
  }, [checkIns]);
      
  const isToughDay = useCallback((agg: DailyAggregate, thresholds: UserSettings['thresholds']) => {
    return (
      agg.moodAvg <= thresholds.moodLowCutoff &&
      agg.stressAvg >= thresholds.stressHighCutoff &&
      agg.energyAvg <= thresholds.energyLowCutoff &&
      agg.slotsCount >= thresholds.minSlotsPerDay
    );
  }, []);
  
  const hasConsecutiveToughStreak = useCallback((aggs: DailyAggregate[], requiredDays: number) => {
    if (!userSettings) return false;
    
    let consecutiveCount = 0;
    for (let i = aggs.length - 1; i >= 0; i--) {
      const isTough = (
        aggs[i].moodAvg <= userSettings.thresholds.moodLowCutoff &&
        aggs[i].stressAvg >= userSettings.thresholds.stressHighCutoff &&
        aggs[i].energyAvg <= userSettings.thresholds.energyLowCutoff &&
        aggs[i].slotsCount >= userSettings.thresholds.minSlotsPerDay
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
  }, [userSettings]);
      
  const shouldShowHeavyCard = useCallback(() => {
    if (!userSettings) return false;
    
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      last7Days.push(date.toISOString().split('T')[0]);
    }
    
    const aggs = last7Days.map(date => {
      const dayCheckIns = checkIns.filter(c => 
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
        aggs[i].moodAvg <= userSettings.thresholds.moodLowCutoff &&
        aggs[i].stressAvg >= userSettings.thresholds.stressHighCutoff &&
        aggs[i].energyAvg <= userSettings.thresholds.energyLowCutoff &&
        aggs[i].slotsCount >= userSettings.thresholds.minSlotsPerDay
      );
      
      if (isTough) {
        consecutiveCount++;
        if (consecutiveCount >= userSettings.thresholds.streakDaysRequired) {
          break;
        }
      } else {
        consecutiveCount = 0;
      }
    }
    
    if (consecutiveCount < userSettings.thresholds.streakDaysRequired) return false;
    
    const lastShown = userSettings.lastHeavyCardShownAt ? new Date(userSettings.lastHeavyCardShownAt) : null;
    const lastDismissed = userSettings.lastHeavyCardDismissedAt ? new Date(userSettings.lastHeavyCardDismissedAt) : null;
    
    const sevenDaysAgoTime = sevenDaysAgo.getTime();
    
    if (lastShown && lastShown.getTime() > sevenDaysAgoTime) return false;
    if (lastDismissed && lastDismissed.getTime() > sevenDaysAgoTime) return false;
    
    return true;
  }, [userSettings, checkIns]);
      
  const markHeavyCardShown = useCallback(async () => {
    if (userSettings) {
      const updatedSettings = {
        ...userSettings,
        lastHeavyCardShownAt: new Date().toISOString(),
      };
      setUserSettings(updatedSettings);
      try {
        await AsyncStorage.setItem('userSettings', JSON.stringify(updatedSettings));
      } catch (storageError) {
        console.error('Failed to save user settings:', storageError);
      }
    }
  }, [userSettings]);
  
  const markHeavyCardDismissed = useCallback(async () => {
    if (userSettings) {
      const updatedSettings = {
        ...userSettings,
        lastHeavyCardDismissedAt: new Date().toISOString(),
      };
      setUserSettings(updatedSettings);
      try {
        await AsyncStorage.setItem('userSettings', JSON.stringify(updatedSettings));
      } catch (storageError) {
        console.error('Failed to save user settings:', storageError);
      }
    }
  }, [userSettings]);
      
  const getWeeklyAverage = useCallback(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const recentCheckIns = checkIns.filter(
      checkIn => new Date(checkIn.timestampISO) >= weekAgo
    );
    
    if (recentCheckIns.length === 0) return 0;
    
    const average = recentCheckIns.reduce(
      (sum, checkIn) => sum + (checkIn.mood + checkIn.energy - checkIn.stress) / 3,
      0
    ) / recentCheckIns.length;
    
    return Math.round(average * 20);
  }, [checkIns]);
  
  const getDailyScore = useCallback(() => {
    if (!userSettings) return 0;
    return computeDailyCheckinScore(
      todayCheckIns,
      userSettings.scoring.weights,
      userSettings.scoring.useCompletionMultiplier
    );
  }, [todayCheckIns, userSettings]);
  
  const getStreak = useCallback(() => {
    const now = new Date();
    let streak = 0;
    
    for (let i = 0; i < 365; i++) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const dayCheckIns = checkIns.filter(c => 
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
  }, [checkIns]);
      
  const addActivitySession = useCallback(async (sessionData: Omit<ActivitySession, 'id' | 'timestamp' | 'date'>) => {
    const now = new Date();
    const newSession: ActivitySession = {
      ...sessionData,
      id: Date.now().toString(),
      timestamp: now.toISOString(),
      date: now.toISOString().split('T')[0],
    };
    
    const sessions = [...activitySessions, newSession];
    setActivitySessions(sessions);
    
    try {
      await AsyncStorage.setItem('activitySessions', JSON.stringify(sessions));
    } catch (storageError) {
      console.error('Failed to save activity session:', storageError);
    }
  }, [activitySessions]);
  
  const loadUserSettings = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem('userSettings');
      if (stored) {
        const settings = JSON.parse(stored);
        // Migrate old settings to include scoring if missing
        if (!settings.scoring) {
          settings.scoring = DEFAULT_SCORING_SETTINGS;
        }
        setUserSettings(settings);
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
          scoring: DEFAULT_SCORING_SETTINGS,
        };
        setUserSettings(defaultSettings);
        await AsyncStorage.setItem('userSettings', JSON.stringify(defaultSettings));
      }
    } catch (storageError) {
      console.error('Failed to load user settings:', storageError);
    }
  }, []);
  
  const updateUserSettings = useCallback(async (updates: Partial<UserSettings>) => {
    if (userSettings) {
      const updated = { ...userSettings, ...updates };
      setUserSettings(updated);
      try {
        await AsyncStorage.setItem('userSettings', JSON.stringify(updated));
      } catch (storageError) {
        console.error('Failed to save user settings:', storageError);
      }
    }
  }, [userSettings]);
  
  const loadActivitySessions = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem('activitySessions');
      const sessions = stored ? JSON.parse(stored) : [];
      setActivitySessions(sessions);
    } catch (storageError) {
      console.error('Failed to load activity sessions:', storageError);
    }
  }, []);
  
  const clearAllData = useCallback(async () => {
    setCheckIns([]);
    setTodayCheckIns([]);
    setActivitySessions([]);
    setUserSettings(null);
    setIsLoading(false);
    try {
      await AsyncStorage.multiRemove([
        'checkIns', 
        'activitySessions', 
        'userSettings'
      ]);
    } catch (storageError) {
      console.error('Failed to clear check-in data:', storageError);
    }
  }, []);

  const getWellbeingScoreForPeriod = useCallback((period: 'Week' | 'Month' | 'Year') => {
    if (!userSettings) return 0;
    
    const now = new Date();
    let startDate: string;
    let endDate: string;
    
    switch (period) {
      case 'Week':
        const weekAgo = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
        startDate = weekAgo.toISOString().split('T')[0];
        endDate = now.toISOString().split('T')[0];
        break;
      case 'Month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        endDate = now.toISOString().split('T')[0];
        break;
      case 'Year':
        startDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
        endDate = now.toISOString().split('T')[0];
        break;
      default:
        return 0;
    }
    
    const dailyScores = getDailyScoresForPeriod(
      checkIns,
      startDate,
      endDate,
      userSettings.scoring.weights,
      userSettings.scoring.useCompletionMultiplier
    );
    
    // Use includeAsZero as default (opposite of excludeEmptyDays)
    const emptyDayPolicy = userSettings.scoring.excludeEmptyDays ? 'exclude' : 'includeAsZero';
    return computePeriodWellbeingScore(dailyScores, emptyDayPolicy);
  }, [checkIns, userSettings]);

  return useMemo(() => ({
    checkIns,
    todayCheckIns,
    activitySessions,
    userSettings,
    isLoading,
    addCheckIn,
    loadCheckIns,
    getTodayCheckIns,
    getCheckInBySlot,
    getCheckInsByDateRange,
    getDailyAggregates,
    isToughDay,
    hasConsecutiveToughStreak,
    shouldShowHeavyCard,
    markHeavyCardShown,
    markHeavyCardDismissed,
    getWeeklyAverage,
    getDailyScore,
    getStreak,
    addActivitySession,
    loadUserSettings,
    updateUserSettings,
    loadActivitySessions,
    clearAllData,
    getWellbeingScoreForPeriod,
  }), [
    checkIns,
    todayCheckIns,
    activitySessions,
    userSettings,
    isLoading,
    addCheckIn,
    loadCheckIns,
    getTodayCheckIns,
    getCheckInBySlot,
    getCheckInsByDateRange,
    getDailyAggregates,
    isToughDay,
    hasConsecutiveToughStreak,
    shouldShowHeavyCard,
    markHeavyCardShown,
    markHeavyCardDismissed,
    getWeeklyAverage,
    getDailyScore,
    getStreak,
    addActivitySession,
    loadUserSettings,
    updateUserSettings,
    loadActivitySessions,
    clearAllData,
    getWellbeingScoreForPeriod,
  ]);
});