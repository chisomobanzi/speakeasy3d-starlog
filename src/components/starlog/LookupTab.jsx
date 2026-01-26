import { useState, useCallback, useMemo, useRef } from 'react';
import { Search, Filter, X, Loader2 } from 'lucide-react';
import EntryCard from './EntryCard';
import SourceSelector from './SourceSelector';
import AddToDeckModal from './AddToDeckModal';
import { useDictionarySearch } from '../../hooks/useDictionarySearch';
import { useEntries } from '../../hooks/useEntries';
import { useDecks } from '../../hooks/useDecks';
import { SOURCES } from '../../lib/dictionarySources';
import Button from '../ui/Button';
import { EntryCardSkeleton } from '../ui/LoadingSpinner';

export default function LookupTab() {
  const { decks, fetchDecks } = useDecks();
  const { createEntry } = useEntries();

  const {
    query,
    groupedResults,
    loading,
    isAnyLoading,
    totalResults,
    search,
    clearSearch,
  } = useDictionarySearch();

  const [localQuery, setLocalQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('recentSearches') || '[]');
    } catch {
      return [];
    }
  });

  // Save to deck flow
  const [savingEntry, setSavingEntry] = useState(null);
  const [showDeckModal, setShowDeckModal] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(null);

  const debounceRef = useRef(null);

  const handleQueryChange = useCallback((value) => {
    setLocalQuery(value);

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      search(value);

      if (value.length >= 2) {
        setRecentSearches(prev => {
          const updated = [value, ...prev.filter(s => s !== value)].slice(0, 5);
          localStorage.setItem('recentSearches', JSON.stringify(updated));
          return updated;
        });
      }
    }, 300);
  }, [search]);

  const handleClear = useCallback(() => {
    setLocalQuery('');
    clearSearch();
  }, [clearSearch]);

  const handleRecentClick = useCallback((term) => {
    setLocalQuery(term);
    search(term);
  }, [search]);

  const handleSelectResult = (entry) => {
    console.log('Selected:', entry);
  };

  // Save external result to deck
  const handleSaveToDeck = useCallback((entry) => {
    setSavingEntry(entry);
    setShowDeckModal(true);
    fetchDecks();
  }, [fetchDecks]);

  const handleDeckSelected = useCallback(async (deckId) => {
    if (!savingEntry) return;

    const entryData = {
      deck_id: deckId,
      word: savingEntry.word,
      phonetic: savingEntry.phonetic || '',
      translation: savingEntry.translation || '',
      language: savingEntry.language || 'en',
      notes: savingEntry.notes || '',
      tags: savingEntry.tags || [],
      examples: savingEntry.examples || [],
      audio_url: savingEntry.audio_url || null,
      source_type: `external:${savingEntry._sourceId || savingEntry.source_type}`,
      contributor_name: savingEntry.contributor_name || '',
    };

    const { error } = await createEntry(entryData);
    if (!error) {
      setSaveSuccess(savingEntry.word);
      setTimeout(() => setSaveSuccess(null), 2000);
    }

    setSavingEntry(null);
    setShowDeckModal(false);
  }, [savingEntry, createEntry]);

  const renderSourceBadge = (source) => {
    if (!source) return null;
    return (
      <span
        className="px-2 py-0.5 text-xs rounded-full font-medium"
        style={{
          backgroundColor: `${source.color}20`,
          color: source.color,
        }}
      >
        {source.shortName}
      </span>
    );
  };

  const hasResults = totalResults > 0;
  const hasQuery = localQuery.length >= 2;

  return (
    <div className="space-y-6">
      {/* Source selector chips */}
      <SourceSelector loading={loading} />

      {/* Search input */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            value={localQuery}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Search dictionaries..."
            autoFocus
            className="w-full pl-10 pr-10 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-starlog-500 focus:ring-1 focus:ring-starlog-500 transition-colors"
          />
          {isAnyLoading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 animate-spin" />
          )}
          {!isAnyLoading && localQuery && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

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
            {selectedDeck && (
              <span className="ml-2 w-2 h-2 bg-starlog-500 rounded-full" />
            )}
          </Button>

          {selectedDeck && (
            <Button variant="ghost" size="sm" onClick={() => setSelectedDeck(null)}>
              Clear filters
            </Button>
          )}
        </div>

        {/* Filter options */}
        {showFilters && (
          <div className="p-4 bg-slate-900/50 rounded-xl space-y-4">
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

      {/* Save success toast */}
      {saveSuccess && (
        <div className="px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 text-sm">
          Saved "{saveSuccess}" to your deck
        </div>
      )}

      {/* Recent searches */}
      {!hasResults && !isAnyLoading && !hasQuery && recentSearches.length > 0 && (
        <div>
          <h3 className="text-sm text-slate-500 mb-3">Recent searches</h3>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((term, i) => (
              <button
                key={i}
                onClick={() => handleRecentClick(term)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-300 transition-colors"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Grouped results by source */}
      {isAnyLoading && !hasResults ? (
        <div className="space-y-3">
          <EntryCardSkeleton />
          <EntryCardSkeleton />
          <EntryCardSkeleton />
        </div>
      ) : hasResults ? (
        <div className="space-y-6">
          <p className="text-sm text-slate-500">{totalResults} results</p>

          {groupedResults.map(({ source, results: sourceResults }) => (
            <div key={source.id} className="space-y-3">
              {/* Section header */}
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: source.color }}
                />
                <h3 className="text-sm font-medium text-slate-300">{source.name}</h3>
                <span className="text-xs text-slate-500">{sourceResults.length}</span>
              </div>

              {sourceResults.map(entry => {
                const isExternal = !source.isBuiltIn;

                return (
                  <EntryCard
                    key={entry.id}
                    entry={entry}
                    showDeck={source.id === 'personal'}
                    onEdit={handleSelectResult}
                    sourceBadge={renderSourceBadge(source)}
                    showSaveAction={isExternal}
                    onSave={isExternal ? handleSaveToDeck : undefined}
                  />
                );
              })}
            </div>
          ))}
        </div>
      ) : hasQuery && !isAnyLoading ? (
        <div className="text-center py-8 text-slate-500">
          No results found for "{localQuery}"
        </div>
      ) : null}

      {/* Add to deck modal */}
      <AddToDeckModal
        isOpen={showDeckModal}
        onClose={() => { setShowDeckModal(false); setSavingEntry(null); }}
        onSelect={handleDeckSelected}
      />
    </div>
  );
}
