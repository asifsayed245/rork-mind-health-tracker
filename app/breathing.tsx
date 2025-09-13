import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { X, Play, Pause, Square } from 'lucide-react-native';
import { useCheckInStore } from '@/stores/checkInStore';
import Card from '@/components/Card';
import MoodSelector from '@/components/MoodSelector';

const durations = [
  { label: '1m', value: 60 },
  { label: '2m', value: 120 },
  { label: '3m', value: 180 },
];

export default function BreathingScreen() {
  const { addActivitySession } = useCheckInStore();
  const [selectedDuration, setSelectedDuration] = useState(120);
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120);
  const [showPostSession, setShowPostSession] = useState(false);
  const [postMood, setPostMood] = useState(3);
  const [postStress, setPostStress] = useState(3);
  
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    setTimeLeft(selectedDuration);
  }, [selectedDuration]);

  const handleComplete = () => {
    setIsActive(false);
    stopBreathingAnimation();
    setShowPostSession(true);
  };

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsActive(false);
            setShowPostSession(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, timeLeft]);

  const startBreathingAnimation = () => {
    const breatheIn = () => {
      Animated.timing(scaleAnim, {
        toValue: 1.5,
        duration: 4000,
        useNativeDriver: true,
      }).start(() => {
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }).start(() => {
          if (isActive) breatheIn();
        });
      });
    };
    breatheIn();
  };

  const stopBreathingAnimation = () => {
    scaleAnim.stopAnimation();
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const handleStart = () => {
    setIsActive(true);
    startBreathingAnimation();
  };

  const handlePause = () => {
    setIsActive(false);
    stopBreathingAnimation();
  };

  const handleStop = () => {
    setIsActive(false);
    setTimeLeft(selectedDuration);
    stopBreathingAnimation();
    
    // Log incomplete session
    addActivitySession({
      type: 'breathing',
      duration: selectedDuration - timeLeft,
      completed: false,
    });
  };



  const handleSavePostSession = async () => {
    await addActivitySession({
      type: 'breathing',
      duration: selectedDuration,
      completed: true,
      postMood,
      postStress,
    });

    Alert.alert(
      'Breathing complete 🌬️',
      'One calm minute can change a day.',
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (showPostSession) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <X color="#fff" size={24} />
          </TouchableOpacity>
          <Text style={styles.title}>How do you feel?</Text>
          <TouchableOpacity style={styles.saveButton} onPress={handleSavePostSession}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Card style={styles.completedCard}>
            <Text style={styles.completedTitle}>🌬️ Session Complete!</Text>
            <Text style={styles.completedText}>
              You completed a {selectedDuration / 60} minute breathing session
            </Text>
          </Card>

          <MoodSelector 
            value={postMood} 
            onChange={setPostMood} 
            label="How is your mood now?" 
          />
          
          <MoodSelector 
            value={postStress} 
            onChange={setPostStress} 
            label="How is your stress level?" 
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <X color="#fff" size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Breathing</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <Card style={styles.instructionCard}>
          <Text style={styles.instruction}>Find a comfortable position</Text>
          <Text style={styles.subInstruction}>
            Breathe in as the circle expands, breathe out as it contracts
          </Text>
        </Card>

        {!isActive && (
          <View style={styles.durationSelector}>
            <Text style={styles.sectionTitle}>Duration</Text>
            <View style={styles.durationButtons}>
              {durations.map((duration) => (
                <TouchableOpacity
                  key={duration.value}
                  style={[
                    styles.durationButton,
                    selectedDuration === duration.value && styles.selectedDurationButton,
                  ]}
                  onPress={() => setSelectedDuration(duration.value)}
                >
                  <Text
                    style={[
                      styles.durationButtonText,
                      selectedDuration === duration.value && styles.selectedDurationButtonText,
                    ]}
                  >
                    {duration.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={styles.breathingContainer}>
          <Animated.View
            style={[
              styles.breathingCircle,
              {
                transform: [{ scale: scaleAnim }],
              },
            ]}
          />
          <Text style={styles.timer}>{formatTime(timeLeft)}</Text>
        </View>

        <View style={styles.controls}>
          {!isActive ? (
            <TouchableOpacity style={styles.playButton} onPress={handleStart}>
              <Play color="#1a1a1a" size={32} />
            </TouchableOpacity>
          ) : (
            <View style={styles.activeControls}>
              <TouchableOpacity style={styles.controlButton} onPress={handlePause}>
                <Pause color="#fff" size={24} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.controlButton} onPress={handleStop}>
                <Square color="#fff" size={24} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  saveButtonText: {
    color: '#1a1a1a',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  instructionCard: {
    backgroundColor: '#60a5fa',
    marginBottom: 32,
    alignItems: 'center',
  },
  instruction: {
    color: '#1a1a1a',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subInstruction: {
    color: '#333',
    fontSize: 14,
    textAlign: 'center',
  },
  durationSelector: {
    marginBottom: 32,
    alignItems: 'center',
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  durationButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  durationButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#444',
  },
  selectedDurationButton: {
    backgroundColor: '#60a5fa',
    borderColor: '#60a5fa',
  },
  durationButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  selectedDurationButtonText: {
    color: '#1a1a1a',
  },
  breathingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  breathingCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#60a5fa',
    opacity: 0.8,
  },
  timer: {
    position: 'absolute',
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  controls: {
    marginBottom: 32,
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeControls: {
    flexDirection: 'row',
    gap: 20,
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedCard: {
    backgroundColor: '#4ade80',
    marginBottom: 32,
    alignItems: 'center',
  },
  completedTitle: {
    color: '#1a1a1a',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  completedText: {
    color: '#333',
    fontSize: 14,
    textAlign: 'center',
  },
});