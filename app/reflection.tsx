import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { X, ChevronRight, ChevronLeft } from 'lucide-react-native';
import { useJournalStore } from '@/stores/journalStore';
import Card from '@/components/Card';

const reframeOptions = [
  'This is a learning opportunity',
  'I can handle this challenge',
  'This too shall pass',
  'I am stronger than I think',
  'Every setback is a setup for a comeback',
];

export default function ReflectionScreen() {
  const { addEntry } = useJournalStore();
  const [step, setStep] = useState(1);
  const [event, setEvent] = useState('');
  const [thought, setThought] = useState('');
  const [reframe, setReframe] = useState('');
  const [customReframe, setCustomReframe] = useState('');
  const insets = useSafeAreaInsets();

  const handleNext = () => {
    if (step === 1 && !event.trim()) {
      Alert.alert('Please describe what happened', 'Share the event or situation you want to reflect on.');
      return;
    }
    if (step === 2 && !thought.trim()) {
      Alert.alert('Please share your thought', 'What went through your mind during this situation?');
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      router.back();
    }
  };

  const handleSave = async () => {
    const finalReframe = reframe === 'custom' ? customReframe : reframe;
    
    if (!finalReframe.trim()) {
      Alert.alert('Please choose or write a reframe', 'How can you view this situation more positively?');
      return;
    }

    await addEntry({
      type: 'reflection',
      title: 'Reflection Entry',
      content: `Event: ${event}\n\nThought: ${thought}\n\nReframe: ${finalReframe}`,
      mood: 3,
      tags: [],
      meta: {
        event: event.trim(),
        thought: thought.trim(),
        reframe: finalReframe.trim(),
      },
    });

    router.back();
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <View style={styles.stepContainer}>
            <Card style={styles.questionCard}>
              <Text style={styles.stepNumber}>Step 1 of 3</Text>
              <Text style={styles.question}>What happened?</Text>
              <Text style={styles.subtitle}>
                Describe the event or situation you want to reflect on
              </Text>
            </Card>

            <TextInput
              style={styles.textInput}
              value={event}
              onChangeText={setEvent}
              placeholder="Today I experienced..."
              placeholderTextColor="#666"
              multiline
              textAlignVertical="top"
              autoFocus
            />
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContainer}>
            <Card style={styles.questionCard}>
              <Text style={styles.stepNumber}>Step 2 of 3</Text>
              <Text style={styles.question}>What thought did you have?</Text>
              <Text style={styles.subtitle}>
                What went through your mind during this situation?
              </Text>
            </Card>

            <TextInput
              style={styles.textInput}
              value={thought}
              onChangeText={setThought}
              placeholder="I thought..."
              placeholderTextColor="#666"
              multiline
              textAlignVertical="top"
              autoFocus
            />
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContainer}>
            <Card style={styles.questionCard}>
              <Text style={styles.stepNumber}>Step 3 of 3</Text>
              <Text style={styles.question}>Reframe it positively</Text>
              <Text style={styles.subtitle}>
                Choose a more helpful way to think about this situation
              </Text>
            </Card>

            <View style={styles.reframeOptions}>
              {reframeOptions.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.reframeOption,
                    reframe === option && styles.selectedReframeOption,
                  ]}
                  onPress={() => setReframe(option)}
                >
                  <Text
                    style={[
                      styles.reframeOptionText,
                      reframe === option && styles.selectedReframeOptionText,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={[
                  styles.reframeOption,
                  reframe === 'custom' && styles.selectedReframeOption,
                ]}
                onPress={() => setReframe('custom')}
              >
                <Text
                  style={[
                    styles.reframeOptionText,
                    reframe === 'custom' && styles.selectedReframeOptionText,
                  ]}
                >
                  Write your own
                </Text>
              </TouchableOpacity>

              {reframe === 'custom' && (
                <TextInput
                  style={styles.customReframeInput}
                  value={customReframe}
                  onChangeText={setCustomReframe}
                  placeholder="Write your positive reframe..."
                  placeholderTextColor="#666"
                  multiline
                  textAlignVertical="top"
                  autoFocus
                />
              )}
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          {step > 1 ? (
            <ChevronLeft color="#fff" size={24} />
          ) : (
            <X color="#fff" size={24} />
          )}
        </TouchableOpacity>
        <Text style={styles.title}>Reflection</Text>
        {step < 3 ? (
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>Next</Text>
            <ChevronRight color="#1a1a1a" size={16} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        {renderStep()}
      </ScrollView>

      <View style={styles.progressBar}>
        {[1, 2, 3].map((stepNumber) => (
          <View
            key={stepNumber}
            style={[
              styles.progressDot,
              step >= stepNumber && styles.activeProgressDot,
            ]}
          />
        ))}
      </View>
    </KeyboardAvoidingView>
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
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 4,
  },
  nextButtonText: {
    color: '#1a1a1a',
    fontSize: 14,
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
  },
  stepContainer: {
    flex: 1,
  },
  questionCard: {
    backgroundColor: '#8b5cf6',
    marginBottom: 24,
  },
  stepNumber: {
    color: '#1a1a1a',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    opacity: 0.7,
  },
  question: {
    color: '#1a1a1a',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: '#333',
    fontSize: 14,
  },
  textInput: {
    backgroundColor: '#2a2a2a',
    color: '#fff',
    fontSize: 16,
    padding: 16,
    borderRadius: 12,
    height: 240,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  reframeOptions: {
    flex: 1,
    marginBottom: 20,
  },
  reframeOption: {
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#444',
  },
  selectedReframeOption: {
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
  },
  reframeOptionText: {
    color: '#fff',
    fontSize: 16,
  },
  selectedReframeOptionText: {
    color: '#1a1a1a',
    fontWeight: '600',
  },
  customReframeInput: {
    backgroundColor: '#2a2a2a',
    color: '#fff',
    fontSize: 16,
    padding: 16,
    borderRadius: 12,
    height: 144,
    marginTop: 12,
    textAlignVertical: 'top',
  },
  progressBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#444',
  },
  activeProgressDot: {
    backgroundColor: '#8b5cf6',
  },
});