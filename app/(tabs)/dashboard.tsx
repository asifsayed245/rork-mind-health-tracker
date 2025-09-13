import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-chart-kit';
import { useCheckInStore, DailyAggregate } from '@/stores/checkInStore';
import { useUserStore } from '@/stores/userStore';
import { useJournalStore } from '@/stores/journalStore';
import Card from '@/components/Card';
import ProgressRing from '@/components/ProgressRing';

const { width } = Dimensions.get('window');

type Period = 'Week' | 'Month' | 'Year';

export default function DashboardScreen() {
  const { 
    checkIns, 
    loadCheckIns, 
    loadUserSettings,
    getDailyAggregates 
  } = useCheckInStore();
  const { profile } = useUserStore();
  const { entries } = useJournalStore();
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('Week');

  useEffect(() => {
    loadCheckIns();
    loadUserSettings();
  }, [loadCheckIns, loadUserSettings]);

  const handlePeriodChange = useCallback((period: Period) => {
    if ((period === 'Month' || period === 'Year') && !profile?.isPremium) {
      // Show paywall modal
      return;
    }
    setSelectedPeriod(period);
  }, [profile?.isPremium]);

  const getChartData = () => {
    const now = new Date();
    let dates: string[] = [];
    let labels: string[] = [];

    switch (selectedPeriod) {
      case 'Week':
        for (let i = 6; i >= 0; i--) {
          const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          const dateStr = date.toISOString().split('T')[0];
          dates.push(dateStr);
          labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        }
        break;
      case 'Month':
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        for (let i = 1; i <= daysInMonth; i++) {
          const date = new Date(now.getFullYear(), now.getMonth(), i);
          const dateStr = date.toISOString().split('T')[0];
          dates.push(dateStr);
          labels.push(i.toString());
        }
        break;
      case 'Year':
        for (let i = 0; i < 12; i++) {
          const date = new Date(now.getFullYear(), i, 1);
          const dateStr = date.toISOString().split('T')[0];
          dates.push(dateStr);
          labels.push(date.toLocaleDateString('en-US', { month: 'short' }));
        }
        break;
    }

    const aggregates = getDailyAggregates(dates);
    
    return {
      dates,
      labels,
      aggregates,
      moodData: aggregates.map(agg => agg.moodAvg || 0),
      stressData: aggregates.map(agg => agg.stressAvg || 0),
      energyData: aggregates.map(agg => agg.energyAvg || 0),
    };
  };

  const chartData = getChartData();
  const wellbeingScore = Math.round(
    chartData.moodData.reduce((sum, mood) => sum + mood, 0) / chartData.moodData.length * 20
  ) || 0;

  const gratitudeStreak = entries.filter(entry => 
    entry.type === 'gratitude' && 
    new Date(entry.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  ).length;

  const getInsightText = (aggregates: DailyAggregate[]) => {
    const validDays = aggregates.filter(agg => agg.slotsCount > 0);
    if (validDays.length === 0) {
      return "Start logging your daily check-ins to see personalized insights about your wellbeing patterns.";
    }
    
    const avgMood = validDays.reduce((sum, agg) => sum + agg.moodAvg, 0) / validDays.length;
    const avgStress = validDays.reduce((sum, agg) => sum + agg.stressAvg, 0) / validDays.length;
    const avgEnergy = validDays.reduce((sum, agg) => sum + agg.energyAvg, 0) / validDays.length;
    
    if (avgMood >= 4) {
      return "You're doing great! Your mood has been consistently positive. Keep up the good work with your daily check-ins.";
    } else if (avgStress >= 4) {
      return "Your stress levels have been elevated lately. Consider trying the breathing exercises or gratitude practice to help manage stress.";
    } else if (avgEnergy <= 2) {
      return "Your energy levels seem low recently. Make sure you're getting enough rest and consider what activities energize you most.";
    } else {
      return "Your wellbeing patterns show room for improvement. Regular check-ins help identify what works best for you.";
    }
  };

  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
      </View>

      {/* Period Selector */}
      <View style={styles.periodSelector}>
        {(['Week', 'Month', 'Year'] as Period[]).map((period) => (
          <TouchableOpacity
            key={period}
            style={[
              styles.periodButton,
              selectedPeriod === period && styles.activePeriodButton,
              (period === 'Month' || period === 'Year') && !profile?.isPremium && styles.lockedPeriodButton,
            ]}
            onPress={() => handlePeriodChange(period)}
          >
            <Text
              style={[
                styles.periodButtonText,
                selectedPeriod === period && styles.activePeriodButtonText,
                (period === 'Month' || period === 'Year') && !profile?.isPremium && styles.lockedPeriodButtonText,
              ]}
            >
              {period}
              {(period === 'Month' || period === 'Year') && !profile?.isPremium && ' 🔒'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Wellbeing Score */}
        <Card style={styles.scoreCard}>
          <View style={styles.scoreHeader}>
            <View>
              <Text style={styles.scoreTitle}>Wellbeing Score</Text>
              <Text style={styles.scoreSubtitle}>Based on your check-ins</Text>
            </View>
            <ProgressRing
              size={80}
              strokeWidth={6}
              progress={wellbeingScore}
              color="#FFD700"
            />
          </View>
          <Text style={styles.scoreNumber}>{wellbeingScore}/100</Text>
        </Card>

        {/* Mood Trend Chart */}
        <Card style={styles.chartCard}>
          <Text style={styles.chartTitle}>Mood Trend</Text>
          {Platform.OS !== 'web' ? (
            <LineChart
              data={{
                labels: chartData.labels.length > 7 ? 
                  chartData.labels.filter((_, i) => i % Math.ceil(chartData.labels.length / 7) === 0) :
                  chartData.labels,
                datasets: [{
                  data: chartData.moodData.length > 0 ? chartData.moodData : [0],
                  color: () => '#FFD700',
                  strokeWidth: 3,
                }]
              }}
              width={width - 64}
              height={200}
              chartConfig={{
                backgroundColor: '#2a2a2a',
                backgroundGradientFrom: '#2a2a2a',
                backgroundGradientTo: '#2a2a2a',
                decimalPlaces: 1,
                color: (opacity = 1) => `rgba(255, 215, 0, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                style: {
                  borderRadius: 16
                },
                propsForDots: {
                  r: "4",
                  strokeWidth: "2",
                  stroke: "#FFD700"
                }
              }}
              bezier
              style={{
                marginVertical: 8,
                borderRadius: 16
              }}
            />
          ) : (
            <View style={styles.webChartPlaceholder}>
              <Text style={styles.webChartText}>Chart view available on mobile</Text>
              <View style={styles.webChartData}>
                {chartData.aggregates.map((agg) => (
                  <View key={agg.date} style={styles.webDataPoint}>
                    <Text style={styles.webDataLabel}>{chartData.labels[chartData.aggregates.indexOf(agg)]}</Text>
                    <Text style={styles.webDataValue}>{agg.moodAvg.toFixed(1)}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </Card>

        {/* Stress Chart */}
        <Card style={styles.chartCard}>
          <Text style={styles.chartTitle}>Stress Levels</Text>
          {Platform.OS !== 'web' ? (
            <LineChart
              data={{
                labels: chartData.labels.length > 7 ? 
                  chartData.labels.filter((_, i) => i % Math.ceil(chartData.labels.length / 7) === 0) :
                  chartData.labels,
                datasets: [{
                  data: chartData.stressData.length > 0 ? chartData.stressData : [0],
                  color: () => '#f87171',
                  strokeWidth: 3,
                }]
              }}
              width={width - 64}
              height={200}
              chartConfig={{
                backgroundColor: '#2a2a2a',
                backgroundGradientFrom: '#2a2a2a',
                backgroundGradientTo: '#2a2a2a',
                decimalPlaces: 1,
                color: (opacity = 1) => `rgba(248, 113, 113, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                style: {
                  borderRadius: 16
                },
                propsForDots: {
                  r: "4",
                  strokeWidth: "2",
                  stroke: "#f87171"
                }
              }}
              bezier
              style={{
                marginVertical: 8,
                borderRadius: 16
              }}
            />
          ) : (
            <View style={styles.webChartPlaceholder}>
              <Text style={styles.webChartText}>Chart view available on mobile</Text>
              <View style={styles.webChartData}>
                {chartData.aggregates.map((agg) => (
                  <View key={`stress-${agg.date}`} style={styles.webDataPoint}>
                    <Text style={styles.webDataLabel}>{chartData.labels[chartData.aggregates.indexOf(agg)]}</Text>
                    <Text style={[styles.webDataValue, styles.stressColor]}>{agg.stressAvg.toFixed(1)}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </Card>
        
        {/* Energy Chart */}
        <Card style={styles.chartCard}>
          <Text style={styles.chartTitle}>Energy Levels</Text>
          {Platform.OS !== 'web' ? (
            <LineChart
              data={{
                labels: chartData.labels.length > 7 ? 
                  chartData.labels.filter((_, i) => i % Math.ceil(chartData.labels.length / 7) === 0) :
                  chartData.labels,
                datasets: [{
                  data: chartData.energyData.length > 0 ? chartData.energyData : [0],
                  color: () => '#4ade80',
                  strokeWidth: 3,
                }]
              }}
              width={width - 64}
              height={200}
              chartConfig={{
                backgroundColor: '#2a2a2a',
                backgroundGradientFrom: '#2a2a2a',
                backgroundGradientTo: '#2a2a2a',
                decimalPlaces: 1,
                color: (opacity = 1) => `rgba(74, 222, 128, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                style: {
                  borderRadius: 16
                },
                propsForDots: {
                  r: "4",
                  strokeWidth: "2",
                  stroke: "#4ade80"
                }
              }}
              bezier
              style={{
                marginVertical: 8,
                borderRadius: 16
              }}
            />
          ) : (
            <View style={styles.webChartPlaceholder}>
              <Text style={styles.webChartText}>Chart view available on mobile</Text>
              <View style={styles.webChartData}>
                {chartData.aggregates.map((agg) => (
                  <View key={`energy-${agg.date}`} style={styles.webDataPoint}>
                    <Text style={styles.webDataLabel}>{chartData.labels[chartData.aggregates.indexOf(agg)]}</Text>
                    <Text style={[styles.webDataValue, styles.energyColor]}>{agg.energyAvg.toFixed(1)}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </Card>

        {/* Gratitude Streak */}
        <Card style={styles.streakCard}>
          <Text style={styles.streakTitle}>🙏 Gratitude Streak</Text>
          <Text style={styles.streakNumber}>{gratitudeStreak} days</Text>
          <Text style={styles.streakSubtitle}>Keep it up!</Text>
        </Card>

        {/* Insights */}
        <Card style={styles.insightsCard}>
          <Text style={styles.insightsTitle}>💡 Insights</Text>
          <Text style={styles.insightsText}>
            {getInsightText(chartData.aggregates)}
          </Text>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    padding: 16,
    paddingTop: 8,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  periodSelector: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  activePeriodButton: {
    backgroundColor: '#FFD700',
  },
  lockedPeriodButton: {
    opacity: 0.6,
  },
  periodButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  activePeriodButtonText: {
    color: '#1a1a1a',
  },
  lockedPeriodButtonText: {
    color: '#999',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scoreCard: {
    marginBottom: 16,
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  scoreSubtitle: {
    color: '#999',
    fontSize: 14,
    marginTop: 4,
  },
  scoreNumber: {
    color: '#FFD700',
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  chartCard: {
    marginBottom: 16,
    alignItems: 'center',
  },
  chartTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    color: '#fff',
    fontSize: 12,
  },
  streakCard: {
    marginBottom: 16,
    alignItems: 'center',
    backgroundColor: '#2d4a2d',
  },
  streakTitle: {
    color: '#4ade80',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  streakNumber: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  streakSubtitle: {
    color: '#a3a3a3',
    fontSize: 14,
  },
  insightsCard: {
    marginBottom: 24,
  },
  insightsTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  insightsText: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 20,
  },
  webChartPlaceholder: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: 12,
    marginVertical: 8,
  },
  webChartText: {
    color: '#999',
    fontSize: 14,
    marginBottom: 16,
  },
  webChartData: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  webDataPoint: {
    backgroundColor: '#2a2a2a',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 60,
  },
  webDataLabel: {
    color: '#999',
    fontSize: 10,
    marginBottom: 4,
  },
  webDataValue: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: 'bold',
  },
  webDataValues: {
    flexDirection: 'row',
    gap: 8,
  },
  stressColor: {
    color: '#f87171',
  },
  energyColor: {
    color: '#4ade80',
  },
});