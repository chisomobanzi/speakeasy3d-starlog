/**
 * Starlog Cross-App API Client
 *
 * Thin wrapper around Supabase RPC calls for external apps
 * (Constellations VR, Missions, phone share).
 *
 * Usage:
 *   import { createClient } from '@supabase/supabase-js';
 *   import { quickAddEntry, getSyncBundle, batchUpsertSrs, lookupWord } from './starlog-api';
 *
 *   const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
 *   await supabase.auth.signInWithPassword({ email, password });
 *
 *   const entry = await quickAddEntry(supabase, { deckId, word: 'hello', translation: 'hola', language: 'es' });
 *   const results = await lookupWord(supabase, 'saudade', { language: 'pt' });
 *
 * For Unity/C# (Constellations): call the same RPC function names directly
 * via the Supabase C# client — this file serves as API documentation.
 */

import { searchFreeDictionary } from './adapters/freeDictionary';
import { searchWiktionary } from './adapters/wiktionary';
export { fetchFullEntry } from './adapters/fetchFullEntry';

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

/**
 * Search personal + community dictionary entries via the search_dictionary RPC.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {Object} params
 * @param {string} params.query - Search term (min 2 chars)
 * @param {string} [params.language] - ISO language code filter
 * @param {string} [params.deckId] - Limit personal results to a specific deck
 * @param {string[]} [params.sources] - Subset of ['personal','community'] (default both)
 * @param {number} [params.limit] - Max results per source (default 25)
 * @returns {Promise<{ personal: Object[], community: Object[] }>}
 */
export async function searchDictionary(supabase, { query, language, deckId, sources, limit }) {
  const { data, error } = await supabase.rpc('search_dictionary', {
    p_query: query,
    p_language: language ?? null,
    p_deck_id: deckId ?? null,
    p_sources: sources ?? ['personal', 'community'],
    p_limit: limit ?? 25,
  });
  if (error) throw error;
  return data;
}

/**
 * Generate a 6-digit VR pairing code for the authenticated user.
 * Prior unclaimed codes are automatically invalidated.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @returns {Promise<{ code: string, expires_at: string }>}
 */
export async function generatePairingCode(supabase) {
  const { data, error } = await supabase.rpc('generate_pairing_code');
  if (error) throw error;
  return data;
}

/**
 * Claim a VR pairing code and receive a session (called from VR app, no auth).
 * Uses direct fetch since the caller has no Supabase session yet.
 *
 * @param {string} supabaseUrl - Project URL (e.g. https://xxx.supabase.co)
 * @param {string} anonKey - Supabase anon/public key
 * @param {string} code - 6-digit pairing code
 * @returns {Promise<{ access_token: string, refresh_token: string, expires_in: number, user: { id: string, email: string } }>}
 */
export async function claimPairingCode(supabaseUrl, anonKey, code) {
  const res = await fetch(`${supabaseUrl}/functions/v1/claim-pairing-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${anonKey}`,
      'apikey': anonKey,
    },
    body: JSON.stringify({ code }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to claim pairing code');
  return data;
}

/**
 * Unified fan-out dictionary lookup across all 4 sources:
 * personal entries, community entries, Free Dictionary API, and Wiktionary API.
 *
 * Calls the Supabase RPC for personal/community and the external adapters
 * in parallel. External adapter failures are silently caught (fault isolation).
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} query - The word or phrase to look up
 * @param {Object} [options]
 * @param {string} [options.language] - ISO language code
 * @param {string[]} [options.sources] - Subset of ['personal','community','freeDictionary','wiktionary']
 * @param {string} [options.deckId] - Limit personal results to a specific deck
 * @param {number} [options.limit] - Max results per DB source (default 25)
 * @returns {Promise<{ personal: Object[], community: Object[], freeDictionary: Object[], wiktionary: Object[] }>}
 */
export async function lookupWord(supabase, query, { language, sources, deckId, limit } = {}) {
  const allSources = sources ?? ['personal', 'community', 'freeDictionary', 'wiktionary'];
  const dbSources = allSources.filter(s => s === 'personal' || s === 'community');
  const wantFreeDict = allSources.includes('freeDictionary');
  const wantWiktionary = allSources.includes('wiktionary');

  const promises = [];

  // DB search (personal + community via single RPC)
  if (dbSources.length > 0) {
    promises.push(
      searchDictionary(supabase, { query, language, deckId, sources: dbSources, limit })
        .catch(() => ({ personal: [], community: [] }))
    );
  } else {
    promises.push(Promise.resolve({ personal: [], community: [] }));
  }

  // External adapters
  promises.push(
    wantFreeDict
      ? searchFreeDictionary(query, language).catch(() => [])
      : Promise.resolve([])
  );
  promises.push(
    wantWiktionary
      ? searchWiktionary(query, language).catch(() => [])
      : Promise.resolve([])
  );

  const [dbResults, freeDictResults, wiktionaryResults] = await Promise.all(promises);

  return {
    personal: dbResults.personal ?? [],
    community: dbResults.community ?? [],
    freeDictionary: freeDictResults,
    wiktionary: wiktionaryResults,
  };
}
