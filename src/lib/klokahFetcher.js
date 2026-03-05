/**
 * Client-side fetcher for Klokah (Taiwan indigenous language) vocabulary.
 * Calls the fetch-klokah edge function and transforms results into
 * constellation-ready data (same shape as wiktionaryQuickSample).
 */

import { supabase } from './supabase';

// SIL domains (shared with wiktionaryQuickSample)
const SIL_DOMAINS = [
  { id: '1', name: 'Universe & Creation', short: 'Universe', expected: 320, angle: 0, color: '#4ECDC4' },
  { id: '2', name: 'Person', short: 'Person', expected: 280, angle: 40, color: '#FF6B8A' },
  { id: '3', name: 'Language & Thought', short: 'Mind', expected: 250, angle: 80, color: '#CE93D8' },
  { id: '4', name: 'Social Behavior', short: 'Social', expected: 380, angle: 120, color: '#FFB347' },
  { id: '5', name: 'Daily Life', short: 'Daily Life', expected: 300, angle: 160, color: '#7ED87E' },
  { id: '6', name: 'Work & Occupation', short: 'Work', expected: 340, angle: 200, color: '#A5D6A7' },
  { id: '7', name: 'Physical Actions', short: 'Actions', expected: 220, angle: 240, color: '#82B1FF' },
  { id: '8', name: 'States', short: 'States', expected: 200, angle: 280, color: '#FFAB91' },
  { id: '9', name: 'Grammar', short: 'Grammar', expected: 150, angle: 320, color: '#B0BEC5' },
];

const DOMAIN_ICONS = {
  '1': '\u{1F30D}', '2': '\u{1F9D1}', '3': '\u{1F4AD}', '4': '\u{1F91D}',
  '5': '\u{1F3E0}', '6': '\u{1F528}', '7': '\u{1F3C3}', '8': '\u{1F522}', '9': '\u{1F524}',
};

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

  const domains = SIL_DOMAINS.map(d => ({
    id: d.id,
    name: d.name,
    nameLocal: d.short,
    color: d.color,
    icon: DOMAIN_ICONS[d.id] || '\u{2B50}',
    expected: d.expected,
    angle: d.angle,
  }));

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
