/**
 * Adapter registry
 * Maps source adapter_id values to their search functions.
 * Supports both built-in and dynamically registered adapters.
 */

import { searchFreeDictionary } from './freeDictionary';
import { searchWiktionary } from './wiktionary';

const builtinAdapters = {
  freeDictionary: searchFreeDictionary,
  wiktionary: searchWiktionary,
};

const dynamicAdapters = {};

/**
 * Register a dynamic adapter at runtime (e.g. user-added API sources).
 * @param {string} id - Adapter ID matching source_registry.adapter_id
 * @param {Function} fn - async (query, language, options) => results[]
 */
export function registerAdapter(id, fn) {
  dynamicAdapters[id] = fn;
}

/**
 * Unregister a dynamic adapter.
 */
export function unregisterAdapter(id) {
  delete dynamicAdapters[id];
}

/**
 * Search a specific external source with error handling.
 * Checks both built-in and dynamic adapter registries.
 * Always returns an array, never throws.
 *
 * @param {string} adapterId - The adapter_id (not the source id)
 * @param {string} query
 * @param {string} language
 * @param {object} options
 */
export async function searchSource(adapterId, query, language, options = {}) {
  const adapter = builtinAdapters[adapterId] || dynamicAdapters[adapterId];
  if (!adapter) return [];

  try {
    return await adapter(query, language, options);
  } catch (error) {
    console.error(`Adapter error for ${adapterId}:`, error);
    return [];
  }
}
