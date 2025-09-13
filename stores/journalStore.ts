import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { trpc } from '@/lib/trpc';

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

// Database types
interface DbJournalEntry {
  id: string;
  user_id: string | null;
  type: 'positive' | 'negative' | 'gratitude' | 'free' | 'reflection';
  title: string;
  content: string;
  mood: number;
  tags: string[];
  audio_uri: string | null;
  created_at: string;
  meta: any | null;
}

export const [JournalProvider, useJournalStore] = createContextHook(() => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Use tRPC hooks
  const entriesQuery = trpc.journal.get.useQuery();
  const addEntryMutation = trpc.journal.add.useMutation();

  const convertDbEntryToLocal = useCallback((dbEntry: DbJournalEntry): JournalEntry => ({
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
  }), []);

  const updateEntriesFromData = useCallback((data: DbJournalEntry[]) => {
    const convertedEntries: JournalEntry[] = data.map(convertDbEntryToLocal);
    const sortedEntries = convertedEntries.sort((a: JournalEntry, b: JournalEntry) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    setEntries(sortedEntries);
    setIsLoading(false);
    
    // Save to AsyncStorage as backup
    AsyncStorage.setItem('journalEntries', JSON.stringify(sortedEntries)).catch(console.error);
  }, [convertDbEntryToLocal]);

  const loadFromAsyncStorage = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem('journalEntries');
      const storedEntries = stored ? JSON.parse(stored) : [];
      const sortedEntries = storedEntries.sort((a: JournalEntry, b: JournalEntry) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setEntries(sortedEntries);
    } catch (asyncError) {
      console.error('Failed to load journal entries from AsyncStorage:', asyncError);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addEntry = useCallback(async (entryData: Omit<JournalEntry, 'id' | 'timestamp' | 'date'>) => {
    try {
      const result = await addEntryMutation.mutateAsync({
        type: entryData.type,
        title: entryData.title,
        content: entryData.content,
        mood: entryData.mood,
        tags: entryData.tags || [],
        audioUri: entryData.audioUri || undefined,
        meta: entryData.meta || null,
      });

      // Convert database format to local format
      const dbEntry = result as DbJournalEntry;
      const newEntry = convertDbEntryToLocal(dbEntry);
      
      const updatedEntries = [newEntry, ...entries];
      const sortedEntries = updatedEntries.sort((a: JournalEntry, b: JournalEntry) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      setEntries(sortedEntries);
      
      // Save to AsyncStorage as backup
      AsyncStorage.setItem('journalEntries', JSON.stringify(sortedEntries)).catch(console.error);
    } catch (error) {
      console.error('Failed to save journal entry:', error);
      throw error;
    }
  }, [addEntryMutation, entries, convertDbEntryToLocal]);

  const loadEntries = useCallback(async () => {
    if (entriesQuery.data) {
      updateEntriesFromData(entriesQuery.data as DbJournalEntry[]);
    } else if (entriesQuery.error) {
      console.error('Failed to load journal entries from database, trying AsyncStorage:', entriesQuery.error);
      await loadFromAsyncStorage();
    } else if (!entriesQuery.isLoading) {
      // Trigger refetch if not loading and no data
      entriesQuery.refetch();
    }
  }, [entriesQuery, updateEntriesFromData, loadFromAsyncStorage]);
      
  const getEntriesByType = useCallback((type: string) => {
    if (type === 'all') return entries;
    return entries.filter(entry => entry.type === type);
  }, [entries]);
  
  const updateEntry = useCallback(async (id: string, updates: Partial<Omit<JournalEntry, 'id' | 'timestamp' | 'date'>>) => {
    try {
      // Update local state optimistically
      const updatedEntries = entries.map(entry => 
        entry.id === id ? { ...entry, ...updates } : entry
      );
      setEntries(updatedEntries);
      
      // Update AsyncStorage
      await AsyncStorage.setItem('journalEntries', JSON.stringify(updatedEntries));
    } catch (error) {
      console.error('Failed to update journal entry:', error);
      throw error;
    }
  }, [entries]);
  
  const deleteEntry = useCallback(async (id: string) => {
    try {
      // Update local state optimistically
      const updatedEntries = entries.filter(entry => entry.id !== id);
      setEntries(updatedEntries);
      
      // Update AsyncStorage
      await AsyncStorage.setItem('journalEntries', JSON.stringify(updatedEntries));
    } catch (error) {
      console.error('Failed to delete journal entry:', error);
      throw error;
    }
  }, [entries]);
  
  const getEntryById = useCallback((id: string) => {
    return entries.find(entry => entry.id === id);
  }, [entries]);
  
  const canEditEntry = useCallback((timestamp: string) => {
    const entryTime = new Date(timestamp).getTime();
    const now = new Date().getTime();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    return (now - entryTime) < twentyFourHours;
  }, []);
  
  const getEntryCounts = useCallback(() => {
    return {
      all: entries.length,
      positive: entries.filter(e => e.type === 'positive').length,
      negative: entries.filter(e => e.type === 'negative').length,
      gratitude: entries.filter(e => e.type === 'gratitude').length,
      reflection: entries.filter(e => e.type === 'reflection').length,
    };
  }, [entries]);
  
  const clearAllEntries = useCallback(async () => {
    setEntries([]);
    setIsLoading(false);
    try {
      await AsyncStorage.removeItem('journalEntries');
    } catch (error) {
      console.error('Failed to clear journal entries:', error);
    }
  }, []);

  return useMemo(() => ({
    entries,
    isLoading,
    addEntry,
    loadEntries,
    getEntriesByType,
    updateEntry,
    deleteEntry,
    getEntryById,
    canEditEntry,
    getEntryCounts,
    clearAllEntries,
  }), [
    entries,
    isLoading,
    addEntry,
    loadEntries,
    getEntriesByType,
    updateEntry,
    deleteEntry,
    getEntryById,
    canEditEntry,
    getEntryCounts,
    clearAllEntries,
  ]);
});