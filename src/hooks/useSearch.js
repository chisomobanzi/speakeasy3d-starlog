import { useState, useCallback, useMemo } from 'react';
import { useEntries } from './useEntries';
import { useCommunity } from './useCommunity';
import debounce from '../lib/debounce';

/**
 * Simple debounce utility
 */
function createDebounce(fn, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Hook for unified search across personal and community entries
 */
export function useSearch() {
  const { searchEntries } = useEntries();
  const { searchCommunity } = useCommunity();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState({
    personal: [],
    community: [],
  });
  const [loading, setLoading] = useState(false);
  const [searchScope, setSearchScope] = useState('all'); // 'all', 'personal', 'community'

  /**
   * Perform search
   */
  const performSearch = useCallback(async (searchQuery, options = {}) => {
    if (!searchQuery || searchQuery.length < 2) {
      setResults({ personal: [], community: [] });
      return;
    }

    setLoading(true);

    try {
      const scope = options.scope || searchScope;
      const searchOptions = {
        language: options.language,
        limit: options.limit || 25,
      };

      const [personalResults, communityResults] = await Promise.all([
        scope !== 'community' ? searchEntries(searchQuery, searchOptions) : [],
        scope !== 'personal' ? searchCommunity(searchQuery, searchOptions) : [],
      ]);

      setResults({
        personal: personalResults || [],
        community: communityResults || [],
      });
    } catch (err) {
      console.error('Search error:', err);
      setResults({ personal: [], community: [] });
    } finally {
      setLoading(false);
    }
  }, [searchEntries, searchCommunity, searchScope]);

  /**
   * Debounced search for live typing
   */
  const debouncedSearch = useMemo(
    () => createDebounce((q, opts) => performSearch(q, opts), 300),
    [performSearch]
  );

  /**
   * Handle query change with debounced search
   */
  const handleQueryChange = useCallback((newQuery, options = {}) => {
    setQuery(newQuery);
    debouncedSearch(newQuery, options);
  }, [debouncedSearch]);

  /**
   * Clear search
   */
  const clearSearch = useCallback(() => {
    setQuery('');
    setResults({ personal: [], community: [] });
  }, []);

  /**
   * Get combined results sorted by relevance
   */
  const combinedResults = useMemo(() => {
    const all = [
      ...results.personal.map(r => ({ ...r, source: 'personal' })),
      ...results.community.map(r => ({ ...r, source: 'community' })),
    ];

    // Sort by exact match first, then alphabetically
    return all.sort((a, b) => {
      const aExact = a.word.toLowerCase() === query.toLowerCase();
      const bExact = b.word.toLowerCase() === query.toLowerCase();
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      return a.word.localeCompare(b.word);
    });
  }, [results, query]);

  return {
    query,
    setQuery: handleQueryChange,
    results,
    combinedResults,
    loading,
    searchScope,
    setSearchScope,
    search: performSearch,
    clearSearch,
    hasResults: results.personal.length > 0 || results.community.length > 0,
  };
}
