import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Heart, Wind, MessageCircle, X } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '@/stores/authStore';
import { useUserProfile } from '@/stores/userProfileStore';
import { useCheckInStore, CheckIn } from '@/stores/checkInStore';
import { useJournalStore } from '@/stores/journalStore';
import Card from '@/components/Card';
import ProgressRing from '@/components/ProgressRing';
import CheckInProgress from '@/components/CheckInProgress';
import QuickCheckInModal from '@/components/QuickCheckInModal';

export default function HomeScreen() {
  const { isAuthenticated, user } = useAuth();
  const { profile, fetchProfile } = useUserProfile();
  const { 
    todayCheckIns, 
    loadCheckIns, 
    addCheckIn, 
 
    getStreak, 
    getDailyScore,
    loadActivitySessions,
    loadUserSettings,
    shouldShowHeavyCard,
    markHeavyCardShown,
    markHeavyCardDismissed
  } = useCheckInStore();
  const { entries, loadEntries } = useJournalStore();
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<CheckIn['slot'] | undefined>();
  const [showHeavyCard, setShowHeavyCard] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const cardAnimations = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;
  const actionButtonAnimations = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    const initializeData = async () => {
      try {
        await Promise.all([
          fetchProfile(),
          loadActivitySessions(),
          loadUserSettings(),
        ]);
        
        // Load data from stores
        await loadCheckIns();
        await loadEntries();
        
        // Check if heavy card should be shown
        const shouldShow = shouldShowHeavyCard();
        if (shouldShow) {
          setShowHeavyCard(true);
          markHeavyCardShown();
        }
      } catch (error) {
        console.error('Failed to initialize data:', error);
      }
    };
    
    initializeData();
    
    // Staggered entrance animations
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
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ];

    // Stagger card animations
    const cardStaggerAnimations = cardAnimations.map((anim, index) => 
      Animated.timing(anim, {
        toValue: 1,
        duration: 600,
        delay: index * 150,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      })
    );

    // Stagger action button animations
    const actionStaggerAnimations = actionButtonAnimations.map((anim, index) => 
      Animated.timing(anim, {
        toValue: 1,
        duration: 500,
        delay: 800 + (index * 100),
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      })
    );

    Animated.parallel([
      ...animations,
      ...cardStaggerAnimations,
      ...actionStaggerAnimations,
    ]).start();
  }, [isAuthenticated]);

  const handleSlotPress = useCallback((slot: CheckIn['slot']) => {
    setSelectedSlot(slot);
    setShowCheckInModal(true);
  }, []);
  
  const handleCheckInSave = useCallback(async (checkInData: Omit<CheckIn, 'id' | 'timestampISO'>) => {
    await addCheckIn(checkInData);
    setShowCheckInModal(false);
    setSelectedSlot(undefined);
  }, [addCheckIn]);
  
  const handleHeavyCardDismiss = useCallback(() => {
    setShowHeavyCard(false);
    markHeavyCardDismissed();
  }, [markHeavyCardDismissed]);


  const streak = getStreak();
  const dailyWellnessScore = getDailyScore();
  const completionPercentage = Math.round((todayCheckIns.length / 4) * 100);
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

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Animated.View style={[
          styles.content, 
          { 
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }, { scale: scaleAnim }]
          }
        ]}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Welcome back,</Text>
              <Text style={styles.name}>
                {profile?.full_name || user?.email?.split('@')[0] || 'User'}
              </Text>
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

          {/* Daily Wellness Score Card */}
          <Animated.View style={{
            opacity: cardAnimations[0],
            transform: [{
              translateY: cardAnimations[0].interpolate({
                inputRange: [0, 1],
                outputRange: [30, 0],
              })
            }]
          }}>
            <Card style={styles.scoreCard}>
              <View style={styles.scoreHeader}>
                <View>
                  <Text style={styles.scoreTitle}>Daily Wellness Score</Text>
                  <Text style={styles.scoreSubtitle}>
                    based on today&apos;s check-ins
                  </Text>
                </View>
                <ProgressRing
                  size={60}
                  strokeWidth={4}
                  progress={dailyWellnessScore}
                  color="#000000"
                  trackColor="rgba(0,0,0,0.24)"
                />
              </View>
              <View style={styles.scoreCenter}>
                <Text style={styles.scoreCenterNumber}>{dailyWellnessScore}%</Text>
              </View>
            </Card>
          </Animated.View>

          {/* Check-in Progress */}
          <Animated.View style={{
            opacity: cardAnimations[1],
            transform: [{
              translateY: cardAnimations[1].interpolate({
                inputRange: [0, 1],
                outputRange: [30, 0],
              })
            }]
          }}>
            <Card style={styles.checkInCard}>
              <CheckInProgress 
                todayCheckIns={todayCheckIns}
                onSlotPress={handleSlotPress}
              />
            </Card>
          </Animated.View>

          {/* Quick Actions */}
          <Animated.View style={{
            opacity: cardAnimations[2],
            transform: [{
              translateY: cardAnimations[2].interpolate({
                inputRange: [0, 1],
                outputRange: [30, 0],
              })
            }]
          }}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActions}>
              <Animated.View style={{
                opacity: actionButtonAnimations[0],
                transform: [{
                  scale: actionButtonAnimations[0].interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  })
                }]
              }}>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => router.push('/gratitude')}
                >
                  <Heart color="#FFD700" size={24} />
                  <Text style={styles.actionText}>Gratitude</Text>
                </TouchableOpacity>
              </Animated.View>
              <Animated.View style={{
                opacity: actionButtonAnimations[1],
                transform: [{
                  scale: actionButtonAnimations[1].interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  })
                }]
              }}>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => router.push('/breathing')}
                >
                  <Wind color="#FFD700" size={24} />
                  <Text style={styles.actionText}>Breathing</Text>
                </TouchableOpacity>
              </Animated.View>
              <Animated.View style={{
                opacity: actionButtonAnimations[2],
                transform: [{
                  scale: actionButtonAnimations[2].interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  })
                }]
              }}>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => router.push('/reflection')}
                >
                  <MessageCircle color="#FFD700" size={24} />
                  <Text style={styles.actionText}>Reflection</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </Animated.View>

          {/* Today Preview */}
          <Animated.View style={{
            opacity: cardAnimations[3],
            transform: [{
              translateY: cardAnimations[3].interpolate({
                inputRange: [0, 1],
                outputRange: [30, 0],
              })
            }]
          }}>
            <Card style={styles.previewCard}>
              <Text style={styles.cardTitle}>Today&apos;s Summary</Text>
              <View style={styles.previewStats}>
                <View style={styles.stat}>
                  <Text style={styles.statNumber}>{completionPercentage}%</Text>
                  <Text style={styles.statLabel}>Daily Check-in Completed</Text>
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
          </Animated.View>
          
          {/* Heavy Days Suggestion Card */}
          {showHeavyCard && (
            <Animated.View style={{
              opacity: cardAnimations[4],
              transform: [{
                translateY: cardAnimations[4].interpolate({
                  inputRange: [0, 1],
                  outputRange: [30, 0],
                })
              }]
            }}>
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
            </Animated.View>
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
    position: 'relative',
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
  scoreCenter: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreCenterNumber: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
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
});