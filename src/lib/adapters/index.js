/**
 * Adapter registry
 * Maps external source IDs to their search functions.
 */

import { searchFreeDictionary } from './freeDictionary';
import { searchWiktionary } from './wiktionary';

const adapters = {
  freeDictionary: searchFreeDictionary,
  wiktionary: searchWiktionary,
};

/**
 * Search a specific external source with error handling.
 * Always returns an array, never throws.
 */
export async function searchSource(sourceId, query, language, options = {}) {
  const adapter = adapters[sourceId];
  if (!adapter) return [];

  try {
    return await adapter(query, language, options);
  } catch {
    console.error(`Adapter error for ${sourceId}:`, sourceId);
    return [];
  }
}
