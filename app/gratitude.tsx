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
import { X } from 'lucide-react-native';
import { useJournalStore } from '@/stores/journalStore';
import Card from '@/components/Card';

const gratitudeTags = [
  'Almighty', 'Parents', 'Family', 'Partner', 'Friends', 
  'Colleagues', 'Classmates', 'Nature', 'Self'
];

export default function GratitudeScreen() {
  const { addEntry } = useJournalStore();
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const insets = useSafeAreaInsets();

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleSave = async () => {
    if (!content.trim()) {
      Alert.alert('Please write something', 'Share what you\'re grateful for today.');
      return;
    }

    await addEntry({
      type: 'gratitude',
      title: 'Gratitude Entry',
      content: content.trim(),
      mood: 4,
      tags: selectedTags,
    });

    Alert.alert(
      'Gratitude logged ✨', 
      'Thanks for pausing to appreciate.',
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <X color="#fff" size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Gratitude</Text>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        <Card style={styles.questionCard}>
          <Text style={styles.question}>What are you grateful for today?</Text>
          <Text style={styles.subtitle}>
            Take a moment to appreciate the good things in your life
          </Text>
        </Card>

        <TextInput
          style={styles.textInput}
          value={content}
          onChangeText={setContent}
          placeholder="I'm grateful for..."
          placeholderTextColor="#666"
          multiline
          textAlignVertical="top"
          autoFocus
        />

        <Text style={styles.sectionTitle}>Tags (optional)</Text>
        <View style={styles.tagsContainer}>
          {gratitudeTags.map((tag) => (
            <TouchableOpacity
              key={tag}
              style={[
                styles.tag,
                selectedTags.includes(tag) && styles.selectedTag,
              ]}
              onPress={() => toggleTag(tag)}
            >
              <Text
                style={[
                  styles.tagText,
                  selectedTags.includes(tag) && styles.selectedTagText,
                ]}
              >
                {tag}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
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
  questionCard: {
    backgroundColor: '#fbbf24',
    marginBottom: 24,
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
    marginBottom: 24,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#444',
  },
  selectedTag: {
    backgroundColor: '#fbbf24',
    borderColor: '#fbbf24',
  },
  tagText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  selectedTagText: {
    color: '#1a1a1a',
  },
});