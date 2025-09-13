import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
      '3 Things I\'m Grateful For',
      'Gratitude Letter Writing',
      'Appreciation Meditation',
      'Thank You Practice',
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
      // Show paywall modal
      return;
    }
    // Navigate to pack details
  }, [profile?.isPremium]);

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
            {activityPacks[0].activities.map((activity, index) => (
              <TouchableOpacity key={index} style={styles.freeActivity}>
                <View style={styles.activityIcon}>
                  <Heart color="#4ade80" size={16} />
                </View>
                <Text style={styles.activityName}>{activity}</Text>
                <Text style={styles.activityDuration}>5 min</Text>
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
            <TouchableOpacity style={styles.premiumButton}>
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
});