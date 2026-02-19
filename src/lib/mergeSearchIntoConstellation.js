import { classifyByHeuristic } from './classifyDomain';

/**
 * Merge dictionary search results into constellation vocabulary.
 *
 * - Matched results (by word, case-insensitive): existing star gets highlighted,
 *   `_searchEntry` attached for detail modal.
 * - Unmatched results: classified via heuristic, added as external stars with
 *   `_isSearchResult: true`.
 *
 * @param {Array} baseVocabulary - Constellation vocabulary items
 * @param {Array} searchResults - Combined results from useDictionarySearch
 * @param {{ domains: Array }} taxonomy - Domain list from constellation
 * @param {Map} [sourceMap] - Optional Map<id, source> from useSourceRegistry for source resolution
 * @returns {{ highlightedIds: Set<string>, augmentedVocabulary: Array }}
 */
export function mergeSearchResults(baseVocabulary, searchResults, taxonomy, sourceMap) {
  if (!searchResults || searchResults.length === 0) {
    return { highlightedIds: new Set(), augmentedVocabulary: baseVocabulary };
  }

  // Build a lookup map: lowercase word -> vocab item
  const wordMap = new Map();
  for (const item of baseVocabulary) {
    const key = item.word?.toLowerCase();
    if (key) wordMap.set(key, item);
  }

  const highlightedIds = new Set();
  const externalStars = [];
  const seenExternalWords = new Set();

  for (const result of searchResults) {
    const word = result.word?.toLowerCase();
    if (!word) continue;

    // Check for match against existing constellation word
    const existing = wordMap.get(word);
    if (existing) {
      highlightedIds.add(existing.id);
      // Attach search entry data for the detail modal
      if (!existing._searchEntry) {
        existing._searchEntry = result;
      }
      continue;
    }

    // Avoid duplicate external stars for the same word
    if (seenExternalWords.has(word)) continue;
    seenExternalWords.add(word);

    // Classify unmatched result into a domain
    const translation = result.translation || result.word || '';
    const classification = classifyByHeuristic(translation);

    // Resolve constellation source from the source registry
    const sourceId = result._sourceId || result.source_type;
    let constellationSource;
    if (sourceMap && sourceMap.has(sourceId)) {
      // If the search source exists in the registry, use it directly
      constellationSource = sourceId;
    } else {
      // Fallback: map search sources to provenance labels
      constellationSource = 'dictionary';
    }

    externalStars.push({
      id: `_search_${sourceId}_${word}`,
      word: result.word,
      translation: result.translation || '',
      domains: [classification.domain_id],
      source: constellationSource,
      _isSearchResult: true,
      _searchEntry: result,
      _confidence: classification.confidence,
      _sourceId: sourceId,
      connections: [],
    });
  }

  return {
    highlightedIds,
    augmentedVocabulary: [...baseVocabulary, ...externalStars],
  };
}
