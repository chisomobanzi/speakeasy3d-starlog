import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

/**
 * Hook for community decks and entries
 */
export function useCommunity() {
  const { user, isVerified } = useAuth();
  const [communityDecks, setCommunityDecks] = useState([]);
  const [pendingReviews, setPendingReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch all published community decks
   */
  const fetchCommunityDecks = useCallback(async (options = {}) => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('community_decks')
        .select('*, profiles!community_decks_created_by_fkey(username, avatar_url)')
        .eq('is_published', true);

      if (options.language) {
        query = query.eq('language_code', options.language);
      }

      if (options.featured) {
        query = query.eq('is_featured', true);
      }

      const orderBy = options.orderBy || 'learner_count';
      const { data, error } = await query
        .order(orderBy, { ascending: false })
        .limit(options.limit || 50);

      if (error) throw error;
      setCommunityDecks(data || []);
      return data;
    } catch (err) {
      console.error('Error fetching community decks:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get a single community deck with entries
   */
  const getCommunityDeck = useCallback(async (deckId) => {
    try {
      const { data: deck, error: deckError } = await supabase
        .from('community_decks')
        .select('*, profiles!community_decks_created_by_fkey(username, avatar_url)')
        .eq('id', deckId)
        .single();

      if (deckError) throw deckError;

      const { data: entries, error: entriesError } = await supabase
        .from('community_entries')
        .select('*')
        .eq('deck_id', deckId)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (entriesError) throw entriesError;

      return { ...deck, entries: entries || [] };
    } catch (err) {
      console.error('Error fetching community deck:', err);
      return null;
    }
  }, []);

  /**
   * Submit a new entry for community review
   */
  const submitEntry = useCallback(async (deckId, entryData) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const { data, error } = await supabase
        .from('community_entries')
        .insert({
          deck_id: deckId,
          submitted_by: user.id,
          status: 'pending',
          ...entryData,
        })
        .select()
        .single();

      if (error) throw error;
      return { data };
    } catch (err) {
      console.error('Error submitting entry:', err);
      return { error: err };
    }
  }, [user]);

  /**
   * Fetch entries pending review (for verified users)
   */
  const fetchPendingReviews = useCallback(async (languageCode = null) => {
    if (!user || !isVerified) return [];

    setLoading(true);

    try {
      let query = supabase
        .from('community_entries')
        .select('*, community_decks(name), profiles!community_entries_submitted_by_fkey(username)')
        .eq('status', 'pending')
        .not('submitted_by', 'eq', user.id); // Can't review own submissions

      if (languageCode) {
        query = query.eq('language_code', languageCode);
      }

      const { data, error } = await query
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) throw error;
      setPendingReviews(data || []);
      return data;
    } catch (err) {
      console.error('Error fetching pending reviews:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user, isVerified]);

  /**
   * Submit a review for an entry
   */
  const submitReview = useCallback(async (entryId, decision, comment = null, suggestedEdits = null) => {
    if (!user || !isVerified) {
      return { error: new Error('Must be verified to review') };
    }

    try {
      // Create the review
      const { error: reviewError } = await supabase
        .from('reviews')
        .insert({
          entry_id: entryId,
          reviewer_id: user.id,
          decision,
          comment,
          suggested_edits: suggestedEdits,
        });

      if (reviewError) throw reviewError;

      // Update entry verification count
      const { data: entry } = await supabase
        .from('community_entries')
        .select('verification_count, verifications_needed, verified_by')
        .eq('id', entryId)
        .single();

      if (entry && decision === 'approve') {
        const newCount = (entry.verification_count || 0) + 1;
        const newVerifiedBy = [...(entry.verified_by || []), user.id];

        const updates = {
          verification_count: newCount,
          verified_by: newVerifiedBy,
        };

        // Auto-approve if threshold reached
        if (newCount >= entry.verifications_needed) {
          updates.status = 'approved';
        }

        await supabase
          .from('community_entries')
          .update(updates)
          .eq('id', entryId);
      } else if (decision === 'reject') {
        await supabase
          .from('community_entries')
          .update({ status: 'rejected' })
          .eq('id', entryId);
      }

      // Remove from local pending list
      setPendingReviews(prev => prev.filter(e => e.id !== entryId));

      // Update user's review count
      await supabase.rpc('increment_review_count', { user_id: user.id });

      return { success: true };
    } catch (err) {
      console.error('Error submitting review:', err);
      return { error: err };
    }
  }, [user, isVerified]);

  /**
   * Search community entries
   */
  const searchCommunity = useCallback(async (query, options = {}) => {
    try {
      let queryBuilder = supabase
        .from('community_entries')
        .select('*, community_decks(name, language_code)')
        .eq('status', 'approved')
        .or(`word.ilike.%${query}%,translation.ilike.%${query}%`);

      if (options.language) {
        queryBuilder = queryBuilder.eq('language_code', options.language);
      }

      const { data, error } = await queryBuilder
        .order('verification_count', { ascending: false })
        .limit(options.limit || 50);

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error searching community:', err);
      return [];
    }
  }, []);

  /**
   * Get language communities and their stats
   */
  const getLanguageCommunities = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('language_communities')
        .select('*')
        .order('total_entries', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching language communities:', err);
      return [];
    }
  }, []);

  return {
    communityDecks,
    pendingReviews,
    loading,
    error,
    fetchCommunityDecks,
    getCommunityDeck,
    submitEntry,
    fetchPendingReviews,
    submitReview,
    searchCommunity,
    getLanguageCommunities,
  };
}
