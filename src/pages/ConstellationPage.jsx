import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Search, X, Loader2, BookOpen, Settings, LogIn, LogOut, Plus, Users, QrCode, ArrowLeft, Trash2, Upload } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { LoadingScreen } from '../components/ui/LoadingSpinner';
import PublicConstellation from '../components/starlog/PublicConstellation';
import ConstellationView from '../components/starlog/ConstellationView';
import StarsCanvas from '../components/starlog/StarsCanvas';
import ConstellationHero from '../components/starlog/ConstellationHero';
import SuggestWordModal from '../components/starlog/SuggestWordModal';
import ConstellationQR from '../components/starlog/ConstellationQR';
import WordDetailModal from '../components/starlog/WordDetailModal';
import AddToDeckModal from '../components/starlog/AddToDeckModal';
import SourceSelector from '../components/starlog/SourceSelector';
import Modal from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/Modal';
import { adaptSeedData } from '../lib/constellation-adapter';
import { useConstellation } from '../hooks/useConstellation';
import { useConstellationSearch } from '../hooks/useConstellationSearch';
import { useSourceRegistry } from '../hooks/useSourceRegistry';
import { useEntries } from '../hooks/useEntries';
import { useDecks } from '../hooks/useDecks';
import { useToast } from '../components/ui/Toast';
import { useAppStore } from '../stores/appStore';
import { getReviewStats } from '../lib/srs';
import { LANGUAGES } from '../lib/languages';
import seedData from '../data/shona-seed-data.json';

const SEED_DATA_MAP = { sn: seedData };

