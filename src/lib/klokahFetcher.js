/**
 * Client-side fetcher for Klokah (Taiwan indigenous language) vocabulary.
 * Calls the fetch-klokah edge function and transforms results into
 * constellation-ready data (same shape as wiktionaryQuickSample).
 */

import { supabase } from './supabase';
import { CANONICAL_SIL_DOMAINS } from './sil-domains';

// Klokah dialect IDs for languages we support
const DIALECT_MAP = {
  pwn: 23, // Paiwan (Northern)
};

/**
 * Fetch vocabulary from Klokah for a given language code.
 * Returns data in the same shape as fetchQuickSample from wiktionaryQuickSample.js.
 *
 * @param {string} languageCode - e.g. 'pwn' for Paiwan
 * @param {(progress: {fetched: number, total: number, words: Array}) => void} [onProgress]
 * @returns {Promise<{language, taxonomy, vocabulary} | null>}
 */
export async function fetchKlokahSample(languageCode, onProgress) {
  const dialect = DIALECT_MAP[languageCode];
  if (dialect === undefined) return null;

  const { data, error } = await supabase.functions.invoke('fetch-klokah', {
    body: { dialect },
  });

  if (error) {
    console.error('Klokah edge function error:', error);
    return null;
  }

  if (!data?.words || data.words.length === 0) return null;

  const vocabulary = data.words.map((w, index) => {
    // Build translation: Chinese + English where available
    const translation = w.english
      ? `${w.chinese} (${w.english})`
      : w.chinese;

    return {
      id: `klokah-${languageCode}-${index}`,
      word: w.word,
      translation,
      domains: [w.sil_domain],
      subDomain: null,
      source: 'klokah',
      connections: [],
    };
  });

  // Report progress (single batch since edge function does all the work)
  if (onProgress) {
    onProgress({
      fetched: vocabulary.length,
      total: vocabulary.length,
      words: vocabulary,
    });
  }

  const domains = CANONICAL_SIL_DOMAINS;

  return {
    language: {
      code: languageCode,
      name: 'Paiwan',
      family: 'Austronesian',
    },
    taxonomy: { name: 'Paiwan', domains },
    vocabulary,
  };
}
