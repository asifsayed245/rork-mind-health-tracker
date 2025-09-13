import { CheckIn } from '@/stores/checkInStore';

export interface ScoringWeights {
  moodWeight: number;
  energyWeight: number;
  stressWeight: number;
}

export interface ScoringSettings {
  weights: ScoringWeights;
  useCompletionMultiplier: boolean;
  excludeEmptyDays: boolean;
}

export const DEFAULT_SCORING_SETTINGS: ScoringSettings = {
  weights: {
    moodWeight: 0.50,
    energyWeight: 0.30,
    stressWeight: 0.20,
  },
  useCompletionMultiplier: true,
  excludeEmptyDays: false, // Changed to false (includeAsZero is default)
};

export function normalizeSlotValue(value: number, isStress: boolean = false): number {
  if (isStress) {
    return ((5 - value) / 4) * 100;
  }
  return ((value - 1) / 4) * 100;
}

export function computeSlotScore(
  mood: number,
  stress: number,
  energy: number,
  weights: ScoringWeights
): number {
  const moodNorm = normalizeSlotValue(mood);
  const energyNorm = normalizeSlotValue(energy);
  const stressNorm = normalizeSlotValue(stress, true);
  
  return (
    moodNorm * weights.moodWeight +
    energyNorm * weights.energyWeight +
    stressNorm * weights.stressWeight
  );
}

export function computeDailyCheckinScore(
  todayCheckIns: CheckIn[],
  weights: ScoringWeights,
  useCompletionMultiplier: boolean
): number {
  if (todayCheckIns.length === 0) {
    return 0;
  }
  
  const slotScores = todayCheckIns.map(checkIn => 
    computeSlotScore(checkIn.mood, checkIn.stress, checkIn.energy, weights)
  );
  
  const avgSlotScore = slotScores.reduce((sum, score) => sum + score, 0) / slotScores.length;
  
  const completionMultiplier = useCompletionMultiplier 
    ? todayCheckIns.length / 4 
    : 1;
  
  return Math.round(avgSlotScore * completionMultiplier);
}

export function computePeriodWellbeingScore(
  dailyScores: Array<number | null>,
  emptyDayPolicy: 'exclude' | 'includeAsZero' = 'includeAsZero'
): number {
  if (dailyScores.length === 0) return 0;

  if (emptyDayPolicy === 'includeAsZero') {
    const normalized = dailyScores.map(s => (s == null ? 0 : s));
    return Math.round(normalized.reduce((a, b) => a + b, 0) / normalized.length);
  }

  // exclude policy (not default)
  const present = dailyScores.filter(s => s != null) as number[];
  if (present.length === 0) return 0;
  return Math.round(present.reduce((a, b) => a + b, 0) / present.length);
}

export function normalizeWeights(weights: ScoringWeights): ScoringWeights {
  const total = weights.moodWeight + weights.energyWeight + weights.stressWeight;
  
  if (total === 0) {
    return DEFAULT_SCORING_SETTINGS.weights;
  }
  
  return {
    moodWeight: weights.moodWeight / total,
    energyWeight: weights.energyWeight / total,
    stressWeight: weights.stressWeight / total,
  };
}

export function getDailyScoresForPeriod(
  checkIns: CheckIn[],
  startDate: string,
  endDate: string,
  weights: ScoringWeights,
  useCompletionMultiplier: boolean
): Array<number | null> {
  const dailyScores: Array<number | null> = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const dateStr = date.toISOString().split('T')[0];
    const dayCheckIns = checkIns.filter(checkIn => 
      checkIn.timestampISO.split('T')[0] === dateStr
    );
    
    if (dayCheckIns.length === 0) {
      dailyScores.push(null);
    } else {
      const dailyScore = computeDailyCheckinScore(dayCheckIns, weights, useCompletionMultiplier);
      dailyScores.push(dailyScore);
    }
  }
  
  return dailyScores;
}

export interface DailyMetricAverage {
  dateISO: string;
  slotsCount: number;
  moodAvg: number | null;
  stressAvg: number | null;
  energyAvg: number | null;
}

export function getDailyMetricAverages(
  checkIns: CheckIn[],
  startISO: string,
  endISO: string
): DailyMetricAverage[] {
  const results: DailyMetricAverage[] = [];
  const start = new Date(startISO);
  const end = new Date(endISO);
  
  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const dateStr = date.toISOString().split('T')[0];
    const dayCheckIns = checkIns.filter(checkIn => 
      checkIn.timestampISO.split('T')[0] === dateStr
    );
    
    if (dayCheckIns.length === 0) {
      results.push({
        dateISO: dateStr,
        slotsCount: 0,
        moodAvg: null,
        stressAvg: null,
        energyAvg: null,
      });
    } else {
      results.push({
        dateISO: dateStr,
        slotsCount: dayCheckIns.length,
        moodAvg: dayCheckIns.reduce((sum, c) => sum + c.mood, 0) / dayCheckIns.length,
        stressAvg: dayCheckIns.reduce((sum, c) => sum + c.stress, 0) / dayCheckIns.length,
        energyAvg: dayCheckIns.reduce((sum, c) => sum + c.energy, 0) / dayCheckIns.length,
      });
    }
  }
  
  return results;
}