export default function ConstellationPage({ defaultLanguage }) {
  const { languageCode: urlLanguageCode, deckId: urlDeckId } = useParams();
  const navigate = useNavigate();
  const activeLanguage = useAppStore((s) => s.activeLanguage);
  const setActiveLanguage = useAppStore((s) => s.setActiveLanguage);
  const languageCode = urlLanguageCode || activeLanguage || defaultLanguage || 'sn';

  // View mode: 'language' | 'decks' | 'deck'
  const [viewMode, setViewMode] = useState(urlDeckId ? 'deck' : 'language');
  const [activeDeckId, setActiveDeckId] = useState(urlDeckId || null);
  const [activeDeck, setActiveDeck] = useState(null);

  // Sync URL deckId to state
  useEffect(() => {
    if (urlDeckId) {
      setViewMode('deck');
      setActiveDeckId(urlDeckId);
    }
  }, [urlDeckId]);

  // Sync URL param back to store so it persists
  useEffect(() => {
    if (urlLanguageCode && urlLanguageCode !== activeLanguage) {
      setActiveLanguage(urlLanguageCode);
    }
  }, [urlLanguageCode, activeLanguage, setActiveLanguage]);

  const [selectedDomain, setSelectedDomain] = useState(null);
  const [hoveredWord, setHoveredWord] = useState(null);
  const [colorMode, setColorMode] = useState('domain');
  const [showConnections, setShowConnections] = useState(true);
  const [showStars, setShowStars] = useState(true);

  const [showSuggest, setShowSuggest] = useState(false);
  const [showQR, setShowQR] = useState(false);

  // Detail modal state
  const [detailEntry, setDetailEntry] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Save to deck state
  const [savingEntry, setSavingEntry] = useState(null);
  const [showDeckModal, setShowDeckModal] = useState(false);

  const { user, profile, signOut } = useAuth();
  const { createEntry } = useEntries();
  const { decks, loading: decksLoading, fetchDecks, getDeck, createDeck, deleteDeck: deleteDeckFn } = useDecks();
  const { entries: deckEntries, loading: entriesLoading, fetchEntries } = useEntries(activeDeckId);
  const toast = useToast();

  // Load decks when entering decks or deck mode
  useEffect(() => {
    if (viewMode === 'decks' || viewMode === 'deck') {
      fetchDecks();
    }
  }, [viewMode, fetchDecks]);

  // Load deck + entries when activeDeckId changes
  useEffect(() => {
    if (activeDeckId) {
      getDeck(activeDeckId).then(d => { if (d) setActiveDeck(d); });
      fetchEntries(activeDeckId);
    }
  }, [activeDeckId, getDeck, fetchEntries]);

  // Deck entry click handler
  const handleDeckEntryClick = useCallback((point) => {
    setDetailEntry(point);
    setShowDetailModal(true);
  }, []);

  // Source registry
  const { sourceMap, provenanceSources, getSourceStyle } = useSourceRegistry(languageCode);

  // Constellation source filtering
  const enabledCS = useAppStore((s) => s.enabledConstellationSources);

  const {
    data: supabaseData,
    loading: supabaseLoading,
    discovering,
    discoveryProgress,
    pulseMap,
    recentSignals,
    isLive,
    refetch,
  } = useConstellation(languageCode);

  const staticData = useMemo(() => {
    const raw = SEED_DATA_MAP[languageCode];
    if (!raw) return null;
    return adaptSeedData(raw);
  }, [languageCode]);

  // Build live discovery data from progress (words stream in as they arrive)
  const discoveryData = useMemo(() => {
    if (!discoveryProgress?.words?.length) return null;
    // Reuse the same SIL domains for any language
    const domainDefs = [
      { id: '1', name: 'Universe & Creation', nameLocal: 'Universe', color: '#4ECDC4', icon: '\u{1F30D}', expected: 320, angle: 0 },
      { id: '2', name: 'Person', nameLocal: 'Person', color: '#FF6B8A', icon: '\u{1F9D1}', expected: 280, angle: 40 },
      { id: '3', name: 'Language & Thought', nameLocal: 'Mind', color: '#CE93D8', icon: '\u{1F4AD}', expected: 250, angle: 80 },
      { id: '4', name: 'Social Behavior', nameLocal: 'Social', color: '#FFB347', icon: '\u{1F91D}', expected: 380, angle: 120 },
      { id: '5', name: 'Daily Life', nameLocal: 'Daily Life', color: '#7ED87E', icon: '\u{1F3E0}', expected: 300, angle: 160 },
      { id: '6', name: 'Work & Occupation', nameLocal: 'Work', color: '#A5D6A7', icon: '\u{1F528}', expected: 340, angle: 200 },
      { id: '7', name: 'Physical Actions', nameLocal: 'Actions', color: '#82B1FF', icon: '\u{1F3C3}', expected: 220, angle: 240 },
      { id: '8', name: 'States', nameLocal: 'States', color: '#FFAB91', icon: '\u{1F522}', expected: 200, angle: 280 },
      { id: '9', name: 'Grammar', nameLocal: 'Grammar', color: '#B0BEC5', icon: '\u{1F524}', expected: 150, angle: 320 },
    ];
    const langNameStr = LANGUAGES.find(l => l.code === languageCode)?.name || languageCode;
    return {
      language: { code: languageCode, name: langNameStr },
      taxonomy: { name: langNameStr, domains: domainDefs },
      vocabulary: discoveryProgress.words,
    };
  }, [discoveryProgress, languageCode]);

  const constellationData = useMemo(() => {
    if (supabaseData?.vocabulary?.length > 0) return supabaseData;
    if (staticData) return staticData;
    if (discoveryData) return discoveryData;
    return null;
  }, [supabaseData, staticData, discoveryData]);

  const handleSelectDomain = useCallback((domainId) => {
    setSelectedDomain(domainId);
  }, []);

  // Search integration
  const allVocabulary = constellationData?.vocabulary || [];
  const taxonomy = constellationData?.taxonomy || { domains: [] };

  // Apply constellation source filter
  const baseVocabulary = useMemo(
    () => enabledCS
      ? allVocabulary.filter(w => enabledCS.includes(w.source))
      : allVocabulary,
    [allVocabulary, enabledCS]
  );

  const {
    query: searchQuery,
    highlightedIds,
    augmentedVocabulary,
    searchResults,
    isSearching,
    sourceLoading,
    search,
    clearSearch,
  } = useConstellationSearch(baseVocabulary, taxonomy, languageCode, sourceMap);

  const searchActive = searchQuery?.length >= 2;

  // Empty constellation fallback for languages without seed/Supabase data
  const emptyConstellation = useMemo(() => ({
    language: { code: languageCode, name: LANGUAGES.find(l => l.code === languageCode)?.name || languageCode },
    taxonomy: { domains: [] },
    vocabulary: [],
  }), [languageCode]);

  // Star click handler
  const handleStarClick = useCallback((star) => {
    const entry = star._searchEntry || {
      word: star.word,
      translation: star.translation,
      language: languageCode,
      source_type: star.source,
      _sourceId: star._isSearchResult ? star._sourceId : star.source,
    };
    setDetailEntry(entry);
    setShowDetailModal(true);
  }, [languageCode]);

  // Save to deck from detail modal
  const handleSaveToDeckFromDetail = useCallback((enrichedEntry) => {
    setShowDetailModal(false);
    setDetailEntry(null);
    setSavingEntry(enrichedEntry);
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
      language: savingEntry.language || languageCode || 'en',
      notes: savingEntry.notes || '',
      tags: savingEntry.tags || [],
      examples: savingEntry.examples || [],
      audio_url: savingEntry.audio_url || null,
      source_type: `external:${savingEntry._sourceId || savingEntry.source_type}`,
      contributor_name: savingEntry.contributor_name || '',
    };

    const { error } = await createEntry(entryData);
    if (!error) {
      toast.success(`Saved "${savingEntry.word}" to your deck`);
    }

    setSavingEntry(null);
    setShowDeckModal(false);
  }, [savingEntry, createEntry, toast, languageCode]);

  if (!languageCode) return <ConstellationHero />;

  if (supabaseLoading && !staticData && !discoveryData) {
    return <LoadingScreen message="Loading constellation..." />;
  }

  const displayData = constellationData || emptyConstellation;
  const { language } = displayData;

  return (
    <div className="fixed inset-0 flex" style={{
      background: 'radial-gradient(ellipse at center, #0a0d1a 0%, #050710 70%, #020308 100%)',
      fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace",
    }}>
      {/* Star field background */}
      {showStars && <StarsCanvas />}

      {/* Viz area */}
      <div className="flex-1 relative flex items-center justify-center">
        {viewMode === 'deck' && activeDeckId ? (
          <ConstellationView
            entries={deckEntries}
            deckName={activeDeck?.name || 'Loading...'}
            deckColor={activeDeck?.color || '#06b6d4'}
            onSelectEntry={handleDeckEntryClick}
            embedded
          />
        ) : (
          <PublicConstellation
            language={language}
            taxonomy={taxonomy}
            vocabulary={searchActive ? augmentedVocabulary : baseVocabulary}
            selectedDomain={selectedDomain}
            hoveredWord={hoveredWord}
            pulseMap={pulseMap}
            isLive={isLive}
            recentSignals={recentSignals}
            colorMode={colorMode}
            showConnections={showConnections}
            onHoverWord={setHoveredWord}
            onSelectDomain={handleSelectDomain}
            highlightedIds={searchActive ? highlightedIds : null}
            searchActive={searchActive}
            onStarClick={handleStarClick}
            sourceMap={sourceMap}
          />
        )}

        {/* Title bar with controls (language mode only) */}
        {viewMode !== 'deck' && (
          <div className="absolute top-3 right-3 z-10 flex gap-2">
            <button
              className={`px-2.5 py-1 rounded text-[9px] tracking-wider uppercase transition-all ${colorMode === 'domain' ? 'bg-white/[.12] text-white' : 'bg-white/[.04] text-white/40'}`}
              onClick={() => setColorMode('domain')}
            >Color: Domain</button>
            <button
              className={`px-2.5 py-1 rounded text-[9px] tracking-wider uppercase transition-all ${colorMode === 'source' ? 'bg-white/[.12] text-white' : 'bg-white/[.04] text-white/40'}`}
              onClick={() => setColorMode('source')}
            >Color: Source</button>
            <button
              className={`px-2.5 py-1 rounded text-[9px] tracking-wider uppercase transition-all ${showConnections ? 'bg-cyan-500/15 text-cyan-400' : 'bg-white/[.04] text-white/40'}`}
              onClick={() => setShowConnections(v => !v)}
            >Links</button>
            <button
              className={`px-2.5 py-1 rounded text-[9px] tracking-wider uppercase transition-all ${showStars ? 'bg-pink-500/15 text-pink-400' : 'bg-white/[.04] text-white/40'}`}
              onClick={() => setShowStars(v => !v)}
            >Stars</button>
          </div>
        )}

        {/* Word list popup when domain is selected */}
        {viewMode !== 'deck' && selectedDomain && (
          <WordListPopup
            domain={taxonomy.domains.find(d => d.id === selectedDomain)}
            vocabulary={searchActive ? augmentedVocabulary : baseVocabulary}
            selectedDomain={selectedDomain}
            sourceMap={sourceMap}
          />
        )}

        {/* Discovery overlay */}
        {discovering && viewMode !== 'deck' && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20">
            <div className="px-5 py-3 rounded-xl backdrop-blur-md flex items-center gap-3"
              style={{ background: 'rgba(8,10,18,0.85)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
              <div>
                <p className="text-[11px] text-white font-medium">
                  Discovering {language.name} vocabulary...
                </p>
                <p className="text-[10px] text-slate-400">
                  {discoveryProgress?.words?.length || 0} words found
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Floating nav */}
        <FloatingNav
          user={user}
          profile={profile}
          signOut={signOut}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />
      </div>

      {/* Sidebar — switches based on viewMode */}
      {viewMode === 'decks' ? (
        <DeckListSidebar
          decks={decks}
          loading={decksLoading}
          onSelectDeck={(deck) => {
            setActiveDeckId(deck.id);
            setActiveDeck(deck);
            setViewMode('deck');
            navigate(`/deck/${deck.id}`);
          }}
          onBack={() => setViewMode('language')}
          createDeck={createDeck}
          deleteDeck={deleteDeckFn}
          toast={toast}
        />
      ) : viewMode === 'deck' && activeDeckId ? (
        <DeckDetailSidebar
          deck={activeDeck}
          entries={deckEntries}
          loading={entriesLoading}
          onBack={() => {
            setViewMode('decks');
            setActiveDeckId(null);
            setActiveDeck(null);
            navigate('/');
          }}
          onEntryClick={(entry) => { setDetailEntry(entry); setShowDetailModal(true); }}
          deleteDeck={deleteDeckFn}
          toast={toast}
          navigate={navigate}
        />
      ) : (
        <ConstellationSidebar
          taxonomy={taxonomy}
          vocabulary={baseVocabulary}
          allVocabulary={allVocabulary}
          selectedDomain={selectedDomain}
          onSelectDomain={handleSelectDomain}
          search={search}
          clearSearch={clearSearch}
          searchQuery={searchQuery}
          searchResults={searchResults}
          isSearching={isSearching}
          sourceLoading={sourceLoading}
          onResultClick={(entry) => { setDetailEntry(entry); setShowDetailModal(true); }}
          languageCode={languageCode}
          onLanguageChange={setActiveLanguage}
          sourceMap={sourceMap}
          provenanceSources={provenanceSources}
          getSourceStyle={getSourceStyle}
          onSuggestWord={() => setShowSuggest(true)}
          onShowQR={() => setShowQR(true)}
        />
      )}

      {/* Modals */}
      <SuggestWordModal
        isOpen={showSuggest}
        onClose={() => setShowSuggest(false)}
        languageCode={languageCode}
        domains={taxonomy.domains}
        onWordAdded={refetch}
      />
      <ConstellationQR
        isOpen={showQR}
        onClose={() => setShowQR(false)}
        url={window.location.href}
      />
      <WordDetailModal
        isOpen={showDetailModal}
        onClose={() => { setShowDetailModal(false); setDetailEntry(null); }}
        entry={detailEntry}
        onSaveToDeck={handleSaveToDeckFromDetail}
      />
      <AddToDeckModal
        isOpen={showDeckModal}
        onClose={() => { setShowDeckModal(false); setSavingEntry(null); }}
        onSelect={handleDeckSelected}
      />
    </div>
  );
}

/* ── Floating Nav (left side) ── */
function FloatingNav({ user, profile, signOut, viewMode, setViewMode }) {
  const isDecksActive = viewMode === 'decks' || viewMode === 'deck';

  const navItems = [
    {
      action: () => { if (viewMode !== 'language') setViewMode('language'); },
      icon: Search,
      label: 'Search',
      active: viewMode === 'language',
    },
    { to: '/add', icon: Plus, label: 'Capture', accent: true },
    {
      action: () => setViewMode(isDecksActive ? 'language' : 'decks'),
      icon: BookOpen,
      label: 'Decks',
      active: isDecksActive,
    },
    { to: '/community', icon: Users, label: 'Community' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  const authItem = user
    ? { action: signOut, icon: LogOut, label: profile?.display_name || 'Sign out' }
    : { to: '/login', icon: LogIn, label: 'Sign in' };

  return (
    <div
      className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-1.5"
      style={{ fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace" }}
    >
      {navItems.map((item, i) => (
        <FloatingNavItem key={i} {...item} />
      ))}
      <div className="h-px my-1" style={{ background: 'rgba(255,255,255,0.08)' }} />
      <FloatingNavItem {...authItem} />
    </div>
  );
}

function FloatingNavItem({ to, action, icon: Icon, label, accent, active }) {
  const baseClass = `
    group flex items-center gap-2.5 px-2.5 py-2 rounded-lg
    backdrop-blur-md transition-all duration-200
    hover:bg-white/[.10]
  `;
  const isHighlighted = accent || active;
  const style = {
    background: active ? 'rgba(139,92,246,0.18)' : accent ? 'rgba(6,182,212,0.15)' : 'rgba(8,10,18,0.75)',
    border: active ? '1px solid rgba(139,92,246,0.3)' : '1px solid rgba(255,255,255,0.06)',
  };

  const iconColor = active ? '#a78bfa' : accent ? '#22d3ee' : 'rgba(255,255,255,0.5)';
  const textColor = active ? '#a78bfa' : accent ? '#22d3ee' : 'rgba(255,255,255,0.45)';

  const content = (
    <>
      <Icon
        className="w-4 h-4 shrink-0 transition-colors"
        style={{ color: iconColor }}
      />
      <span
        className="text-[11px] whitespace-nowrap transition-colors group-hover:text-white truncate max-w-[100px]"
        style={{ color: textColor }}
      >
        {label}
      </span>
    </>
  );

  if (to) {
    return (
      <Link to={to} className={baseClass} style={style}>
        {content}
      </Link>
    );
  }

  return (
    <button onClick={action} className={baseClass} style={style}>
      {content}
    </button>
  );
}

/* ── Constellation Sidebar ── */
function ConstellationSidebar({
  taxonomy, vocabulary, allVocabulary, selectedDomain, onSelectDomain,
  search, clearSearch, searchQuery, searchResults, isSearching, sourceLoading,
  onResultClick, languageCode, onLanguageChange,
  sourceMap, provenanceSources, getSourceStyle,
  onSuggestWord, onShowQR,
}) {
  const [localQuery, setLocalQuery] = useState('');
  const debounceRef = useRef(null);

  const enabledCS = useAppStore((s) => s.enabledConstellationSources);
  const toggleConstellationSource = useAppStore((s) => s.toggleConstellationSource);

  const totalExpected = taxonomy.domains.reduce((s, d) => s + (d.expected || 0), 0);
  const crossLinks = vocabulary.filter(w => w.domains.length > 1).length;

  const sourceCounts = useMemo(() => {
    const counts = {};
    (allVocabulary || vocabulary).forEach(w => { counts[w.source] = (counts[w.source] || 0) + 1; });
    return counts;
  }, [allVocabulary, vocabulary]);

  // All provenance source IDs that have words in the constellation
  const allProvenanceIds = useMemo(
    () => provenanceSources.map(s => s.id).concat(
      Object.keys(sourceCounts).filter(k => !provenanceSources.some(s => s.id === k))
    ),
    [provenanceSources, sourceCounts]
  );

  const handleQueryChange = useCallback((value) => {
    setLocalQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value || value.length < 2) {
      clearSearch();
      return;
    }
    debounceRef.current = setTimeout(() => {
      search(value);
    }, 300);
  }, [search, clearSearch]);

  const handleLanguageChange = useCallback((e) => {
    const newLang = e.target.value;
    onLanguageChange(newLang);
    setLocalQuery('');
    clearSearch();
  }, [onLanguageChange, clearSearch]);

  const handleClear = useCallback(() => {
    setLocalQuery('');
    clearSearch();
  }, [clearSearch]);

  const hasResults = searchResults?.length > 0;
  const hasQuery = localQuery.length >= 2;

  return (
    <div className="w-[270px] shrink-0 overflow-y-auto border-l flex flex-col"
      style={{
        background: 'rgba(8,10,18,0.92)',
        borderColor: 'rgba(255,255,255,0.06)',
        fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace",
      }}>
      <div className="p-3 flex flex-col gap-2.5">
        {/* Language selector */}
        <select
          value={languageCode}
          onChange={handleLanguageChange}
          className="w-full h-8 px-2 rounded text-[11px] bg-white/[.06] text-white border border-white/[.08] focus:border-cyan-500/40 focus:outline-none transition-colors appearance-none cursor-pointer"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.3)' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 8px center',
          }}
        >
          {LANGUAGES.map(lang => (
            <option key={lang.code} value={lang.code} style={{ background: '#0a0d1a', color: '#fff' }}>
              {lang.name} ({lang.code})
            </option>
          ))}
        </select>

        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.3)' }} />
          <input
            type="text"
            value={localQuery}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Search..."
            className="w-full h-8 pl-7 pr-7 rounded text-[12px] bg-white/[.06] text-white placeholder:text-white/30 border border-white/[.08] focus:border-cyan-500/40 focus:outline-none transition-colors"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          />
          {localQuery && (
            <button onClick={handleClear} className="absolute right-2 top-1/2 -translate-y-1/2">
              {isSearching
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: 'rgba(255,255,255,0.4)' }} />
                : <X className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.3)' }} />
              }
            </button>
          )}
        </div>

        {/* Source toggles */}
        <div className="flex flex-wrap gap-1">
          <SourceSelector loading={sourceLoading} languageCode={languageCode} />
        </div>
      </div>

      {/* Search results */}
      {hasQuery && (
        <div className="px-3 pb-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          {hasResults ? (
            <div className="max-h-[200px] overflow-y-auto space-y-0.5">
              {searchResults.slice(0, 30).map((result, i) => {
                const meta = sourceMap?.get(result._sourceId);
                return (
                  <button
                    key={`${result._sourceId}-${result.word}-${i}`}
                    onClick={() => onResultClick(result)}
                    className="w-full flex items-center gap-1.5 px-1.5 py-1 rounded text-left hover:bg-white/[.05] transition-colors"
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: meta?.core_color || '#7BA3E0' }}
                    />
                    <span className="text-[10px] text-white font-medium truncate flex-1">
                      {result.word}
                    </span>
                    <span className="text-[9px] truncate max-w-[80px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      {result.translation}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : !isSearching ? (
            <div className="text-[10px] py-2 text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
              No results for &ldquo;{localQuery}&rdquo;
            </div>
          ) : null}
        </div>
      )}

      {/* Domain stats + source legend */}
      <div className="flex-1 overflow-y-auto p-3">
        {/* Header */}
        <div className="text-center pb-3 mb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="text-[28px] font-extrabold text-white">{vocabulary.length}</div>
          <div className="text-[10px] tracking-[0.15em] uppercase" style={{ color: 'rgba(255,255,255,0.4)' }}>
            words documented
          </div>
          {totalExpected > 0 && (
            <div className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
              of ~{totalExpected} estimated ({Math.round(vocabulary.length / totalExpected * 100)}%)
            </div>
          )}
          <div className="text-[10px] mt-1 text-cyan-400">
            {crossLinks} cross-domain links
          </div>
        </div>

        {/* Domain rows */}
        {taxonomy.domains.map(d => (
          <DomainRow
            key={d.id}
            domain={d}
            vocabulary={vocabulary}
            isSelected={selectedDomain === d.id}
            onClick={() => onSelectDomain(selectedDomain === d.id ? null : d.id)}
            getSourceStyle={getSourceStyle}
          />
        ))}

        {/* Source legend + display filter */}
        <div className="mt-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="text-[9px] tracking-[0.15em] uppercase mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Display
          </div>
          {Object.entries(sourceCounts).map(([key, count]) => {
            if (count === 0) return null;
            const style = getSourceStyle(key);
            const isEnabled = enabledCS === null || enabledCS.includes(key);
            return (
              <button
                key={key}
                className="w-full flex items-center gap-1.5 mb-0.5 text-left transition-opacity"
                style={{ opacity: isEnabled ? 1 : 0.35 }}
                onClick={() => toggleConstellationSource(key, allProvenanceIds)}
              >
                <span className="text-[11px] w-3.5 text-center" style={{ color: style.coreColor }}>{style.symbol}</span>
                <span className="text-[9px] flex-1" style={{ color: 'rgba(255,255,255,0.45)' }}>{style.label}</span>
                <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* Attribution */}
        <div className="mt-4 pt-3" style={{
          borderTop: '1px solid rgba(255,255,255,0.08)',
          fontSize: '8px',
          color: 'rgba(255,255,255,0.2)',
          lineHeight: 1.5,
        }}>
          Domain structure: SIL International Semantic Domains v4 (semdom.org). CC BY-SA 4.0.
          Originally developed from Bantu languages (Kifuliiru, Gikuyu, Lugwere).
        </div>
      </div>

      {/* Actions */}
      <div className="mt-auto shrink-0 p-3 flex gap-2" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <button
          onClick={onSuggestWord}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-medium transition-colors"
          style={{ background: 'rgba(6,182,212,0.12)', color: '#22d3ee', border: '1px solid rgba(6,182,212,0.2)' }}
        >
          <Plus className="w-3.5 h-3.5" />
          Suggest Word
        </button>
        <button
          onClick={onShowQR}
          className="px-3 py-2 rounded-lg transition-colors hover:bg-white/[.06]"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          title="Share QR code"
        >
          <QrCode className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.4)' }} />
        </button>
      </div>
    </div>
  );
}

