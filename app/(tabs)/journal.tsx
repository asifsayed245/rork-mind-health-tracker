import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, X, Mic, MicOff, Edit3, Trash2 } from 'lucide-react-native';
import { useJournalStore, JournalEntry } from '@/stores/journalStore';
import Card from '@/components/Card';
import MoodSelector from '@/components/MoodSelector';

const entryTypes = [
  { key: 'positive', label: 'Positive', color: '#4ade80', icon: '🙂' },
  { key: 'negative', label: 'Negative', color: '#f87171', icon: '😞' },
  { key: 'gratitude', label: 'Gratitude', color: '#fbbf24', icon: '💛' },
  { key: 'reflection', label: 'Reflection', color: '#8b5cf6', icon: '🧠' },
  { key: 'free', label: 'Free Write', color: '#60a5fa', icon: '✍️' },
];

const filterTabs = ['All', 'Positive', 'Negative', 'Gratitude', 'Reflection'];

export default function JournalScreen() {
  const { entries, loadEntries, addEntry, updateEntry, deleteEntry, getEntryById, canEditEntry, getEntryCounts } = useJournalStore();
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedType, setSelectedType] = useState<'positive' | 'negative' | 'gratitude' | 'reflection' | 'free'>('positive');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState(3);
  const [activeFilter, setActiveFilter] = useState('All');
  const [isRecording, setIsRecording] = useState(false);
  const [entryCounts, setEntryCounts] = useState({ all: 0, positive: 0, negative: 0, gratitude: 0, reflection: 0 });

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  useEffect(() => {
    setEntryCounts(getEntryCounts());
  }, [entries, getEntryCounts]);

  const handleSaveEntry = useCallback(async () => {
    if (!title.trim() || !content.trim()) return;
    
    if (isEditing && selectedEntry) {
      await updateEntry(selectedEntry.id, {
        type: selectedType,
        title: title.trim(),
        content: content.trim(),
        mood,
        tags: [],
      });
    } else {
      await addEntry({
        type: selectedType,
        title: title.trim(),
        content: content.trim(),
        mood,
        tags: [],
      });
    }
    
    setShowModal(false);
    setIsEditing(false);
    setSelectedEntry(null);
    setTitle('');
    setContent('');
    setMood(3);
  }, [addEntry, updateEntry, selectedEntry, isEditing, selectedType, title, content, mood]);

  const filteredEntries = entries.filter(entry => {
    if (activeFilter === 'All') return true;
    return entry.type === activeFilter.toLowerCase();
  });

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleEntryPress = (entry: JournalEntry) => {
    setSelectedEntry(entry);
    setShowDetailModal(true);
  };

  const handleEditEntry = () => {
    if (!selectedEntry) return;
    
    setSelectedType(selectedEntry.type);
    setTitle(selectedEntry.title);
    setContent(selectedEntry.content);
    setMood(selectedEntry.mood);
    setIsEditing(true);
    setShowDetailModal(false);
    setShowModal(true);
  };

  const handleDeleteEntry = () => {
    if (!selectedEntry) return;
    
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this entry? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteEntry(selectedEntry.id);
            setShowDetailModal(false);
            setSelectedEntry(null);
          },
        },
      ]
    );
  };

  const getFilterCount = (filter: string) => {
    switch (filter) {
      case 'All': return entryCounts.all;
      case 'Positive': return entryCounts.positive;
      case 'Negative': return entryCounts.negative;
      case 'Gratitude': return entryCounts.gratitude;
      case 'Reflection': return entryCounts.reflection;
      default: return 0;
    }
  };

  const getBarHeight = (filter: string) => {
    const count = getFilterCount(filter);
    const maxCount = Math.max(...filterTabs.map(f => getFilterCount(f)), 1);
    const baseHeight = 140; // 30% taller than previous 108px (108 * 1.3)
    return Math.max((count / maxCount) * baseHeight, count > 0 ? 8 : baseHeight * 0.1);
  };



  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Journal</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowModal(true)}
        >
          <Plus color="#1a1a1a" size={20} />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
          {filterTabs.map((filter) => {
            const count = getFilterCount(filter);
            const barHeight = getBarHeight(filter);
            return (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterTab,
                  activeFilter === filter && styles.activeFilterTab,
                ]}
                onPress={() => setActiveFilter(filter)}
              >
                <View style={styles.filterContent}>
                  <View style={[
                    styles.filterBar,
                    { height: barHeight },
                    activeFilter === filter && styles.activeFilterBar,
                  ]} />
                  <Text
                    style={[
                      styles.filterText,
                      activeFilter === filter && styles.activeFilterText,
                    ]}
                  >
                    {filter}
                  </Text>
                  <View style={[
                    styles.countBadge,
                    activeFilter === filter && styles.activeCountBadge,
                  ]}>
                    <Text style={[
                      styles.countText,
                      activeFilter === filter && styles.activeCountText,
                    ]}>
                      {count}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Entries List */}
      <ScrollView style={styles.entriesList} showsVerticalScrollIndicator={false}>
        {filteredEntries.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No entries yet</Text>
            <Text style={styles.emptyText}>
              Start journaling to track your thoughts and feelings
            </Text>
          </Card>
        ) : (
          filteredEntries.map((entry) => (
            <TouchableOpacity key={entry.id} onPress={() => handleEntryPress(entry)}>
              <Card style={styles.entryCard}>
                <View style={styles.entryHeader}>
                  <View style={styles.entryInfo}>
                    <Text style={styles.entryTitle}>
                      {entry.type === 'reflection' && entry.meta?.event ? entry.meta.event : entry.title}
                    </Text>
                    <Text style={styles.entryDate}>{formatDate(entry.timestamp)}</Text>
                  </View>
                  <View style={styles.entryMeta}>
                    <Text style={styles.typeIcon}>
                      {entryTypes.find(t => t.key === entry.type)?.icon || '📝'}
                    </Text>
                    <View
                      style={[
                        styles.typeIndicator,
                        { backgroundColor: entryTypes.find(t => t.key === entry.type)?.color },
                      ]}
                    />
                  </View>
                </View>
                {entry.type === 'reflection' && entry.meta ? (
                  <View>
                    <Text style={styles.reflectionReframe} numberOfLines={2}>
                      💡 {entry.meta.reframe}
                    </Text>
                    {entry.meta.thought && (
                      <Text style={styles.reflectionThought} numberOfLines={1}>
                        Thought: {entry.meta.thought}
                      </Text>
                    )}
                  </View>
                ) : (
                  <Text style={styles.entryContent} numberOfLines={2}>
                    {entry.content}
                  </Text>
                )}
              </Card>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Add Entry Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => {
              setShowModal(false);
              setIsEditing(false);
              setSelectedEntry(null);
              setTitle('');
              setContent('');
              setMood(3);
            }}>
              <X color="#fff" size={24} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{isEditing ? 'Edit Entry' : 'New Entry'}</Text>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveEntry}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Entry Type Selection */}
            <Text style={styles.sectionLabel}>Entry Type</Text>
            <View style={styles.typeSelector}>
              {entryTypes.map((type) => (
                <TouchableOpacity
                  key={type.key}
                  style={[
                    styles.typeButton,
                    selectedType === type.key && { backgroundColor: type.color },
                  ]}
                  onPress={() => setSelectedType(type.key as any)}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      selectedType === type.key && { color: '#1a1a1a' },
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Title Input */}
            <Text style={styles.sectionLabel}>Title</Text>
            <TextInput
              style={styles.titleInput}
              value={title}
              onChangeText={setTitle}
              placeholder="Give your entry a title..."
              placeholderTextColor="#666"
            />

            {/* Content Input */}
            <Text style={styles.sectionLabel}>Content</Text>
            <View style={styles.contentContainer}>
              <TextInput
                style={styles.contentInput}
                value={content}
                onChangeText={setContent}
                placeholder="Write your thoughts..."
                placeholderTextColor="#666"
                multiline
                textAlignVertical="top"
              />
              <TouchableOpacity
                style={styles.voiceButton}
                onPress={() => setIsRecording(!isRecording)}
              >
                {isRecording ? (
                  <MicOff color="#f87171" size={20} />
                ) : (
                  <Mic color="#FFD700" size={20} />
                )}
              </TouchableOpacity>
            </View>

            {/* Mood Selector */}
            <MoodSelector value={mood} onChange={setMood} label="How are you feeling?" />
          </ScrollView>
        </View>
      </Modal>

      {/* Entry Detail Modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => {
              setShowDetailModal(false);
              setSelectedEntry(null);
            }}>
              <X color="#fff" size={24} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Entry Details</Text>
            <View style={styles.detailActions}>
              {selectedEntry && canEditEntry(selectedEntry.timestamp) && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleEditEntry}
                >
                  <Edit3 color="#FFD700" size={20} />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleDeleteEntry}
              >
                <Trash2 color="#f87171" size={20} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.modalContent}>
            {selectedEntry && (
              <View>
                <View style={styles.detailHeader}>
                  <Text style={styles.detailTitle}>
                    {selectedEntry.type === 'reflection' && selectedEntry.meta?.event 
                      ? selectedEntry.meta.event 
                      : selectedEntry.title}
                  </Text>
                  <View style={styles.detailMeta}>
                    <Text style={styles.detailType}>
                      {entryTypes.find(t => t.key === selectedEntry.type)?.icon} {entryTypes.find(t => t.key === selectedEntry.type)?.label}
                    </Text>
                    <Text style={styles.detailDate}>
                      {formatDate(selectedEntry.timestamp)}
                    </Text>
                  </View>
                </View>

                {selectedEntry.type === 'reflection' && selectedEntry.meta ? (
                  <View style={styles.reflectionDetail}>
                    <View style={styles.reflectionSection}>
                      <Text style={styles.reflectionLabel}>What happened?</Text>
                      <Text style={styles.reflectionValue}>{selectedEntry.meta.event}</Text>
                    </View>
                    {selectedEntry.meta.thought && (
                      <View style={styles.reflectionSection}>
                        <Text style={styles.reflectionLabel}>What thought did you have?</Text>
                        <Text style={styles.reflectionValue}>{selectedEntry.meta.thought}</Text>
                      </View>
                    )}
                    <View style={styles.reflectionSection}>
                      <Text style={styles.reflectionLabel}>Positive reframe</Text>
                      <Text style={[styles.reflectionValue, styles.reframeText]}>💡 {selectedEntry.meta.reframe}</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.contentDetail}>
                    <Text style={styles.detailContent}>{selectedEntry.content}</Text>
                  </View>
                )}

                <View style={styles.moodDetail}>
                  <Text style={styles.moodLabel}>Mood: {selectedEntry.mood}/5</Text>
                  <View style={styles.moodIndicator}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <View
                        key={i}
                        style={[
                          styles.moodDot,
                          i <= selectedEntry.mood && styles.activeMoodDot,
                        ]}
                      />
                    ))}
                  </View>
                </View>

                {!canEditEntry(selectedEntry.timestamp) && (
                  <View style={styles.editWarning}>
                    <Text style={styles.editWarningText}>
                      ⏰ This entry is older than 24 hours and can only be deleted, not edited.
                    </Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
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
    paddingTop: 8,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#FFD700',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterContainer: {
    marginBottom: 12,
  },
  filterTab: {
    marginRight: 16,
    alignItems: 'center',
  },
  activeFilterTab: {
    // No background color here, it's on the bar
  },
  filterContent: {
    alignItems: 'center',
    paddingHorizontal: 8,
    justifyContent: 'flex-end',
    height: 170, // Increased to accommodate taller bars (140 + 30)
  },
  filterBar: {
    width: 48, // Broader and 20% bigger (40 * 1.2)
    backgroundColor: '#333',
    borderRadius: 12, // Rounder corners
    marginBottom: 8,
    alignSelf: 'flex-end', // Bottom align within the container
  },
  activeFilterBar: {
    backgroundColor: '#FFD700',
  },

  filterText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  activeFilterText: {
    color: '#FFD700',
  },
  countBadge: {
    backgroundColor: '#333',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  activeCountBadge: {
    backgroundColor: '#FFD700',
  },
  countText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  activeCountText: {
    color: '#1a1a1a',
  },
  entriesList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyText: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
  },
  entryCard: {
    marginBottom: 12,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  entryInfo: {
    flex: 1,
  },
  entryTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  entryDate: {
    color: '#999',
    fontSize: 12,
  },
  entryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeIcon: {
    fontSize: 18,
  },
  typeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  entryContent: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 20,
  },
  reflectionReframe: {
    color: '#8b5cf6',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  reflectionThought: {
    color: '#999',
    fontSize: 12,
    fontStyle: 'italic',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
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
  modalContent: {
    flex: 1,
    padding: 16,
  },
  sectionLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
  },
  typeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  titleInput: {
    backgroundColor: '#2a2a2a',
    color: '#fff',
    fontSize: 16,
    padding: 12,
    borderRadius: 12,
  },
  contentContainer: {
    position: 'relative',
  },
  contentInput: {
    backgroundColor: '#2a2a2a',
    color: '#fff',
    fontSize: 16,
    padding: 12,
    borderRadius: 12,
    height: 120,
    paddingRight: 50,
  },
  voiceButton: {
    position: 'absolute',
    right: 12,
    top: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 8,
  },
  detailHeader: {
    marginBottom: 24,
  },
  detailTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  detailMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailType: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: '600',
  },
  detailDate: {
    color: '#999',
    fontSize: 14,
  },
  contentDetail: {
    marginBottom: 24,
  },
  detailContent: {
    color: '#ccc',
    fontSize: 16,
    lineHeight: 24,
  },
  reflectionDetail: {
    marginBottom: 24,
  },
  reflectionSection: {
    marginBottom: 16,
  },
  reflectionLabel: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  reflectionValue: {
    color: '#ccc',
    fontSize: 16,
    lineHeight: 22,
  },
  reframeText: {
    color: '#8b5cf6',
    fontWeight: '600',
  },
  moodDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  moodLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  moodIndicator: {
    flexDirection: 'row',
    gap: 8,
  },
  moodDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#333',
  },
  activeMoodDot: {
    backgroundColor: '#FFD700',
  },
  editWarning: {
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#f87171',
  },
  editWarningText: {
    color: '#f87171',
    fontSize: 14,
    lineHeight: 20,
  },
});