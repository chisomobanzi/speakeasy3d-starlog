import { useMemo, useCallback } from 'react';
import { useDictionarySearch } from './useDictionarySearch';
import { mergeSearchResults } from '../lib/mergeSearchIntoConstellation';

/**
 * Wraps useDictionarySearch and merges results with constellation vocabulary.
 * Returns augmented vocabulary (base + external stars) and highlighted IDs.
 *
 * @param {Array} baseVocabulary - Constellation vocabulary items
 * @param {{ domains: Array }} taxonomy - Domain taxonomy from constellation data
 * @param {string} [languageCode] - Language code to scope search results
 */
export function useConstellationSearch(baseVocabulary, taxonomy, languageCode) {
  const {
    query,
    combinedResults,
    isAnyLoading,
    loading,
    search: rawSearch,
    clearSearch,
  } = useDictionarySearch();

  const search = useCallback(
    (searchQuery) => rawSearch(searchQuery, { language: languageCode }),
    [rawSearch, languageCode]
  );

  const { highlightedIds, augmentedVocabulary } = useMemo(
    () => mergeSearchResults(baseVocabulary, combinedResults, taxonomy),
    [baseVocabulary, combinedResults, taxonomy]
  );

  return {
    query,
    highlightedIds,
    augmentedVocabulary,
    searchResults: combinedResults,
    isSearching: isAnyLoading,
    sourceLoading: loading,
    search,
    clearSearch,
  };
}
