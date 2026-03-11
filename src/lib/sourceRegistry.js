/**
 * Pluggable source registry for constellation data.
 *
 * Each source provides vocabulary for one or more languages.
 * The registry selects the best sources for a given language code
 * and merges results into a single constellation dataset.
 *
 * To add a new source (e.g. a Swahili dictionary API):
 *   1. Create a fetcher function: async (langCode, onProgress) => constellationData
 *   2. Call registerSource({ id, name, ..., fetch: yourFetcher })
 *   3. The constellation hook will automatically use it
 */

import { CANONICAL_SIL_DOMAINS } from './sil-domains';

/**
 * @typedef {Object} ConstellationSource
 * @property {string} id - Unique identifier (e.g. 'wiktionary', 'klokah', 'jmdict')
 * @property {string} name - Human-readable name
 * @property {string} description - What this source is / where it comes from
 * @property {string} url - Attribution URL
 * @property {string[]} languages - Array of ISO 639 codes, or ['*'] for universal
 * @property {number} priority - Higher = preferred when multiple sources available (0-100)
 * @property {string} provenance - Provenance tag for constellation display ('dictionary', 'academic', etc.)
 * @property {(langCode: string, onProgress?: Function) => Promise<{language, taxonomy, vocabulary} | null>} fetch
 */

/** @type {ConstellationSource[]} */
const sources = [];

/**
 * Register a new data source.
 * @param {ConstellationSource} source
 */
export function registerSource(source) {
  // Replace existing source with same id
  const idx = sources.findIndex(s => s.id === source.id);
  if (idx >= 0) {
    sources[idx] = source;
  } else {
    sources.push(source);
  }
  // Keep sorted by priority (highest first)
  sources.sort((a, b) => b.priority - a.priority);
}

/**
 * Get all registered sources that support a given language.
 * @param {string} langCode
 * @returns {ConstellationSource[]}
 */
export function getSourcesForLanguage(langCode) {
  return sources.filter(s =>
    s.languages.includes('*') || s.languages.includes(langCode)
  );
}

/**
 * Get all registered sources.
 * @returns {ConstellationSource[]}
 */
export function getAllSources() {
  return [...sources];
}

/**
 * Fetch and merge data from all available sources for a language.
 * Sources are tried in priority order. Results are merged with deduplication.
 *
 * @param {string} langCode
 * @param {(progress: {fetched: number, total: number, words: Array, sourceName: string}) => void} [onProgress]
 * @returns {Promise<{language, taxonomy, vocabulary, sources: string[]} | null>}
 */
export async function fetchFromAllSources(langCode, onProgress) {
  const available = getSourcesForLanguage(langCode);
  if (available.length === 0) return null;

  const allWords = [];
  const seen = new Set();
  const usedSources = [];
  let langInfo = null;

  for (const source of available) {
    try {
      const result = await source.fetch(langCode, (progress) => {
        if (onProgress) {
          onProgress({
            ...progress,
            // Include words from previous sources too
            words: [...allWords, ...progress.words],
            sourceName: source.name,
          });
        }
      });

      if (!result?.vocabulary?.length) continue;

      usedSources.push(source.id);
      if (!langInfo) {
        langInfo = result.language;
      }

      // Merge with deduplication by lowercase word
      for (const word of result.vocabulary) {
        const key = word.word.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);

        allWords.push({
          ...word,
          // Override source with registry provenance if specified
          source: source.provenance || word.source || source.id,
          id: `${source.id}-${langCode}-${allWords.length}`,
        });
      }

      // Final progress report for this source
      if (onProgress) {
        onProgress({
          fetched: allWords.length,
          total: allWords.length,
          words: [...allWords],
          sourceName: source.name,
        });
      }
    } catch (err) {
      console.warn(`Source ${source.id} failed for ${langCode}:`, err);
      // Continue with next source
    }
  }

  if (allWords.length === 0) return null;

  return {
    language: langInfo || { code: langCode, name: langCode },
    taxonomy: {
      name: langInfo?.name || langCode,
      domains: CANONICAL_SIL_DOMAINS,
    },
    vocabulary: allWords,
    sources: usedSources,
  };
}
