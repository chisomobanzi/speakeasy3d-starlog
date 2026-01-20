import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

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
