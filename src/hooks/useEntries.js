import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { DEMO_AMIS_ENTRIES } from '../data/demoPersonalDeck';

// DEV MODE: Set to true to use mock data
const DEV_MODE = true;

// Mock entries for development
const MOCK_ENTRIES = {
  'demo-amis-personal': DEMO_AMIS_ENTRIES,
  'mock-deck-1': [
    {
      id: 'entry-1',
      deck_id: 'mock-deck-1',
      user_id: 'dev-user-123',
      word: 'saudade',
      phonetic: 'sow-DAH-jee',
      translation: 'a deep longing or nostalgia',
      language: 'pt',
      notes: 'One of the most beautiful untranslatable words. Describes a melancholic longing for something or someone you love.',
      tags: ['emotion', 'untranslatable'],
      source_type: 'conversation',
      contributor_name: 'Maria Silva',
      contributor_location: 'Lisbon, Portugal',
      srs_state: 'learning',
      mastery_level: 0.4,
      streak: 3,
      review_count: 5,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'entry-2',
      deck_id: 'mock-deck-1',
      user_id: 'dev-user-123',
      word: 'obrigado',
      phonetic: 'oh-bree-GAH-doo',
      translation: 'thank you (masculine)',
      language: 'pt',
      notes: 'Use "obrigada" if you are female.',
      tags: ['greeting', 'essential'],
      source_type: 'class',
      srs_state: 'mastered',
      mastery_level: 0.9,
      streak: 12,
      review_count: 15,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'entry-3',
      deck_id: 'mock-deck-1',
      user_id: 'dev-user-123',
      word: 'bom dia',
      phonetic: 'bohm JEE-ah',
      translation: 'good morning',
      language: 'pt',
      tags: ['greeting'],
      source_type: 'class',
      srs_state: 'learning',
      mastery_level: 0.6,
      streak: 5,
      review_count: 8,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  'mock-deck-2': [
    {
      id: 'entry-4',
      deck_id: 'mock-deck-2',
      user_id: 'dev-user-123',
      word: 'Mhoroi',
      phonetic: 'moh-ROY',
      translation: 'Hello (to one person)',
      language: 'sn',
      notes: 'Standard Shona greeting for one person. Use "Mhoroi" for plural.',
      tags: ['greeting', 'essential'],
      source_type: 'conversation',
      contributor_name: 'Tendai Moyo',
      contributor_location: 'Harare, Zimbabwe',
      srs_state: 'new',
      mastery_level: 0.1,
      streak: 1,
      review_count: 2,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'entry-5',
      deck_id: 'mock-deck-2',
      user_id: 'dev-user-123',
      word: 'Maswera sei?',
      phonetic: 'mah-SWEH-rah say',
      translation: 'How was your day? / Good afternoon',
      language: 'sn',
      notes: 'Common afternoon greeting, literally asking about how the day has been.',
      tags: ['greeting'],
      source_type: 'conversation',
      srs_state: 'learning',
      mastery_level: 0.3,
      streak: 2,
      review_count: 4,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
};

// Store for dev mode entries (mutable)
let devEntries = JSON.parse(JSON.stringify(MOCK_ENTRIES));

/**
 * Hook for managing entries within decks
 */
export function useEntries(deckId = null) {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch entries for a specific deck
   */
  const fetchEntries = useCallback(async (targetDeckId = deckId) => {
    if (!user || !targetDeckId) return;

    // In dev mode, return mock entries
    if (DEV_MODE) {
      const mockEntries = devEntries[targetDeckId] || [];
      setEntries(mockEntries);
      return mockEntries;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('entries')
        .select('*')
        .eq('deck_id', targetDeckId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
      return data;
    } catch (err) {
      console.error('Error fetching entries:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user, deckId]);

  /**
   * Search entries across all decks
   */
  const searchEntries = useCallback(async (query, options = {}) => {
    if (!user || !query) return [];

    // In dev mode, search mock entries
    if (DEV_MODE) {
      const allEntries = Object.values(devEntries).flat();
      const lowerQuery = query.toLowerCase();
      return allEntries.filter(entry =>
        entry.word.toLowerCase().includes(lowerQuery) ||
        entry.translation.toLowerCase().includes(lowerQuery)
      );
    }

    try {
      let queryBuilder = supabase
        .from('entries')
        .select('*, decks(name, color)')
        .eq('user_id', user.id)
        .or(`word.ilike.%${query}%,translation.ilike.%${query}%`);

      if (options.deckId) {
        queryBuilder = queryBuilder.eq('deck_id', options.deckId);
      }

      if (options.language) {
        queryBuilder = queryBuilder.eq('language', options.language);
      }

      const { data, error } = await queryBuilder
        .order('created_at', { ascending: false })
        .limit(options.limit || 50);

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error searching entries:', err);
      return [];
    }
  }, [user]);

  /**
   * Get a single entry by ID
   */
  const getEntry = useCallback(async (entryId) => {
    if (!user) return null;

    // In dev mode, find in mock entries
    if (DEV_MODE) {
      const allEntries = Object.values(devEntries).flat();
      return allEntries.find(e => e.id === entryId) || null;
    }

    try {
      const { data, error } = await supabase
        .from('entries')
        .select('*')
        .eq('id', entryId)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error fetching entry:', err);
      return null;
    }
  }, [user]);

  /**
   * Create a new entry
   */
  const createEntry = useCallback(async (entryData) => {
    if (!user) return { error: new Error('Not authenticated') };

    // In dev mode, create mock entry
    if (DEV_MODE) {
      const newEntry = {
        id: `entry-${Date.now()}`,
        user_id: user.id,
        ...entryData,
        srs_state: 'new',
        mastery_level: 0,
        streak: 0,
        review_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (!devEntries[entryData.deck_id]) {
        devEntries[entryData.deck_id] = [];
      }
      devEntries[entryData.deck_id].unshift(newEntry);

      if (entryData.deck_id === deckId) {
        setEntries(prev => [newEntry, ...prev]);
      }

      return { data: newEntry };
    }

    try {
      const { data, error } = await supabase
        .from('entries')
        .insert({
          ...entryData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Update deck word count
      await supabase.rpc('increment_deck_word_count', {
        target_deck_id: entryData.deck_id
      });

      if (entryData.deck_id === deckId) {
        setEntries(prev => [data, ...prev]);
      }

      return { data };
    } catch (err) {
      console.error('Error creating entry:', err);
      return { error: err };
    }
  }, [user, deckId]);

  /**
   * Update an existing entry
   */
  const updateEntry = useCallback(async (entryId, updates) => {
    if (!user) return { error: new Error('Not authenticated') };

    // In dev mode, update mock entry
    if (DEV_MODE) {
      let updatedEntry = null;
      for (const deckKey of Object.keys(devEntries)) {
        const idx = devEntries[deckKey].findIndex(e => e.id === entryId);
        if (idx !== -1) {
          devEntries[deckKey][idx] = {
            ...devEntries[deckKey][idx],
            ...updates,
            updated_at: new Date().toISOString(),
          };
          updatedEntry = devEntries[deckKey][idx];
          break;
        }
      }

      if (updatedEntry) {
        setEntries(prev => prev.map(e => e.id === entryId ? updatedEntry : e));
        return { data: updatedEntry };
      }
      return { error: new Error('Entry not found') };
    }

    try {
      const { data, error } = await supabase
        .from('entries')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', entryId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setEntries(prev => prev.map(e => e.id === entryId ? data : e));
      return { data };
    } catch (err) {
      console.error('Error updating entry:', err);
      return { error: err };
    }
  }, [user]);

  /**
   * Delete an entry
   */
  const deleteEntry = useCallback(async (entryId, targetDeckId = deckId) => {
    if (!user) return { error: new Error('Not authenticated') };

    // In dev mode, delete mock entry
    if (DEV_MODE) {
      for (const deckKey of Object.keys(devEntries)) {
        const idx = devEntries[deckKey].findIndex(e => e.id === entryId);
        if (idx !== -1) {
          devEntries[deckKey].splice(idx, 1);
          break;
        }
      }
      setEntries(prev => prev.filter(e => e.id !== entryId));
      return { success: true };
    }

    try {
      const { error } = await supabase
        .from('entries')
        .delete()
        .eq('id', entryId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update deck word count
      if (targetDeckId) {
        await supabase.rpc('decrement_deck_word_count', {
          target_deck_id: targetDeckId
        });
      }

      setEntries(prev => prev.filter(e => e.id !== entryId));
      return { success: true };
    } catch (err) {
      console.error('Error deleting entry:', err);
      return { error: err };
    }
  }, [user, deckId]);

  /**
   * Add entry to a different deck (copy)
   */
  const copyEntryToDeck = useCallback(async (entryId, targetDeckId) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      // Get the original entry
      const entry = await getEntry(entryId);
      if (!entry) throw new Error('Entry not found');

      // Create copy in target deck
      const { id, created_at, updated_at, deck_id, ...entryData } = entry;

      return await createEntry({
        ...entryData,
        deck_id: targetDeckId,
      });
    } catch (err) {
      console.error('Error copying entry:', err);
      return { error: err };
    }
  }, [user, getEntry, createEntry]);

  /**
   * Update SRS data for an entry after review
   */
  const updateSrsData = useCallback(async (entryId, srsData) => {
    return updateEntry(entryId, srsData);
  }, [updateEntry]);

  return {
    entries,
    loading,
    error,
    fetchEntries,
    searchEntries,
    getEntry,
    createEntry,
    updateEntry,
    deleteEntry,
    copyEntryToDeck,
    updateSrsData,
  };
}
