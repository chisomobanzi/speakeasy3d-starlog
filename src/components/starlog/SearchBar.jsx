import { useState, useRef, useEffect } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearch } from '../../hooks/useSearch';
import Input from '../ui/Input';

export default function SearchBar({
  placeholder = 'Search your dictionary...',
  onSelect,
  showResults = true,
  autoFocus = false,
  className = '',
}) {
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);

  const {
    query,
    setQuery,
    combinedResults,
    loading,
    clearSearch,
  } = useSearch();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (result) => {
    onSelect?.(result);
    clearSearch();
    setIsFocused(false);
  };

  const showDropdown = isFocused && query.length >= 2 && showResults;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full pl-10 pr-10 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-starlog-500 focus:ring-1 focus:ring-starlog-500 transition-colors"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 animate-spin" />
        )}
        {!loading && query && (
          <button
            onClick={() => {
              clearSearch();
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Results dropdown */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden z-50 max-h-80 overflow-y-auto"
          >
            {combinedResults.length === 0 && !loading && (
              <div className="p-4 text-center text-slate-500">
                No results found for "{query}"
              </div>
            )}

            {combinedResults.map((result) => (
              <button
                key={`${result.source}-${result.id}`}
                onClick={() => handleSelect(result)}
                className="w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-colors text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{result.word}</span>
                    {result.phonetic && (
                      <span className="text-sm text-slate-500">/{result.phonetic}/</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-400 truncate">
                    {result.translation}
                  </p>
                </div>
                <span
                  className={`
                    px-2 py-0.5 text-xs rounded-full
                    ${result.source === 'personal'
                      ? 'bg-starlog-500/20 text-starlog-400'
                      : 'bg-blue-500/20 text-blue-400'
                    }
                  `}
                >
                  {result.source === 'personal' ? 'Mine' : 'Community'}
                </span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
