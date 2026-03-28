import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X } from 'lucide-react-native';
import { CheckIn } from '@/stores/checkInStore';
import { useJournalStore } from '@/stores/journalStore';
import MoodSelector from './MoodSelector';

interface QuickCheckInModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: Omit<CheckIn, 'id' | 'timestampISO'>) => void;
  preselectedSlot?: CheckIn['slot'];
}

const SLOT_LABELS = {
  morning: 'Morning',
  afternoon: 'Afternoon', 
  evening: 'Evening',
  night: 'Night',
};

const SLOT_MESSAGES = {
  morning: 'Good start 🌅 Your morning check-in is complete.',
  afternoon: 'Midday logged ⚡ Keep going.',
  evening: 'Evening reflection saved 🌙.',
  night: 'Day closed 🌌 Nice finish.',
};

export default function QuickCheckInModal({ 
  visible, 
  onClose, 
  onSave, 
  preselectedSlot 
}: QuickCheckInModalProps) {
  const { addEntry } = useJournalStore();
  const [selectedSlot, setSelectedSlot] = useState<CheckIn['slot']>(preselectedSlot || 'morning');
  const [mood, setMood] = useState<number>(3);
  const [stress, setStress] = useState<number>(3);
  const [energy, setEnergy] = useState<number>(3);
  const [note, setNote] = useState<string>('');

  // Update selected slot when preselectedSlot changes
  useEffect(() => {
    if (preselectedSlot) {
      setSelectedSlot(preselectedSlot);
    }
  }, [preselectedSlot]);

  const handleSave = async () => {
    const checkInData: Omit<CheckIn, 'id' | 'timestampISO'> = {
      slot: selectedSlot,
      mood,
      stress,
      energy,
      note: note.trim() || undefined,
    };

    // Save the check-in
    onSave(checkInData);
    
    // If there's a note, save it to the journal as well
    if (note.trim()) {
      await addEntry({
        type: 'free',
        title: `${SLOT_LABELS[selectedSlot]} Check-in Note`,
        content: note.trim(),
        mood,
        tags: [selectedSlot, 'check-in'],
      });
    }
    
    // Reset form
    setMood(3);
    setStress(3);
    setEnergy(3);
    setNote('');
    
    // Close modal first
    onClose();
    
    // Show success message after a brief delay
    setTimeout(() => {
      Alert.alert(
        'Check-in Saved ✔️',
        SLOT_MESSAGES[selectedSlot]
      );
    }, 100);
  };

  const handleClose = () => {
    setMood(3);
    setStress(3);
    setEnergy(3);
    setNote('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Quick Check-in</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X color="#fff" size={24} />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Time Slot Selector */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Time Slot</Text>
            <View style={styles.slotSelector}>
              {Object.entries(SLOT_LABELS).map(([key, label]) => {
                const isSelected = selectedSlot === key;
                const isDisabled = preselectedSlot && preselectedSlot !== key;
                
                return (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.slotButton,
                      isSelected && styles.selectedSlotButton,
                      isDisabled && styles.disabledSlotButton,
                    ]}
                    onPress={() => !isDisabled && setSelectedSlot(key as CheckIn['slot'])}
                    disabled={isDisabled}
                  >
                    <Text
                      style={[
                        styles.slotButtonText,
                        isSelected && styles.selectedSlotButtonText,
                        isDisabled && styles.disabledSlotButtonText,
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Mood, Stress, Energy */}
          <View style={styles.section}>
            <MoodSelector value={mood} onChange={setMood} label="Mood" />
          </View>

          <View style={styles.section}>
            <MoodSelector value={stress} onChange={setStress} label="Stress" />
          </View>

          <View style={styles.section}>
            <MoodSelector value={energy} onChange={setEnergy} label="Energy" />
          </View>

          {/* Optional Note */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Note (Optional)</Text>
            <TextInput
              style={styles.noteInput}
              value={note}
              onChangeText={setNote}
              placeholder="How are you feeling?"
              placeholderTextColor="#666"
              multiline
              maxLength={200}
              scrollEnabled
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save Check-in</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
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
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  slotSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  slotButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#2a2a2a',
    borderWidth: 2,
    borderColor: '#333',
    alignItems: 'center',
  },
  selectedSlotButton: {
    backgroundColor: '#FFD700',
    borderColor: '#FFD700',
  },
  slotButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  selectedSlotButtonText: {
    color: '#1a1a1a',
  },
  disabledSlotButton: {
    backgroundColor: '#1a1a1a',
    borderColor: '#333',
    opacity: 0.5,
  },
  disabledSlotButtonText: {
    color: '#666',
  },
  noteInput: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    minHeight: 100,
    maxHeight: 150,
    textAlignVertical: 'top',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    paddingBottom: 32,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#333',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#FFD700',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#1a1a1a',
    fontSize: 16,
    fontWeight: '600',
  },
});