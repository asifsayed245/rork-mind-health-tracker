import { create } from 'zustand';
import { combine } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

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
          // Get current user session
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.user) {
            throw new Error('User not authenticated');
          }

          // Save to database directly via Supabase
          const { data: savedEntry, error } = await supabase
            .from('journal_entries')
            .insert({
              user_id: session.user.id,
              type: entryData.type,
              title: entryData.title,
              content: entryData.content,
              mood: entryData.mood,
              tags: entryData.tags || [],
              audio_uri: entryData.audioUri || null,
              meta: entryData.meta || null,
            })
            .select()
            .single();

          if (error) {
            console.error('Database error:', error);
            throw new Error(`Failed to save journal entry: ${error.message}`);
          }

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
          // Get current user session
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.user) {
            console.log('No authenticated user, loading from AsyncStorage only');
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
            return;
          }

          // Try to load from database first
          const { data: dbEntries, error } = await supabase
            .from('journal_entries')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false });

          if (error) {
            console.error('Database error:', error);
            throw error;
          }
          
          // Convert database format to local format
          const entries: JournalEntry[] = (dbEntries || []).map(dbEntry => ({
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
        try {
          // Get current user session
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            // Update in database
            const { error } = await supabase
              .from('journal_entries')
              .update({
                type: updates.type,
                title: updates.title,
                content: updates.content,
                mood: updates.mood,
                tags: updates.tags,
                audio_uri: updates.audioUri,
                meta: updates.meta,
              })
              .eq('id', id)
              .eq('user_id', session.user.id);

            if (error) {
              console.error('Database error:', error);
              throw error;
            }
          }

          // Update local state
          const entries = get().entries.map(entry => 
            entry.id === id ? { ...entry, ...updates } : entry
          );
          set({ entries });
          
          // Update AsyncStorage
          await AsyncStorage.setItem('journalEntries', JSON.stringify(entries));
        } catch (error) {
          console.error('Failed to update journal entry:', error);
          throw error;
        }
      },
      
      deleteEntry: async (id: string) => {
        try {
          // Get current user session
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            // Delete from database
            const { error } = await supabase
              .from('journal_entries')
              .delete()
              .eq('id', id)
              .eq('user_id', session.user.id);

            if (error) {
              console.error('Database error:', error);
              throw error;
            }
          }

          // Update local state
          const entries = get().entries.filter(entry => entry.id !== id);
          set({ entries });
          
          // Update AsyncStorage
          await AsyncStorage.setItem('journalEntries', JSON.stringify(entries));
        } catch (error) {
          console.error('Failed to delete journal entry:', error);
          throw error;
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
      
      clearAllEntries: async () => {
        set({ entries: [], isLoading: false });
        try {
          await AsyncStorage.removeItem('journalEntries');
        } catch (error) {
          console.error('Failed to clear journal entries:', error);
        }
      },
    })
  )
);