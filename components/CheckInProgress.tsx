import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { CheckIn } from '@/stores/checkInStore';

interface CheckInProgressProps {
  todayCheckIns: CheckIn[];
  onSlotPress: (slot: CheckIn['slot']) => void;
}

const SLOTS: { key: CheckIn['slot']; label: string; emoji: string }[] = [
  { key: 'morning', label: 'Morning', emoji: '🌅' },
  { key: 'afternoon', label: 'Afternoon', emoji: '☀️' },
  { key: 'evening', label: 'Evening', emoji: '🌆' },
  { key: 'night', label: 'Night', emoji: '🌙' },
];

export default function CheckInProgress({ todayCheckIns, onSlotPress }: CheckInProgressProps) {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const slotAnimations = useRef(
    SLOTS.map(() => new Animated.Value(0))
  ).current;

  const getSlotStatus = (slot: CheckIn['slot']) => {
    return todayCheckIns.find(checkIn => checkIn.slot === slot) ? 'completed' : 'pending';
  };

  useEffect(() => {
    // Animate progress bar
    const targetProgress = (todayCheckIns.length / 4) * 100;
    Animated.timing(progressAnim, {
      toValue: targetProgress,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    // Animate slot chips
    const slotStaggerAnimations = slotAnimations.map((anim, index) => {
      const isCompleted = getSlotStatus(SLOTS[index].key) === 'completed';
      return Animated.timing(anim, {
        toValue: isCompleted ? 1 : 0.7,
        duration: 600,
        delay: index * 100,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      });
    });

    Animated.parallel(slotStaggerAnimations).start();
  }, [todayCheckIns.length]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Today&apos;s Check-ins</Text>
      <View style={styles.slotsContainer}>
        {SLOTS.map((slot, index) => {
          const status = getSlotStatus(slot.key);
          const isCompleted = status === 'completed';
          const slotAnim = slotAnimations[index];
          
          return (
            <Animated.View
              key={slot.key}
              style={{
                flex: 1,
                opacity: slotAnim,
                transform: [{
                  scale: slotAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  })
                }]
              }}
            >
              <TouchableOpacity
                style={[
                  styles.slotChip,
                  isCompleted ? styles.completedChip : styles.pendingChip,
                ]}
                onPress={() => !isCompleted && onSlotPress(slot.key)}
                disabled={isCompleted}
              >
                <Text style={styles.slotEmoji}>{slot.emoji}</Text>
                <Text style={[
                  styles.slotLabel,
                  isCompleted ? styles.completedLabel : styles.pendingLabel,
                ]}>
                  {isCompleted ? '✓' : '+'} {slot.label}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
      <View style={styles.progressBar}>
        <Animated.View 
          style={[
            styles.progressFill,
            { 
              width: progressAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              })
            }
          ]} 
        />
      </View>
      <Text style={styles.progressText}>
        {todayCheckIns.length}/4 completed • {Math.round((todayCheckIns.length / 4) * 100)}%
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  slotsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  slotChip: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 2,
  },
  completedChip: {
    backgroundColor: '#2d4a2d',
    borderColor: '#4ade80',
  },
  pendingChip: {
    backgroundColor: '#2a2a2a',
    borderColor: '#FFD700',
  },
  slotEmoji: {
    fontSize: 16,
    marginBottom: 4,
  },
  slotLabel: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  completedLabel: {
    color: '#4ade80',
  },
  pendingLabel: {
    color: '#FFD700',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 2,
  },
  progressText: {
    color: '#999',
    fontSize: 12,
    textAlign: 'center',
  },
});