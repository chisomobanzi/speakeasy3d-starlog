import { useState, useEffect } from 'react';
import { Search, Filter, X } from 'lucide-react';
import SearchBar from './SearchBar';
import EntryCard from './EntryCard';
import { useEntries } from '../../hooks/useEntries';
import { useDecks } from '../../hooks/useDecks';
import { SegmentedControl } from '../ui/Tabs';
import Button from '../ui/Button';
import { EntryCardSkeleton } from '../ui/LoadingSpinner';

export default function LookupTab() {
  const { searchEntries } = useEntries();
  const { decks, fetchDecks } = useDecks();

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchScope, setSearchScope] = useState('all');
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);

  useEffect(() => {
    fetchDecks();
    // Load recent searches from localStorage
    const stored = localStorage.getItem('recentSearches');
    if (stored) {
      setRecentSearches(JSON.parse(stored));
    }
  }, [fetchDecks]);

  const handleSearch = async (query) => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const searchResults = await searchEntries(query, {
        deckId: selectedDeck,
      });
      setResults(searchResults);

      // Save to recent searches
      const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem('recentSearches', JSON.stringify(updated));
    } finally {
      setLoading(false);
    }
  };

  const handleSelectResult = (entry) => {
    // Could open entry detail modal here
    console.log('Selected:', entry);
  };

  const clearFilters = () => {
    setSelectedDeck(null);
    setSearchScope('all');
  };

  return (
    <div className="space-y-6">
      {/* Search input */}
      <div className="space-y-3">
        <SearchBar
          placeholder="Search your dictionary..."
          onSelect={handleSelectResult}
          autoFocus
        />

        {/* Filters toggle */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="text-slate-400"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
            {(selectedDeck || searchScope !== 'all') && (
              <span className="ml-2 w-2 h-2 bg-starlog-500 rounded-full" />
            )}
          </Button>

          {(selectedDeck || searchScope !== 'all') && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </div>

        {/* Filter options */}
        {showFilters && (
          <div className="p-4 bg-slate-900/50 rounded-xl space-y-4">
            <div>
              <label className="text-sm text-slate-400 mb-2 block">Search in</label>
              <SegmentedControl
                options={[
                  { value: 'all', label: 'All' },
                  { value: 'personal', label: 'Personal' },
                  { value: 'community', label: 'Community' },
                ]}
                value={searchScope}
                onChange={setSearchScope}
              />
            </div>

            {decks.length > 0 && (
              <div>
                <label className="text-sm text-slate-400 mb-2 block">Filter by deck</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedDeck(null)}
                    className={`
                      px-3 py-1.5 rounded-lg text-sm transition-colors
                      ${!selectedDeck
                        ? 'bg-starlog-500/20 text-starlog-400 border border-starlog-500/30'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                      }
                    `}
                  >
                    All decks
                  </button>
                  {decks.map(deck => (
                    <button
                      key={deck.id}
                      onClick={() => setSelectedDeck(deck.id)}
                      className={`
                        px-3 py-1.5 rounded-lg text-sm transition-colors
                        ${selectedDeck === deck.id
                          ? 'bg-starlog-500/20 text-starlog-400 border border-starlog-500/30'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                        }
                      `}
                    >
                      {deck.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Recent searches */}
      {results.length === 0 && !loading && recentSearches.length > 0 && (
        <div>
          <h3 className="text-sm text-slate-500 mb-3">Recent searches</h3>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((search, i) => (
              <button
                key={i}
                onClick={() => handleSearch(search)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-300 transition-colors"
              >
                {search}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="space-y-3">
          <EntryCardSkeleton />
          <EntryCardSkeleton />
          <EntryCardSkeleton />
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-3">
          <p className="text-sm text-slate-500">{results.length} results</p>
          {results.map(entry => (
            <EntryCard
              key={entry.id}
              entry={entry}
              showDeck
              onEdit={handleSelectResult}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
