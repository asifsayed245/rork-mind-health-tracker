import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-chart-kit';
import { useCheckInStore } from '@/stores/checkInStore';
import { useUserStore } from '@/stores/userStore';
import { useJournalStore } from '@/stores/journalStore';
import { getDailyMetricAverages, DailyMetricAverage } from '@/lib/scoring';
import Card from '@/components/Card';
import ProgressRing from '@/components/ProgressRing';

type Period = 'Week' | 'Month' | 'Year';

export default function DashboardScreen() {
  const { 
    checkIns, 
    loadCheckIns, 
    loadUserSettings,
    getWellbeingScoreForPeriod
  } = useCheckInStore();
  const { profile } = useUserStore();
  const { entries } = useJournalStore();
  const { width } = useWindowDimensions();
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('Week');
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const chartAnimations = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;
  const periodSelectorAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadCheckIns();
    loadUserSettings();
    
    // Start entrance animations
    const animations = [
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.back(1.1)),
        useNativeDriver: true,
      }),
      Animated.timing(periodSelectorAnim, {
        toValue: 1,
        duration: 500,
        delay: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ];

    // Stagger chart animations
    const chartStaggerAnimations = chartAnimations.map((anim, index) => 
      Animated.timing(anim, {
        toValue: 1,
        duration: 700,
        delay: 400 + (index * 200),
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      })
    );

    Animated.parallel([
      ...animations,
      ...chartStaggerAnimations,
    ]).start();
  }, [loadCheckIns, loadUserSettings]);

  const handlePeriodChange = useCallback((period: Period) => {
    if (!period || typeof period !== 'string') return;
    if ((period === 'Month' || period === 'Year') && !profile?.isPremium) {
      // Show paywall modal
      return;
    }
    setSelectedPeriod(period);
  }, [profile?.isPremium]);

  const getChartData = useCallback(() => {
    const now = new Date();
    let startDate: string;
    let endDate: string;
    let labels: string[] = [];

    switch (selectedPeriod) {
      case 'Week':
        const weekAgo = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
        startDate = weekAgo.toISOString().split('T')[0];
        endDate = now.toISOString().split('T')[0];
        
        for (let i = 6; i >= 0; i--) {
          const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        }
        break;
      case 'Month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        endDate = now.toISOString().split('T')[0];
        
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        for (let i = 1; i <= daysInMonth; i++) {
          if (i === 1 || i % 7 === 0 || i === daysInMonth) {
            labels.push(i.toString());
          } else {
            labels.push('');
          }
        }
        break;
      case 'Year':
        startDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
        endDate = now.toISOString().split('T')[0];
        
        for (let i = 0; i < 12; i++) {
          const date = new Date(now.getFullYear(), i, 1);
          labels.push(date.toLocaleDateString('en-US', { month: 'short' }));
        }
        break;
      default:
        startDate = now.toISOString().split('T')[0];
        endDate = now.toISOString().split('T')[0];
    }

    const metricAverages = getDailyMetricAverages(checkIns, startDate, endDate);
    
    return {
      startDate,
      endDate,
      labels,
      metricAverages,
      moodData: metricAverages.map(avg => avg.moodAvg || 0),
      stressData: metricAverages.map(avg => avg.stressAvg || 0),
      energyData: metricAverages.map(avg => avg.energyAvg || 0),
    };
  }, [selectedPeriod, checkIns]);

  const chartData = useMemo(() => getChartData(), [getChartData]);
  const wellbeingScore = useMemo(() => {
    if (!selectedPeriod || typeof selectedPeriod !== 'string') return 0;
    return getWellbeingScoreForPeriod(selectedPeriod);
  }, [getWellbeingScoreForPeriod, selectedPeriod]);
  
  const [chartTooltip, setChartTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    data: DailyMetricAverage | null;
    label: string;
    metric: 'mood' | 'stress' | 'energy';
  }>({ visible: false, x: 0, y: 0, data: null, label: '', metric: 'mood' });
  
  // Trigger recomputation when period changes
  useEffect(() => {
    // This will cause the wellbeing score to be recalculated
    // when the period changes, ensuring the ring animates
  }, [selectedPeriod]);

  const gratitudeStreak = entries.filter(entry => 
    entry.type === 'gratitude' && 
    new Date(entry.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  ).length;

  const getInsightText = useCallback((metricAverages: DailyMetricAverage[]) => {
    const validDays = metricAverages.filter(avg => avg.slotsCount > 0);
    if (validDays.length === 0) {
      return "Start logging your daily check-ins to see personalized insights about your wellbeing patterns.";
    }
    
    const avgMood = validDays.reduce((sum, avg) => sum + (avg.moodAvg || 0), 0) / validDays.length;
    const avgStress = validDays.reduce((sum, avg) => sum + (avg.stressAvg || 0), 0) / validDays.length;
    const avgEnergy = validDays.reduce((sum, avg) => sum + (avg.energyAvg || 0), 0) / validDays.length;
    
    if (avgMood >= 4) {
      return "You're doing great! Your mood has been consistently positive. Keep up the good work with your daily check-ins.";
    } else if (avgStress >= 4) {
      return "Your stress levels have been elevated lately. Consider trying the breathing exercises or gratitude practice to help manage stress.";
    } else if (avgEnergy <= 2) {
      return "Your energy levels seem low recently. Make sure you're getting enough rest and consider what activities energize you most.";
    } else {
      return "Your wellbeing patterns show room for improvement. Regular check-ins help identify what works best for you.";
    }
  }, []);

  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
      </View>

      {/* Period Selector */}
      <Animated.View style={[
        styles.periodSelector,
        {
          opacity: periodSelectorAnim,
          transform: [{
            translateY: periodSelectorAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [-20, 0],
            })
          }]
        }
      ]}>
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
      </Animated.View>

      <Animated.ScrollView 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]} 
        showsVerticalScrollIndicator={false}
      >
        {/* Wellbeing Score */}
        <Animated.View style={{
          opacity: chartAnimations[0],
          transform: [{
            translateY: chartAnimations[0].interpolate({
              inputRange: [0, 1],
              outputRange: [40, 0],
            })
          }]
        }}>
          <Card style={styles.scoreCard}>
          <View style={styles.scoreContent}>
            <View style={styles.scoreTextContainer}>
              <Text style={styles.scoreTitle}>Wellbeing Score</Text>
              <Text style={styles.scoreSubtitle} numberOfLines={2} ellipsizeMode="tail">
                {selectedPeriod === 'Week' && "Based on this week's check-ins"}
                {selectedPeriod === 'Month' && "Based on this month's check-ins"}
                {selectedPeriod === 'Year' && "Based on this year's check-ins"}
              </Text>
              <Text style={styles.scoreNumber}>{wellbeingScore}/100</Text>
              {wellbeingScore === 0 && (
                <Text style={styles.noDataText}>
                  Log a few check-ins to see your score
                </Text>
              )}
              {selectedPeriod === 'Week' && wellbeingScore > 0 && (
                <Text style={styles.helperText} numberOfLines={2}>
                  Average of your daily wellness scores across all 7 days (missing days counted as 0)
                </Text>
              )}
            </View>
            <View style={styles.ringContainer}>
              <ProgressRing
                size={64}
                strokeWidth={6}
                progress={wellbeingScore}
                color="#FFD700"
              />
            </View>
          </View>
          </Card>
        </Animated.View>

        {/* Mood Trend Chart */}
        <Animated.View style={{
          opacity: chartAnimations[1],
          transform: [{
            translateY: chartAnimations[1].interpolate({
              inputRange: [0, 1],
              outputRange: [40, 0],
            })
          }]
        }}>
          <Card style={styles.chartCard}>
            <Text style={styles.chartTitle}>Mood Trend</Text>
            <Text style={styles.chartLegend}>Avg per day from your check-ins</Text>
          {Platform.OS !== 'web' ? (
            <View style={styles.chartContainer}>
              <LineChart
                data={{
                  labels: chartData.labels,
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
                    stroke: "#FFD700",
                    fill: "#FFD700"
                  }
                }}
                bezier
                style={styles.chartStyle}
                onDataPointClick={(data) => {
                  const pointData = chartData.metricAverages[data.index];
                  const label = chartData.labels[data.index];
                  setChartTooltip({
                    visible: true,
                    x: data.x,
                    y: data.y - 40,
                    data: pointData,
                    label: label,
                    metric: 'mood'
                  });
                  setTimeout(() => setChartTooltip(prev => ({ ...prev, visible: false })), 3000);
                }}
              />
              {chartTooltip.visible && chartTooltip.data && chartTooltip.metric === 'mood' && (
                <View 
                  style={[styles.tooltip, { left: chartTooltip.x - 50, top: chartTooltip.y }]}
                  accessibilityLabel={`${chartTooltip.label}, average mood ${chartTooltip.data.moodAvg ? chartTooltip.data.moodAvg.toFixed(1) : 'no data'} from ${chartTooltip.data.slotsCount} check-ins`}
                >
                  <Text style={styles.tooltipLabel}>{chartTooltip.label}</Text>
                  <Text style={styles.tooltipValue}>
                    Mood: {chartTooltip.data.moodAvg ? chartTooltip.data.moodAvg.toFixed(1) : 'No check-ins'}
                  </Text>
                  {chartTooltip.data.slotsCount > 0 && (
                    <Text style={styles.tooltipSlots}>{chartTooltip.data.slotsCount} check-ins</Text>
                  )}
                </View>
              )}
            </View>
          ) : (
            <View style={styles.webChartPlaceholder}>
              <Text style={styles.webChartText}>Chart view available on mobile</Text>
              <View style={styles.webChartData}>
                {chartData.metricAverages.map((avg, index) => (
                  <View key={avg.dateISO} style={styles.webDataPoint}>
                    <Text style={styles.webDataLabel}>{chartData.labels[index]}</Text>
                    <Text style={styles.webDataValue}>
                      {avg.moodAvg ? avg.moodAvg.toFixed(1) : 'No data'}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          </Card>
        </Animated.View>

        {/* Stress Chart */}
        <Animated.View style={{
          opacity: chartAnimations[2],
          transform: [{
            translateY: chartAnimations[2].interpolate({
              inputRange: [0, 1],
              outputRange: [40, 0],
            })
          }]
        }}>
          <Card style={styles.chartCard}>
            <Text style={styles.chartTitle}>Stress Levels</Text>
            <Text style={styles.chartLegend}>Avg per day from your check-ins</Text>
          {Platform.OS !== 'web' ? (
            <View style={styles.chartContainer}>
              <LineChart
                data={{
                  labels: chartData.labels,
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
                    stroke: "#f87171",
                    fill: "#f87171"
                  }
                }}
                bezier
                style={styles.chartStyle}
                onDataPointClick={(data) => {
                  const pointData = chartData.metricAverages[data.index];
                  const label = chartData.labels[data.index];
                  setChartTooltip({
                    visible: true,
                    x: data.x,
                    y: data.y - 40,
                    data: pointData,
                    label: label,
                    metric: 'stress'
                  });
                  setTimeout(() => setChartTooltip(prev => ({ ...prev, visible: false })), 3000);
                }}
              />
              {chartTooltip.visible && chartTooltip.data && chartTooltip.metric === 'stress' && (
                <View 
                  style={[styles.tooltip, { left: chartTooltip.x - 50, top: chartTooltip.y }]}
                  accessibilityLabel={`${chartTooltip.label}, average stress ${chartTooltip.data.stressAvg ? chartTooltip.data.stressAvg.toFixed(1) : 'no data'} from ${chartTooltip.data.slotsCount} check-ins`}
                >
                  <Text style={styles.tooltipLabel}>{chartTooltip.label}</Text>
                  <Text style={styles.tooltipValue}>
                    Stress: {chartTooltip.data.stressAvg ? chartTooltip.data.stressAvg.toFixed(1) : 'No check-ins'}
                  </Text>
                  {chartTooltip.data.slotsCount > 0 && (
                    <Text style={styles.tooltipSlots}>{chartTooltip.data.slotsCount} check-ins</Text>
                  )}
                </View>
              )}
            </View>
          ) : (
            <View style={styles.webChartPlaceholder}>
              <Text style={styles.webChartText}>Chart view available on mobile</Text>
              <View style={styles.webChartData}>
                {chartData.metricAverages.map((avg, index) => (
                  <View key={`stress-${avg.dateISO}`} style={styles.webDataPoint}>
                    <Text style={styles.webDataLabel}>{chartData.labels[index]}</Text>
                    <Text style={[styles.webDataValue, styles.stressColor]}>
                      {avg.stressAvg ? avg.stressAvg.toFixed(1) : 'No data'}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          </Card>
        </Animated.View>
        
        {/* Energy Chart */}
        <Animated.View style={{
          opacity: chartAnimations[3],
          transform: [{
            translateY: chartAnimations[3].interpolate({
              inputRange: [0, 1],
              outputRange: [40, 0],
            })
          }]
        }}>
          <Card style={styles.chartCard}>
            <Text style={styles.chartTitle}>Energy Levels</Text>
            <Text style={styles.chartLegend}>Avg per day from your check-ins</Text>
          {Platform.OS !== 'web' ? (
            <View style={styles.chartContainer}>
              <LineChart
                data={{
                  labels: chartData.labels,
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
                    stroke: "#4ade80",
                    fill: "#4ade80"
                  }
                }}
                bezier
                style={styles.chartStyle}
                onDataPointClick={(data) => {
                  const pointData = chartData.metricAverages[data.index];
                  const label = chartData.labels[data.index];
                  setChartTooltip({
                    visible: true,
                    x: data.x,
                    y: data.y - 40,
                    data: pointData,
                    label: label,
                    metric: 'energy'
                  });
                  setTimeout(() => setChartTooltip(prev => ({ ...prev, visible: false })), 3000);
                }}
              />
              {chartTooltip.visible && chartTooltip.data && chartTooltip.metric === 'energy' && (
                <View 
                  style={[styles.tooltip, { left: chartTooltip.x - 50, top: chartTooltip.y }]}
                  accessibilityLabel={`${chartTooltip.label}, average energy ${chartTooltip.data.energyAvg ? chartTooltip.data.energyAvg.toFixed(1) : 'no data'} from ${chartTooltip.data.slotsCount} check-ins`}
                >
                  <Text style={styles.tooltipLabel}>{chartTooltip.label}</Text>
                  <Text style={styles.tooltipValue}>
                    Energy: {chartTooltip.data.energyAvg ? chartTooltip.data.energyAvg.toFixed(1) : 'No check-ins'}
                  </Text>
                  {chartTooltip.data.slotsCount > 0 && (
                    <Text style={styles.tooltipSlots}>{chartTooltip.data.slotsCount} check-ins</Text>
                  )}
                </View>
              )}
            </View>
          ) : (
            <View style={styles.webChartPlaceholder}>
              <Text style={styles.webChartText}>Chart view available on mobile</Text>
              <View style={styles.webChartData}>
                {chartData.metricAverages.map((avg, index) => (
                  <View key={`energy-${avg.dateISO}`} style={styles.webDataPoint}>
                    <Text style={styles.webDataLabel}>{chartData.labels[index]}</Text>
                    <Text style={[styles.webDataValue, styles.energyColor]}>
                      {avg.energyAvg ? avg.energyAvg.toFixed(1) : 'No data'}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          </Card>
        </Animated.View>

        {/* Gratitude Streak */}
        <Animated.View style={{
          opacity: chartAnimations[0],
          transform: [{
            scale: chartAnimations[0].interpolate({
              inputRange: [0, 1],
              outputRange: [0.9, 1],
            })
          }]
        }}>
          <Card style={styles.streakCard}>
            <Text style={styles.streakTitle}>🙏 Gratitude Streak</Text>
            <Text style={styles.streakNumber}>{gratitudeStreak} days</Text>
            <Text style={styles.streakSubtitle}>Keep it up!</Text>
          </Card>
        </Animated.View>

        {/* Insights */}
        <Animated.View style={{
          opacity: chartAnimations[1],
          transform: [{
            translateY: chartAnimations[1].interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0],
            })
          }]
        }}>
          <Card style={styles.insightsCard}>
            <Text style={styles.insightsTitle}>💡 Insights</Text>
            <Text style={styles.insightsText}>
              {getInsightText(chartData.metricAverages)}
            </Text>
          </Card>
        </Animated.View>
      </Animated.ScrollView>
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
    position: 'relative',
    overflow: 'hidden',
  },
  scoreContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  scoreTextContainer: {
    flex: 1,
    paddingRight: 88,
  },
  ringContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 64,
    height: 64,
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
    marginTop: 8,
  },
  noDataText: {
    color: '#999',
    fontSize: 14,
    marginTop: 8,
  },
  helperText: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  chartCard: {
    marginBottom: 16,
    alignItems: 'center',
  },
  chartContainer: {
    position: 'relative',
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 8,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
    zIndex: 1000,
  },
  tooltipLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  tooltipValue: {
    color: '#FFD700',
    fontSize: 11,
    marginBottom: 2,
  },
  tooltipSlots: {
    color: '#999',
    fontSize: 10,
  },
  chartTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    alignSelf: 'flex-start',
  },
  chartLegend: {
    color: '#999',
    fontSize: 12,
    marginBottom: 16,
    alignSelf: 'flex-start',
    fontStyle: 'italic',
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
  chartStyle: {
    marginVertical: 8,
    borderRadius: 16,
  },
});