/* ── Domain Row ── */
function DomainRow({ domain, vocabulary, isSelected, onClick, getSourceStyle }) {
  const primary = useMemo(() => vocabulary.filter(w => w.domains[0] === domain.id), [vocabulary, domain.id]);
  const secondary = useMemo(() => vocabulary.filter(w => w.domains.includes(domain.id) && w.domains[0] !== domain.id), [vocabulary, domain.id]);
  const pct = domain.expected ? Math.round((primary.length / domain.expected) * 100) : 0;
  const isCritical = pct < 15;

  const bySource = useMemo(() => {
    const counts = {};
    primary.forEach(w => { counts[w.source] = (counts[w.source] || 0) + 1; });
    return counts;
  }, [primary]);

  return (
    <div
      className={`px-2 py-1.5 mb-1 rounded-md cursor-pointer border transition-all hover:bg-white/[.03] ${isSelected ? 'border-white/15' : 'border-transparent'}`}
      style={isSelected ? { background: domain.color + '15', borderColor: domain.color + '30' } : {}}
      onClick={onClick}
    >
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-semibold" style={{ color: domain.color }}>
          {domain.id}. {domain.nameLocal}
        </span>
        <span className={`text-[9px] ${isCritical ? 'text-red-500 font-bold' : ''}`} style={isCritical ? {} : { color: 'rgba(255,255,255,0.45)' }}>
          {primary.length}/{domain.expected}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 rounded-sm mt-0.5 overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div
          className="h-full rounded-sm transition-all duration-500"
          style={{
            width: `${Math.min(pct, 100)}%`,
            background: isCritical
              ? 'linear-gradient(90deg, #FF4444, #FF6644)'
              : `linear-gradient(90deg, ${domain.color}90, ${domain.color})`,
          }}
        />
      </div>

      {/* Source breakdown when selected */}
      {isSelected && (
        <div className="flex gap-1.5 mt-1.5 flex-wrap">
          {Object.entries(bySource).map(([src, count]) => {
            const style = getSourceStyle(src);
            return (
              <span key={src} className="text-[9px]" style={{ color: style.coreColor, opacity: 0.8 }}>
                {style.symbol}{count}
              </span>
            );
          })}
          {secondary.length > 0 && (
            <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
              +{secondary.length} cross-refs
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Word List Popup ── */
function WordListPopup({ domain, vocabulary, selectedDomain, sourceMap }) {
  if (!domain) return null;

  const domainWords = useMemo(
    () => vocabulary.filter(w => w.domains[0] === selectedDomain),
    [vocabulary, selectedDomain]
  );
  const crossRefWords = useMemo(
    () => vocabulary.filter(w => w.domains.includes(selectedDomain) && w.domains[0] !== selectedDomain),
    [vocabulary, selectedDomain]
  );

  const getStyle = useCallback((source) => {
    const s = sourceMap?.get(source) || sourceMap?.get('dictionary');
    return {
      coreColor: s?.core_color || '#7BA3E0',
      symbol: s?.symbol || '\u25CF',
    };
  }, [sourceMap]);

  return (
    <div
      className="absolute left-2.5 top-12 z-[80] rounded-lg p-3 max-w-[280px] max-h-[350px] overflow-y-auto"
      style={{
        background: 'rgba(10,12,20,0.92)',
        backdropFilter: 'blur(10px)',
        borderWidth: 1,
        borderColor: domain.color + '30',
        fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace",
      }}
    >
      <div className="text-[11px] font-bold mb-2" style={{ color: domain.color }}>
        {domain.name} &mdash; {domainWords.length} words
      </div>
      {domainWords.slice(0, 20).map(w => {
        const style = getStyle(w.source);
        return (
          <div key={w.id} className="flex gap-2 mb-0.5 text-[10px]">
            <span className="w-2.5" style={{ color: style.coreColor }}>{style.symbol}</span>
            <span className="text-white font-semibold min-w-[70px]">{w.word}</span>
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>{w.translation}</span>
          </div>
        );
      })}
      {domainWords.length > 20 && (
        <div className="text-[9px] mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
          +{domainWords.length - 20} more...
        </div>
      )}
      {crossRefWords.length > 0 && (
        <>
          <div className="text-[10px] mt-2.5 mb-1 pt-1.5"
            style={{ color: 'rgba(255,255,255,0.4)', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            Cross-referenced ({crossRefWords.length}):
          </div>
          {crossRefWords.slice(0, 8).map(w => (
            <div key={w.id} className="flex gap-2 mb-0.5 text-[10px] opacity-60">
              <span className="w-2.5" style={{ color: domain.color }}>&#x2197;</span>
              <span className="text-white font-semibold min-w-[70px]">{w.word}</span>
              <span style={{ color: 'rgba(255,255,255,0.4)' }}>{w.translation}</span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

/* ── Deck List Sidebar ── */
function DeckListSidebar({ decks, loading, onSelectDeck, onBack, createDeck, deleteDeck, toast }) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', target_language: '', color: '#10b981' });
  const [saving, setSaving] = useState(false);

  const colorOptions = ['#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308'];

  const resetForm = () => setFormData({ name: '', description: '', target_language: '', color: '#10b981' });

  const handleCreate = async () => {
    if (!formData.name.trim() || !formData.target_language.trim()) {
      toast.error('Name and language are required');
      return;
    }
    setSaving(true);
    const { error } = await createDeck({
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      target_language: formData.target_language.trim().toLowerCase(),
      color: formData.color,
    });
    setSaving(false);
    if (error) { toast.error('Failed to create deck'); }
    else { toast.success('Deck created!'); setShowCreateModal(false); resetForm(); }
  };

  const handleDelete = async () => {
    if (!selectedDeck) return;
    setSaving(true);
    const { error } = await deleteDeck(selectedDeck.id);
    setSaving(false);
    if (error) { toast.error('Failed to delete deck'); }
    else { toast.success('Deck deleted'); setShowDeleteConfirm(false); setSelectedDeck(null); }
  };

  return (
    <div className="w-[270px] shrink-0 overflow-y-auto border-l flex flex-col"
      style={{
        background: 'rgba(8,10,18,0.92)',
        borderColor: 'rgba(255,255,255,0.06)',
        fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace",
      }}>
      <div className="p-3 flex flex-col gap-2.5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-1.5 text-[10px] transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.4)' }}>
            <ArrowLeft className="w-3.5 h-3.5" />
            Language View
          </button>
        </div>

        <div className="flex items-center justify-between">
          <h3 className="text-[13px] font-semibold text-white">My Decks</h3>
          <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>{decks.length}</span>
        </div>
      </div>

      {/* Deck list */}
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'rgba(255,255,255,0.3)' }} />
          </div>
        ) : decks.length === 0 ? (
          <div className="text-center py-8">
            <BookOpen className="w-8 h-8 mx-auto mb-2" style={{ color: 'rgba(255,255,255,0.15)' }} />
            <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>No decks yet</p>
          </div>
        ) : (
          <div className="space-y-1">
            {decks.map(deck => (
              <div
                key={deck.id}
                className="group flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-all hover:bg-white/[.05] border border-transparent hover:border-white/[.08]"
                onClick={() => onSelectDeck(deck)}
              >
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: deck.color || '#10b981' }} />
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-medium text-white truncate">{deck.name}</div>
                  {deck.description && (
                    <div className="text-[9px] truncate" style={{ color: 'rgba(255,255,255,0.3)' }}>{deck.description}</div>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{deck.word_count || 0}</span>
                  <span className="text-[8px] px-1 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
                    {deck.target_language?.toUpperCase()}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedDeck(deck); setShowDeleteConfirm(true); }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:text-red-400"
                    style={{ color: 'rgba(255,255,255,0.3)' }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create button */}
      <div className="mt-auto shrink-0 p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-medium transition-colors"
          style={{ background: 'rgba(6,182,212,0.12)', color: '#22d3ee', border: '1px solid rgba(6,182,212,0.2)' }}
        >
          <Plus className="w-3.5 h-3.5" />
          New Deck
        </button>
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); resetForm(); }}
        title="Create New Deck"
        size="sm"
        footer={
          <>
            <button onClick={() => { setShowCreateModal(false); resetForm(); }}
              className="px-3 py-1.5 rounded text-[11px] text-slate-400 hover:text-white transition-colors">
              Cancel
            </button>
            <button onClick={handleCreate} disabled={saving}
              className="px-3 py-1.5 rounded text-[11px] font-medium transition-colors"
              style={{ background: 'rgba(6,182,212,0.2)', color: '#22d3ee' }}>
              {saving ? 'Creating...' : 'Create'}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
              placeholder="e.g., Portuguese Basics"
              className="w-full h-8 px-2 rounded text-[12px] bg-slate-800 text-white border border-slate-700 focus:border-cyan-500/40 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Language Code *</label>
            <input
              type="text"
              value={formData.target_language}
              onChange={(e) => setFormData(p => ({ ...p, target_language: e.target.value }))}
              placeholder="e.g., pt, sn, ami"
              className="w-full h-8 px-2 rounded text-[12px] bg-slate-800 text-white border border-slate-700 focus:border-cyan-500/40 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Description</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
              placeholder="Optional description"
              className="w-full h-8 px-2 rounded text-[12px] bg-slate-800 text-white border border-slate-700 focus:border-cyan-500/40 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Color</label>
            <div className="flex gap-1.5">
              {colorOptions.map(color => (
                <button key={color} type="button"
                  onClick={() => setFormData(p => ({ ...p, color }))}
                  className={`w-6 h-6 rounded-full transition-transform ${formData.color === color ? 'ring-2 ring-white ring-offset-1 ring-offset-slate-900 scale-110' : ''}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => { setShowDeleteConfirm(false); setSelectedDeck(null); }}
        onConfirm={handleDelete}
        title="Delete Deck"
        message={`Delete "${selectedDeck?.name}"? All entries will be lost.`}
        confirmText="Delete"
        loading={saving}
      />
    </div>
  );
}

/* ── Deck Detail Sidebar ── */
function DeckDetailSidebar({ deck, entries, loading, onBack, onEntryClick, deleteDeck, toast, navigate }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const stats = useMemo(() => getReviewStats(entries), [entries]);

  const filteredEntries = useMemo(() => {
    if (!searchQuery) return entries;
    const q = searchQuery.toLowerCase();
    return entries.filter(e =>
      e.word?.toLowerCase().includes(q) ||
      e.translation?.toLowerCase().includes(q) ||
      e.phonetic?.toLowerCase().includes(q)
    );
  }, [entries, searchQuery]);

  const handleDelete = async () => {
    if (!deck) return;
    setDeleting(true);
    const { error } = await deleteDeck(deck.id);
    setDeleting(false);
    if (error) { toast.error('Failed to delete deck'); }
    else { toast.success('Deck deleted'); setShowDeleteConfirm(false); onBack(); }
  };

  const masteryColor = (level) => {
    if (level >= 0.8) return '#4ade80';
    if (level >= 0.4) return '#facc15';
    return 'rgba(255,255,255,0.25)';
  };

  return (
    <div className="w-[270px] shrink-0 overflow-y-auto border-l flex flex-col"
      style={{
        background: 'rgba(8,10,18,0.92)',
        borderColor: 'rgba(255,255,255,0.06)',
        fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace",
      }}>
      <div className="p-3 flex flex-col gap-2.5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-1.5 text-[10px] transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.4)' }}>
            <ArrowLeft className="w-3.5 h-3.5" />
            All Decks
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-1 rounded transition-colors hover:bg-red-500/10"
            style={{ color: 'rgba(255,255,255,0.3)' }}
            title="Delete deck"
          >
            <Trash2 className="w-3.5 h-3.5 hover:text-red-400" />
          </button>
        </div>

        {/* Deck name */}
        <div className="flex items-center gap-2">
          {deck && <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: deck.color || '#10b981' }} />}
          <h3 className="text-[13px] font-semibold text-white truncate">{deck?.name || 'Loading...'}</h3>
          {deck?.target_language && (
            <span className="text-[8px] px-1.5 py-0.5 rounded shrink-0" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
              {deck.target_language.toUpperCase()}
            </span>
          )}
        </div>

        {/* SRS Stats */}
        {entries.length > 0 && (
          <div className="grid grid-cols-4 gap-1.5">
            <div className="text-center py-1.5 rounded" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <div className="text-[13px] font-bold text-white">{stats.new + stats.pending}</div>
              <div className="text-[8px]" style={{ color: 'rgba(255,255,255,0.35)' }}>New</div>
            </div>
            <div className="text-center py-1.5 rounded" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <div className="text-[13px] font-bold text-yellow-400">{stats.due}</div>
              <div className="text-[8px]" style={{ color: 'rgba(255,255,255,0.35)' }}>Due</div>
            </div>
            <div className="text-center py-1.5 rounded" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <div className="text-[13px] font-bold text-green-400">{stats.mastered}</div>
              <div className="text-[8px]" style={{ color: 'rgba(255,255,255,0.35)' }}>Done</div>
            </div>
            <div className="text-center py-1.5 rounded" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <div className="text-[13px] font-bold text-cyan-400">{Math.round(stats.averageMastery * 100)}%</div>
              <div className="text-[8px]" style={{ color: 'rgba(255,255,255,0.35)' }}>Mastery</div>
            </div>
          </div>
        )}

        {/* Search */}
        {entries.length > 0 && (
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.3)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter entries..."
              className="w-full h-8 pl-7 pr-7 rounded text-[12px] bg-white/[.06] text-white placeholder:text-white/30 border border-white/[.08] focus:border-cyan-500/40 focus:outline-none transition-colors"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2">
                <X className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.3)' }} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Entry list */}
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'rgba(255,255,255,0.3)' }} />
          </div>
        ) : filteredEntries.length === 0 && !searchQuery ? (
          <div className="text-center py-8">
            <BookOpen className="w-8 h-8 mx-auto mb-2" style={{ color: 'rgba(255,255,255,0.15)' }} />
            <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>No words yet</p>
            <p className="text-[9px] mt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>Add words from the language constellation</p>
          </div>
        ) : filteredEntries.length === 0 && searchQuery ? (
          <div className="text-center py-6">
            <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>No matches for &ldquo;{searchQuery}&rdquo;</p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {searchQuery && (
              <div className="text-[9px] mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
                {filteredEntries.length} of {entries.length} entries
              </div>
            )}
            {filteredEntries.map(entry => (
              <button
                key={entry.id}
                onClick={() => onEntryClick(entry)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left hover:bg-white/[.05] transition-colors"
              >
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: masteryColor(entry.mastery_level || 0) }} />
                <span className="text-[11px] text-white font-medium truncate flex-1">{entry.word}</span>
                <span className="text-[9px] truncate max-w-[80px]" style={{ color: 'rgba(255,255,255,0.35)' }}>{entry.translation}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-auto shrink-0 p-3 flex gap-2" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <Link to="/add" className="flex-1">
          <button className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-medium transition-colors"
            style={{ background: 'rgba(6,182,212,0.12)', color: '#22d3ee', border: '1px solid rgba(6,182,212,0.2)' }}>
            <Plus className="w-3.5 h-3.5" />
            Add Word
          </button>
        </Link>
        <Link to={`/import?deck=${deck?.id || ''}`}>
          <button className="px-3 py-2 rounded-lg transition-colors hover:bg-white/[.06]"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            title="Import words">
            <Upload className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.4)' }} />
          </button>
        </Link>
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Deck"
        message={`Delete "${deck?.name}"? All ${entries.length} entries will be lost.`}
        confirmText="Delete"
        loading={deleting}
      />
    </div>
  );
}
