import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Heart, Wind, MessageCircle, X } from 'lucide-react-native';
import { router } from 'expo-router';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/contexts/AuthContext';
import Card from '@/components/Card';
import ProgressRing from '@/components/ProgressRing';
import CheckInProgress from '@/components/CheckInProgress';
import QuickCheckInModal from '@/components/QuickCheckInModal';
import type { Tables } from '@/lib/supabase';

type CheckIn = Tables<'check_ins'>;
type CheckInSlot = 'morning' | 'afternoon' | 'evening' | 'night';

interface CheckInData {
  slot: CheckInSlot;
  mood: number;
  stress: number;
  energy: number;
  note?: string;
}

export default function HomeScreen() {
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<CheckInSlot | undefined>();
  const [showHeavyCard, setShowHeavyCard] = useState(false);
  const { user, loading: authLoading } = useAuth();

  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  // tRPC queries - only run when user is authenticated
  const profileQuery = trpc.user.getProfile.useQuery(undefined, {
    enabled: !!user && !authLoading,
  });
  const todayCheckInsQuery = trpc.checkIns.getToday.useQuery(undefined, {
    enabled: !!user && !authLoading,
  });
  const journalEntriesQuery = trpc.journal.getEntries.useQuery({ type: 'all' }, {
    enabled: !!user && !authLoading,
  });

  const profile = profileQuery.data;
  const todayCheckIns = todayCheckInsQuery.data || [];
  const entries = journalEntriesQuery.data || [];

  // Debug logging
  console.log('Home - Auth & tRPC Query Status:', {
    auth: { hasUser: !!user, authLoading, userId: user?.id },
    profile: { loading: profileQuery.isLoading, error: profileQuery.isError, errorMsg: profileQuery.error?.message },
    checkIns: { loading: todayCheckInsQuery.isLoading, error: todayCheckInsQuery.isError, errorMsg: todayCheckInsQuery.error?.message },
    journal: { loading: journalEntriesQuery.isLoading, error: journalEntriesQuery.isError, errorMsg: journalEntriesQuery.error?.message }
  });

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Calculate streak based on check-ins
  const getStreak = () => {
    // Simple streak calculation - count consecutive days with check-ins
    // This is a simplified version, you might want to implement more complex logic
    return Math.min(todayCheckIns.length * 2, 10); // Placeholder calculation
  };

  // Calculate daily score based on completed check-ins
  const getDailyScore = () => {
    const totalSlots = 4; // morning, afternoon, evening, night
    const completedSlots = todayCheckIns.length;
    return Math.round((completedSlots / totalSlots) * 100);
  };

  const handleSlotPress = useCallback((slot: CheckInSlot) => {
    setSelectedSlot(slot);
    setShowCheckInModal(true);
  }, []);
  
  const handleCheckInSave = useCallback(async (checkInData: CheckInData) => {
    // Refetch today's check-ins after saving
    await todayCheckInsQuery.refetch();
    setShowCheckInModal(false);
    setSelectedSlot(undefined);
  }, [todayCheckInsQuery]);
  
  const handleHeavyCardDismiss = useCallback(() => {
    setShowHeavyCard(false);
  }, []);


  const streak = getStreak();
  const dailyScore = getDailyScore();
  const today = new Date().toISOString().split('T')[0];
  const todayEntries = entries.filter(
    entry => entry.date === today
  ).length;
  
  const gratitudeStreak = entries
    .filter(entry => entry.type === 'gratitude')
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .reduce((streak, entry, index) => {
      const entryDate = new Date(entry.timestamp);
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - index);
      
      if (entryDate.toDateString() === expectedDate.toDateString()) {
        return streak + 1;
      }
      return streak;
    }, 0);

  const insets = useSafeAreaInsets();

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { paddingTop: insets.top }]}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Show error state if not authenticated
  if (!user) {
    return (
      <View style={[styles.container, styles.loadingContainer, { paddingTop: insets.top }]}>
        <Text style={styles.loadingText}>Please log in to continue</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Welcome back,</Text>
              <Text style={styles.name}>{profile?.name || 'User'}</Text>
            </View>
            <View style={styles.streakContainer}>
              <ProgressRing
                size={80}
                strokeWidth={6}
                progress={Math.min(streak * 10, 100)}
                color="#FFD700"
              />
              <View style={styles.streakText}>
                <Text style={styles.streakNumber}>{streak}</Text>
                <Text style={styles.streakLabel}>day{streak !== 1 ? 's' : ''}</Text>
              </View>
            </View>
          </View>

          {/* Daily Score Card */}
          <Card style={styles.scoreCard}>
            <View style={styles.scoreHeader}>
              <View>
                <Text style={styles.scoreTitle}>Daily Score</Text>
                <Text style={styles.scoreSubtitle}>
                  {dailyScore}% completed
                </Text>
              </View>
              <ProgressRing
                size={60}
                strokeWidth={4}
                progress={dailyScore}
                color="#FFD700"
              />
            </View>
          </Card>

          {/* Check-in Progress */}
          <Card style={styles.checkInCard}>
            <CheckInProgress 
              todayCheckIns={todayCheckIns}
              onSlotPress={handleSlotPress}
            />
          </Card>

          {/* Quick Actions */}
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/gratitude')}
            >
              <Heart color="#FFD700" size={24} />
              <Text style={styles.actionText}>Gratitude</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/breathing')}
            >
              <Wind color="#FFD700" size={24} />
              <Text style={styles.actionText}>Breathing</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/reflection')}
            >
              <MessageCircle color="#FFD700" size={24} />
              <Text style={styles.actionText}>Reflection</Text>
            </TouchableOpacity>
          </View>

          {/* Today Preview */}
          <Card style={styles.previewCard}>
            <Text style={styles.cardTitle}>Today&apos;s Summary</Text>
            <View style={styles.previewStats}>
              <View style={styles.stat}>
                <Text style={styles.statNumber}>{dailyScore}%</Text>
                <Text style={styles.statLabel}>Daily Score</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statNumber}>{todayEntries}</Text>
                <Text style={styles.statLabel}>Entries</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statNumber}>{gratitudeStreak}</Text>
                <Text style={styles.statLabel}>Gratitude</Text>
              </View>
            </View>
          </Card>
          
          {/* Heavy Days Suggestion Card */}
          {showHeavyCard && (
            <Card style={styles.suggestionCard}>
              <View style={styles.suggestionHeader}>
                <View style={styles.suggestionTitleContainer}>
                  <Text style={styles.suggestionTitle}>It&apos;s been a heavy few days 💙</Text>
                  <Text style={styles.suggestionText}>Would you like a quick tip to recharge?</Text>
                </View>
                <TouchableOpacity 
                  style={styles.dismissButton}
                  onPress={handleHeavyCardDismiss}
                >
                  <X color="#999" size={20} />
                </TouchableOpacity>
              </View>
              <View style={styles.suggestionActions}>
                <TouchableOpacity 
                  style={styles.suggestionButton}
                  onPress={() => {
                    setShowHeavyCard(false);
                    router.push('/breathing');
                  }}
                >
                  <Wind color="#60a5fa" size={16} />
                  <Text style={styles.suggestionButtonText}>Breathing</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.suggestionButton}
                  onPress={() => {
                    setShowHeavyCard(false);
                    router.push('/gratitude');
                  }}
                >
                  <Heart color="#fbbf24" size={16} />
                  <Text style={styles.suggestionButtonText}>Gratitude</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.suggestionButton}
                  onPress={() => {
                    setShowHeavyCard(false);
                    router.push('/reflection');
                  }}
                >
                  <MessageCircle color="#8b5cf6" size={16} />
                  <Text style={styles.suggestionButtonText}>Reflection</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.suggestionSubtext}>Some stretches are harder than others. Small steps count.</Text>
            </Card>
          )}
        </Animated.View>
      </ScrollView>
      
      <QuickCheckInModal
        visible={showCheckInModal}
        onClose={() => {
          setShowCheckInModal(false);
          setSelectedSlot(undefined);
        }}
        onSave={handleCheckInSave}
        preselectedSlot={selectedSlot}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    color: '#999',
    fontSize: 16,
  },
  name: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  streakContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  streakText: {
    position: 'absolute',
    alignItems: 'center',
  },
  streakNumber: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
  },
  streakLabel: {
    color: '#999',
    fontSize: 10,
  },
  scoreCard: {
    backgroundColor: '#FFD700',
    marginBottom: 16,
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreTitle: {
    color: '#1a1a1a',
    fontSize: 20,
    fontWeight: 'bold',
  },
  scoreSubtitle: {
    color: '#333',
    fontSize: 14,
    marginTop: 4,
  },
  checkInCard: {
    marginBottom: 16,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },

  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    marginTop: 8,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
  },
  actionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  previewCard: {
    marginBottom: 24,
  },
  previewStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    color: '#FFD700',
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#999',
    fontSize: 12,
    marginTop: 4,
  },
  suggestionCard: {
    backgroundColor: '#2a2a2a',
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#60a5fa',
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  suggestionTitleContainer: {
    flex: 1,
  },
  suggestionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  suggestionText: {
    color: '#ccc',
    fontSize: 14,
  },
  dismissButton: {
    padding: 4,
  },
  suggestionSubtext: {
    color: '#999',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 12,
    textAlign: 'center',
  },
  suggestionActions: {
    flexDirection: 'row',
    gap: 8,
  },
  suggestionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  suggestionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
});