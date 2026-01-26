import { useState, useCallback, useMemo, useRef } from 'react';
import { useAppStore } from '../stores/appStore';
import { useEntries } from './useEntries';
import { useCommunity } from './useCommunity';
import { searchSource } from '../lib/adapters';
import { SOURCES } from '../lib/dictionarySources';

/**
 * Fan-out search hook that queries all enabled dictionary sources in parallel.
 * Replaces useSearch for LookupTab with external dictionary integration.
 */
export function useDictionarySearch() {
  const enabledSources = useAppStore((s) => s.enabledSources);
  const { searchEntries } = useEntries();
  const { searchCommunity } = useCommunity();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState({});
  const searchIdRef = useRef(0);

  const search = useCallback(async (searchQuery, options = {}) => {
    setQuery(searchQuery);

    if (!searchQuery || searchQuery.length < 2) {
      setResults({});
      setLoading({});
      return;
    }

    const id = ++searchIdRef.current;
    const language = options.language || 'en';
    const deckId = options.deckId || null;

    // Determine which sources to query
    const activeSources = enabledSources.filter(sourceId => {
      const source = SOURCES[sourceId];
      if (!source) return false;
      if (!source.supportedLanguages) return true;
      return source.supportedLanguages.includes(language);
    });

    // Set all active sources to loading
    const loadingState = {};
    activeSources.forEach(sid => { loadingState[sid] = true; });
    setLoading(loadingState);

    // Fan out to all enabled sources
    const promises = activeSources.map(async (sourceId) => {
      let sourceResults = [];

      if (sourceId === 'personal') {
        sourceResults = await searchEntries(searchQuery, { deckId, language: options.language, limit: 25 });
        sourceResults = (sourceResults || []).map(r => ({
          ...r,
          source_type: 'personal',
          _sourceId: 'personal',
          _sourceMeta: SOURCES.personal,
        }));
      } else if (sourceId === 'community') {
        sourceResults = await searchCommunity(searchQuery, { language: options.language, limit: 25 });
        sourceResults = (sourceResults || []).map(r => ({
          ...r,
          source_type: 'community',
          _sourceId: 'community',
          _sourceMeta: SOURCES.community,
        }));
      } else {
        sourceResults = await searchSource(sourceId, searchQuery, language, options);
        sourceResults = (sourceResults || []).map(r => ({
          ...r,
          _sourceId: sourceId,
          _sourceMeta: SOURCES[sourceId],
        }));
      }

      return { sourceId, results: sourceResults };
    });

    const settled = await Promise.allSettled(promises);

    // Only apply if this is still the latest search
    if (id !== searchIdRef.current) return;

    const newResults = {};
    settled.forEach(outcome => {
      if (outcome.status === 'fulfilled') {
        const { sourceId, results: sourceResults } = outcome.value;
        newResults[sourceId] = sourceResults;
      }
    });

    setResults(newResults);
    setLoading({});
  }, [enabledSources, searchEntries, searchCommunity]);

  const clearSearch = useCallback(() => {
    searchIdRef.current++;
    setQuery('');
    setResults({});
    setLoading({});
  }, []);

  const isAnyLoading = useMemo(
    () => Object.values(loading).some(Boolean),
    [loading]
  );

  const totalResults = useMemo(
    () => Object.values(results).reduce((sum, arr) => sum + (arr?.length || 0), 0),
    [results]
  );

  /**
   * Flat sorted array: exact matches first, then personal > community > external
   */
  const combinedResults = useMemo(() => {
    const sourcePriority = { personal: 0, community: 1 };
    const all = Object.entries(results).flatMap(([sourceId, items]) =>
      (items || []).map(item => ({ ...item, _sourceId: sourceId, _sourceMeta: SOURCES[sourceId] }))
    );

    return all.sort((a, b) => {
      const lq = query.toLowerCase();
      const aExact = a.word?.toLowerCase() === lq;
      const bExact = b.word?.toLowerCase() === lq;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;

      const aPri = sourcePriority[a._sourceId] ?? 2;
      const bPri = sourcePriority[b._sourceId] ?? 2;
      if (aPri !== bPri) return aPri - bPri;

      return (a.word || '').localeCompare(b.word || '');
    });
  }, [results, query]);

  /**
   * Grouped by source for sectioned display
   */
  const groupedResults = useMemo(() => {
    const sourceOrder = ['personal', 'community', 'freeDictionary', 'wiktionary'];
    return sourceOrder
      .filter(sid => enabledSources.includes(sid) && results[sid]?.length > 0)
      .map(sid => ({
        source: SOURCES[sid],
        results: results[sid],
      }));
  }, [results, enabledSources]);

  return {
    query,
    results,
    combinedResults,
    groupedResults,
    loading,
    isAnyLoading,
    totalResults,
    search,
    clearSearch,
  };
}
