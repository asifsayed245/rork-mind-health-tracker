import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Lock, Heart, Moon, Brain, Zap, Users } from 'lucide-react-native';
import { useUserStore } from '@/stores/userStore';
import Card from '@/components/Card';

interface ActivityPack {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  isLocked: boolean;
  activities: string[];
}

const activityPacks: ActivityPack[] = [
  {
    id: 'gratitude',
    title: 'Gratitude Basics',
    description: 'Build a foundation of thankfulness and appreciation',
    icon: <Heart color="#4ade80" size={24} />,
    color: '#2d4a2d',
    isLocked: false,
    activities: [
      'Gratitude Journal',
      'Breathing Exercise',
      'Reflection Practice',
      'Mindful Moments',
    ],
  },
  {
    id: 'sleep',
    title: 'Sleep Reset',
    description: 'Improve your sleep quality and bedtime routine',
    icon: <Moon color="#60a5fa" size={24} />,
    color: '#1e3a8a',
    isLocked: true,
    activities: [
      'Progressive Muscle Relaxation',
      'Sleep Story Meditation',
      'Bedtime Routine Builder',
      'Sleep Hygiene Tips',
    ],
  },
  {
    id: 'stress',
    title: 'Exam Stress',
    description: 'Manage academic pressure and test anxiety',
    icon: <Brain color="#f59e0b" size={24} />,
    color: '#451a03',
    isLocked: true,
    activities: [
      'Study Break Breathing',
      'Confidence Building',
      'Test Anxiety Relief',
      'Focus Enhancement',
    ],
  },
  {
    id: 'productivity',
    title: 'Productivity',
    description: 'Boost focus and accomplish your goals',
    icon: <Zap color="#eab308" size={24} />,
    color: '#422006',
    isLocked: true,
    activities: [
      'Pomodoro Meditation',
      'Goal Setting Workshop',
      'Procrastination Buster',
      'Energy Boost Exercises',
    ],
  },
  {
    id: 'relationships',
    title: 'Relationships',
    description: 'Strengthen connections and communication',
    icon: <Users color="#ec4899" size={24} />,
    color: '#4a044e',
    isLocked: true,
    activities: [
      'Empathy Building',
      'Communication Skills',
      'Conflict Resolution',
      'Love & Kindness Meditation',
    ],
  },
];

