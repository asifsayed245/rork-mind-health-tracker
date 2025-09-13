import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface MoodSelectorProps {
  value: number;
  onChange: (mood: number) => void;
  label: string;
}

const moods = ['😢', '😕', '😐', '😊', '😄'];

export default function MoodSelector({ value, onChange, label }: MoodSelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.moodRow}>
        {moods.map((emoji, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.moodButton,
              value === index + 1 && styles.selectedMood,
            ]}
            onPress={() => onChange(index + 1)}
          >
            <Text style={styles.emoji}>{emoji}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  label: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  moodButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  selectedMood: {
    backgroundColor: '#FFD700',
  },
  emoji: {
    fontSize: 24,
  },
});