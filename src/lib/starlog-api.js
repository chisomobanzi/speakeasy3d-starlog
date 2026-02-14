/**
 * Starlog Cross-App API Client
 *
 * Thin wrapper around Supabase RPC calls for external apps
 * (Constellations VR, Missions, phone share).
 *
 * Usage:
 *   import { createClient } from '@supabase/supabase-js';
 *   import { quickAddEntry, getSyncBundle, batchUpsertSrs } from './starlog-api';
 *
 *   const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
 *   await supabase.auth.signInWithPassword({ email, password });
 *
 *   const entry = await quickAddEntry(supabase, { deckId, word: 'hello', translation: 'hola', language: 'es' });
 *
 * For Unity/C# (Constellations): call the same RPC function names directly
 * via the Supabase C# client — this file serves as API documentation.
 */

/**
 * Atomically add an entry to a deck and increment its word count.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {Object} params
 * @param {string} params.deckId - UUID of the target deck
 * @param {string} params.word
 * @param {string} params.translation
 * @param {string} params.language - ISO language code
 * @param {string} [params.phonetic]
 * @param {string} [params.notes]
 * @param {string[]} [params.tags]
 * @param {string} [params.sourceType]
 * @param {string} [params.sourceDetail]
 * @returns {Promise<Object>} Created entry as JSONB
 */
export async function quickAddEntry(supabase, {
  deckId, word, translation, language,
  phonetic, notes, tags, sourceType, sourceDetail,
}) {
  const { data, error } = await supabase.rpc('quick_add_entry', {
    p_deck_id: deckId,
    p_word: word,
    p_translation: translation,
    p_language: language,
    p_phonetic: phonetic ?? null,
    p_notes: notes ?? null,
    p_tags: tags ?? [],
    p_source_type: sourceType ?? null,
    p_source_detail: sourceDetail ?? null,
  });
  if (error) throw error;
  return data;
}

/**
 * Fetch all user decks + entries for sync.
 * Pass `since` (from a previous server_time) for incremental sync.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {Object} [params]
 * @param {string} [params.since] - ISO timestamp from previous server_time (null = full sync)
 * @returns {Promise<{ decks: Object[], entries: Object[], server_time: string }>}
 */
export async function getSyncBundle(supabase, { since } = {}) {
  const { data, error } = await supabase.rpc('get_sync_bundle', {
    p_since: since ?? null,
  });
  if (error) throw error;
  return data;
}

/**
 * Push SRS progress from external review sessions back to Starlog.
 * Conflict resolution: last_reviewed_at wins (only applies if incoming is newer).
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {Object[]} updates - Array of SRS update objects
 * @param {string} updates[].entry_id
 * @param {string} [updates[].srs_state]
 * @param {number} [updates[].mastery_level]
 * @param {number} [updates[].streak]
 * @param {number} [updates[].review_count]
 * @param {string} [updates[].next_review_at]
 * @param {string} [updates[].last_reviewed_at]
 * @returns {Promise<{ updated_ids: string[], updated_count: number }>}
 */
export async function batchUpsertSrs(supabase, updates) {
  const { data, error } = await supabase.rpc('batch_upsert_srs', {
    p_updates: updates,
  });
  if (error) throw error;
  return data;
}
