import { create } from 'zustand';
import { combine } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { trpcClient } from '@/lib/trpc';

export interface JournalEntry {
  id: string;
  type: 'positive' | 'negative' | 'gratitude' | 'free' | 'reflection';
  title: string;
  content: string;
  mood: number;
  tags: string[];
  audioUri?: string;
  timestamp: string;
  date: string;
  meta?: {
    event?: string;
    thought?: string;
    reframe?: string;
  };
}



export const useJournalStore = create(
  combine(
    {
      entries: [] as JournalEntry[],
      isLoading: true,
    },
    (set, get) => ({
      addEntry: async (entryData: Omit<JournalEntry, 'id' | 'timestamp' | 'date'>) => {
        try {
          // Save to database via tRPC
          const savedEntry = await trpcClient.journal.add.mutate({
            type: entryData.type,
            title: entryData.title,
            content: entryData.content,
            mood: entryData.mood,
            tags: entryData.tags,
            audioUri: entryData.audioUri,
            meta: entryData.meta,
          });

          // Convert database format to local format
          const newEntry: JournalEntry = {
            id: savedEntry.id,
            type: savedEntry.type,
            title: savedEntry.title,
            content: savedEntry.content,
            mood: savedEntry.mood,
            tags: savedEntry.tags,
            audioUri: savedEntry.audio_uri || undefined,
            timestamp: savedEntry.created_at,
            date: savedEntry.created_at.split('T')[0],
            meta: savedEntry.meta || undefined,
          };
          
          const entries = [newEntry, ...get().entries];
          set({ entries });
          
          // Also save to AsyncStorage as backup
          await AsyncStorage.setItem('journalEntries', JSON.stringify(entries));
        } catch (error) {
          console.error('Failed to save journal entry:', error);
          throw error;
        }
      },
      
      loadEntries: async () => {
        try {
          // Try to load from database first
          const dbEntries = await trpcClient.journal.get.query();
          
          // Convert database format to local format
          const entries: JournalEntry[] = dbEntries.map(dbEntry => ({
            id: dbEntry.id,
            type: dbEntry.type,
            title: dbEntry.title,
            content: dbEntry.content,
            mood: dbEntry.mood,
            tags: dbEntry.tags,
            audioUri: dbEntry.audio_uri || undefined,
            timestamp: dbEntry.created_at,
            date: dbEntry.created_at.split('T')[0],
            meta: dbEntry.meta || undefined,
          }));
          
          set({ entries: entries.sort((a: JournalEntry, b: JournalEntry) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          ), isLoading: false });
          
          // Save to AsyncStorage as backup
          await AsyncStorage.setItem('journalEntries', JSON.stringify(entries));
        } catch (error) {
          console.error('Failed to load journal entries from database, trying AsyncStorage:', error);
          
          // Fallback to AsyncStorage
          try {
            const stored = await AsyncStorage.getItem('journalEntries');
            const entries = stored ? JSON.parse(stored) : [];
            set({ entries: entries.sort((a: JournalEntry, b: JournalEntry) => 
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            ), isLoading: false });
          } catch (asyncError) {
            console.error('Failed to load journal entries from AsyncStorage:', asyncError);
            set({ isLoading: false });
          }
        }
      },
      
      getEntriesByType: (type: string) => {
        if (type === 'all') return get().entries;
        return get().entries.filter(entry => entry.type === type);
      },
      
      updateEntry: async (id: string, updates: Partial<Omit<JournalEntry, 'id' | 'timestamp' | 'date'>>) => {
        const entries = get().entries.map(entry => 
          entry.id === id ? { ...entry, ...updates } : entry
        );
        set({ entries });
        
        try {
          await AsyncStorage.setItem('journalEntries', JSON.stringify(entries));
        } catch (error) {
          console.error('Failed to update journal entry:', error);
        }
      },
      
      deleteEntry: async (id: string) => {
        const entries = get().entries.filter(entry => entry.id !== id);
        set({ entries });
        
        try {
          await AsyncStorage.setItem('journalEntries', JSON.stringify(entries));
        } catch (error) {
          console.error('Failed to delete journal entry:', error);
        }
      },
      
      getEntryById: (id: string) => {
        return get().entries.find(entry => entry.id === id);
      },
      
      canEditEntry: (timestamp: string) => {
        const entryTime = new Date(timestamp).getTime();
        const now = new Date().getTime();
        const twentyFourHours = 24 * 60 * 60 * 1000;
        return (now - entryTime) < twentyFourHours;
      },
      
      getEntryCounts: () => {
        const entries = get().entries;
        return {
          all: entries.length,
          positive: entries.filter(e => e.type === 'positive').length,
          negative: entries.filter(e => e.type === 'negative').length,
          gratitude: entries.filter(e => e.type === 'gratitude').length,
          reflection: entries.filter(e => e.type === 'reflection').length,
        };
      },
    })
  )
);