import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { DEMO_AMIS_DECK } from '../data/demoPersonalDeck';
import { DEV_MODE } from '../lib/config';

// Mock decks for development
const MOCK_DECKS = [
  DEMO_AMIS_DECK,
  {
    id: 'mock-deck-1',
    user_id: 'dev-user-123',
    name: 'Portuguese Basics',
    description: 'Common Portuguese words and phrases',
    target_language: 'pt',
    color: '#10b981',
    word_count: 24,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'mock-deck-2',
    user_id: 'dev-user-123',
    name: 'Shona Greetings',
    description: 'Traditional Shona greetings from Zimbabwe',
    target_language: 'sn',
    color: '#f97316',
    word_count: 12,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

/**
 * Hook for managing personal decks
 */
export function useDecks() {
  const { user } = useAuth();
  const [decks, setDecks] = useState(DEV_MODE ? MOCK_DECKS : []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch all decks for the current user
   */
  const fetchDecks = useCallback(async () => {
    if (!user) return;

    // In dev mode, just return mock data
    if (DEV_MODE) {
      setDecks(MOCK_DECKS);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('decks')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setDecks(data || []);
    } catch (err) {
      console.error('Error fetching decks:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Get a single deck by ID
   */
  const getDeck = useCallback(async (deckId) => {
    if (!user) return null;

    // In dev mode, find in mock data
    if (DEV_MODE) {
      return decks.find(d => d.id === deckId) || null;
    }

    try {
      const { data, error } = await supabase
        .from('decks')
        .select('*')
        .eq('id', deckId)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error fetching deck:', err);
      return null;
    }
  }, [user, decks]);

  /**
   * Create a new deck
   */
  const createDeck = useCallback(async (deckData) => {
    if (!user) return { error: new Error('Not authenticated') };

    // In dev mode, create mock deck
    if (DEV_MODE) {
      const newDeck = {
        id: `mock-deck-${Date.now()}`,
        user_id: user.id,
        ...deckData,
        word_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setDecks(prev => [newDeck, ...prev]);
      return { data: newDeck };
    }

    try {
      const { data, error } = await supabase
        .from('decks')
        .insert({
          ...deckData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      setDecks(prev => [data, ...prev]);
      return { data };
    } catch (err) {
      console.error('Error creating deck:', err);
      return { error: err };
    }
  }, [user]);

  /**
   * Update an existing deck
   */
  const updateDeck = useCallback(async (deckId, updates) => {
    if (!user) return { error: new Error('Not authenticated') };

    // In dev mode, update mock deck
    if (DEV_MODE) {
      const updatedDeck = {
        ...decks.find(d => d.id === deckId),
        ...updates,
        updated_at: new Date().toISOString(),
      };
      setDecks(prev => prev.map(d => d.id === deckId ? updatedDeck : d));
      return { data: updatedDeck };
    }

    try {
      const { data, error } = await supabase
        .from('decks')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', deckId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setDecks(prev => prev.map(d => d.id === deckId ? data : d));
      return { data };
    } catch (err) {
      console.error('Error updating deck:', err);
      return { error: err };
    }
  }, [user, decks]);

  /**
   * Delete a deck
   */
  const deleteDeck = useCallback(async (deckId) => {
    if (!user) return { error: new Error('Not authenticated') };

    // In dev mode, delete mock deck
    if (DEV_MODE) {
      setDecks(prev => prev.filter(d => d.id !== deckId));
      return { success: true };
    }

    try {
      const { error } = await supabase
        .from('decks')
        .delete()
        .eq('id', deckId)
        .eq('user_id', user.id);

      if (error) throw error;

      setDecks(prev => prev.filter(d => d.id !== deckId));
      return { success: true };
    } catch (err) {
      console.error('Error deleting deck:', err);
      return { error: err };
    }
  }, [user]);

  /**
   * Fork a community deck to personal library
   */
  const forkDeck = useCallback(async (communityDeckId, customName = null) => {
    if (!user) return { error: new Error('Not authenticated') };

    // In dev mode, create mock forked deck
    if (DEV_MODE) {
      const newDeck = {
        id: `mock-deck-${Date.now()}`,
        user_id: user.id,
        name: customName || 'Forked Deck',
        description: 'Forked from community',
        target_language: 'pt',
        color: '#3b82f6',
        word_count: 0,
        forked_from: communityDeckId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setDecks(prev => [newDeck, ...prev]);
      return { data: newDeck };
    }

    try {
      // Get the community deck
      const { data: communityDeck, error: fetchError } = await supabase
        .from('community_decks')
        .select('*')
        .eq('id', communityDeckId)
        .single();

      if (fetchError) throw fetchError;

      // Create personal deck
      const { data: newDeck, error: createError } = await supabase
        .from('decks')
        .insert({
          user_id: user.id,
          name: customName || communityDeck.name,
          description: communityDeck.description,
          target_language: communityDeck.language_code,
          forked_from: communityDeckId,
        })
        .select()
        .single();

      if (createError) throw createError;

      // Get community entries and copy them
      const { data: communityEntries, error: entriesError } = await supabase
        .from('community_entries')
        .select('*')
        .eq('deck_id', communityDeckId)
        .eq('status', 'approved');

      if (entriesError) throw entriesError;

      if (communityEntries && communityEntries.length > 0) {
        const personalEntries = communityEntries.map(entry => ({
          deck_id: newDeck.id,
          user_id: user.id,
          word: entry.word,
          phonetic: entry.phonetic,
          translation: entry.translation,
          language: entry.language_code,
          notes: entry.notes,
          examples: entry.examples,
          tags: entry.tags,
          audio_url: entry.audio_recordings?.[0]?.url,
          community_entry_id: entry.id,
          source_type: 'community',
        }));

        await supabase.from('entries').insert(personalEntries);
      }

      // Update fork count on community deck
      await supabase.rpc('increment_fork_count', { deck_id: communityDeckId });

      setDecks(prev => [newDeck, ...prev]);
      return { data: newDeck };
    } catch (err) {
      console.error('Error forking deck:', err);
      return { error: err };
    }
  }, [user]);

  return {
    decks,
    loading,
    error,
    fetchDecks,
    getDeck,
    createDeck,
    updateDeck,
    deleteDeck,
    forkDeck,
  };
}