export default function ActivitiesScreen() {
  const { profile } = useUserStore();

  const handlePackPress = useCallback((pack: ActivityPack) => {
    if (pack.isLocked && !profile?.isPremium) {
      Alert.alert(
        '🌟 Premium Feature',
        `Unlock ${pack.title} and all other premium activities with a subscription.`,
        [
          { text: 'Maybe Later', style: 'cancel' },
          { text: 'Upgrade Now', onPress: () => console.log('Navigate to premium') },
        ]
      );
      return;
    }
    
    // Navigate to activity selection for this pack
    if (pack.id === 'gratitude') {
      // Show activity selection for gratitude pack
      showActivitySelection(pack);
    } else {
      Alert.alert(
        'Coming Soon',
        `${pack.title} activities will be available in the next update!`
      );
    }
  }, [profile?.isPremium]);

  const showActivitySelection = (pack: ActivityPack) => {
    const activities = [
      { name: 'Gratitude Journal', route: '/gratitude' },
      { name: 'Breathing Exercise', route: '/breathing' },
      { name: 'Reflection Practice', route: '/reflection' },
      { name: 'Mindful Moments', action: () => Alert.alert('Coming Soon', 'Mindful Moments will be available soon!') },
    ];

    Alert.alert(
      pack.title,
      'Choose an activity to start your wellness journey:',
      [
        ...activities.map(activity => ({
          text: activity.name,
          onPress: () => {
            if (activity.route) {
              router.push(activity.route as any);
            } else if (activity.action) {
              activity.action();
            }
          }
        })),
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleFreeActivityPress = useCallback((activityName: string) => {
    switch (activityName) {
      case 'Gratitude Journal':
        router.push('/gratitude');
        break;
      case 'Breathing Exercise':
        router.push('/breathing');
        break;
      case 'Reflection Practice':
        router.push('/reflection');
        break;
      default:
        Alert.alert('Coming Soon', 'This activity will be available soon!');
    }
  }, []);

  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Activities</Text>
        <Text style={styles.subtitle}>Guided exercises for mental wellness</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activityPacks.map((pack) => (
          <TouchableOpacity
            key={pack.id}
            onPress={() => handlePackPress(pack)}
            activeOpacity={0.8}
          >
            <Card style={[styles.packCard, { backgroundColor: pack.color }]}>
              <View style={styles.packHeader}>
                <View style={styles.packIcon}>
                  {pack.icon}
                </View>
                {pack.isLocked && !profile?.isPremium && (
                  <View style={styles.lockIcon}>
                    <Lock color="#999" size={16} />
                  </View>
                )}
              </View>
              
              <Text style={styles.packTitle}>{pack.title}</Text>
              <Text style={styles.packDescription}>{pack.description}</Text>
              
              <View style={styles.activitiesPreview}>
                <Text style={styles.activitiesLabel}>
                  {pack.activities.length} activities
                </Text>
                <View style={styles.activityDots}>
                  {pack.activities.slice(0, 4).map((_, index) => (
                    <View key={index} style={styles.activityDot} />
                  ))}
                </View>
              </View>

              {pack.isLocked && !profile?.isPremium && (
                <View style={styles.premiumBadge}>
                  <Text style={styles.premiumText}>Premium</Text>
                </View>
              )}
            </Card>
          </TouchableOpacity>
        ))}

        {/* Free Pack Details */}
        <Card style={styles.freePackDetails}>
          <Text style={styles.freePackTitle}>Try Gratitude Basics</Text>
          <Text style={styles.freePackDescription}>
            Start your wellness journey with our free gratitude exercises. 
            No subscription required.
          </Text>
          
          <View style={styles.freeActivities}>
            {[
              { name: 'Gratitude Journal', duration: '5 min', available: true },
              { name: 'Breathing Exercise', duration: '3 min', available: true },
              { name: 'Reflection Practice', duration: '10 min', available: true },
              { name: 'Mindful Moments', duration: '7 min', available: false },
            ].map((activity, index) => (
              <TouchableOpacity 
                key={index} 
                style={[
                  styles.freeActivity,
                  !activity.available && styles.disabledActivity
                ]}
                onPress={() => activity.available && handleFreeActivityPress(activity.name)}
                disabled={!activity.available}
              >
                <View style={styles.activityIcon}>
                  <Heart color={activity.available ? "#4ade80" : "#666"} size={16} />
                </View>
                <Text style={[
                  styles.activityName,
                  !activity.available && styles.disabledActivityText
                ]}>
                  {activity.name}
                </Text>
                <Text style={[
                  styles.activityDuration,
                  !activity.available && styles.disabledActivityText
                ]}>
                  {activity.duration}
                </Text>
                {!activity.available && (
                  <Text style={styles.comingSoonText}>Soon</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Premium CTA */}
        {!profile?.isPremium && (
          <Card style={styles.premiumCta}>
            <Text style={styles.premiumCtaTitle}>🌟 Unlock All Activities</Text>
            <Text style={styles.premiumCtaDescription}>
              Get access to all activity packs, advanced insights, and premium features.
            </Text>
            <TouchableOpacity 
              style={styles.premiumButton}
              onPress={() => Alert.alert('Premium', 'Premium features coming soon!')}
            >
              <Text style={styles.premiumButtonText}>Start Free Trial</Text>
            </TouchableOpacity>
          </Card>
        )}
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
  subtitle: {
    color: '#999',
    fontSize: 16,
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  packCard: {
    marginBottom: 16,
    position: 'relative',
  },
  packHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  packIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  packTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  packDescription: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  activitiesPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activitiesLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    fontWeight: '600',
  },
  activityDots: {
    flexDirection: 'row',
    gap: 4,
  },
  activityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  premiumBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  premiumText: {
    color: '#1a1a1a',
    fontSize: 10,
    fontWeight: 'bold',
  },
  freePackDetails: {
    marginBottom: 16,
  },
  freePackTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  freePackDescription: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  freeActivities: {
    gap: 12,
  },
  freeActivity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2d4a2d',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityName: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  activityDuration: {
    color: '#999',
    fontSize: 12,
  },
  premiumCta: {
    marginBottom: 24,
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
  },
  premiumCtaTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  premiumCtaDescription: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  premiumButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
  },
  premiumButtonText: {
    color: '#1a1a1a',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledActivity: {
    opacity: 0.5,
  },
  disabledActivityText: {
    color: '#666',
  },
  comingSoonText: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: 'bold',
  },
});