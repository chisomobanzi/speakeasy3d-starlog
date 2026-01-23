import { useState, useMemo } from 'react';
import {
  Search,
  PanelLeftClose,
  PanelLeft,
  ChevronLeft,
  Volume2,
  ArrowRight,
  Lock,
  Users,
  GitFork,
  Star,
  Globe,
  Sparkles,
} from 'lucide-react';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import LanguageConstellation from './LanguageConstellation';
import {
  DEMO_COMMUNITY_DECKS,
  DEMO_TAXONOMY,
  DEMO_VOCABULARY,
  getWordsForDomain,
  getDomainById,
  getConnectedWords,
} from '../../data/demoTaxonomy';

// Community deck card component
function CommunityDeckCard({ deck, onSelect }) {
  return (
    <Card hover onClick={() => onSelect(deck)} className="group">
      <div className="flex gap-4">
        {/* Deck icon/image */}
        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-starlog-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
          {deck.hasTaxonomy ? (
            <Sparkles className="w-8 h-8 text-starlog-400" />
          ) : (
            <Globe className="w-8 h-8 text-slate-400" />
          )}
        </div>

        {/* Deck info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-white group-hover:text-starlog-400 transition-colors">
                {deck.name}
              </h3>
              <p className="text-sm text-slate-400">{deck.nameEn}</p>
            </div>
            {deck.isFeatured && (
              <Badge variant="primary" size="sm">
                <Star className="w-3 h-3" />
                Featured
              </Badge>
            )}
          </div>

          <p className="text-sm text-slate-500 mt-1 line-clamp-2">
            {deck.description}
          </p>

          {/* Stats row */}
          <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Badge variant="info" size="sm">{deck.languageName}</Badge>
            </span>
            <span className="flex items-center gap-1">
              {deck.wordCount} words
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {deck.learnerCount}
            </span>
            <span className="flex items-center gap-1">
              <GitFork className="w-3.5 h-3.5" />
              {deck.forkCount}
            </span>
          </div>

          {/* Tags */}
          {deck.tags && deck.tags.length > 0 && (
            <div className="flex gap-1 mt-2">
              {deck.tags.slice(0, 3).map(tag => (
                <span
                  key={tag}
                  className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-slate-400 transition-colors self-center" />
      </div>
    </Card>
  );
}

// Word list item component for constellation view
function WordListItem({ word, domain, isHovered, onHover, onClick }) {
  const statusColors = {
    verified: 'bg-green-500/20 text-green-400',
    documented: 'bg-blue-500/20 text-blue-400',
    placeholder: 'bg-yellow-500/20 text-yellow-400',
    gap: 'bg-slate-500/20 text-slate-400',
  };

  return (
    <div
      className={`
        p-3 rounded-lg border transition-all cursor-pointer
        ${isHovered
          ? 'bg-white/10 border-white/20'
          : 'bg-white/5 border-white/10 hover:bg-white/8'
        }
      `}
      onMouseEnter={() => onHover(word.id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onClick(word)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-white">{word.word}</span>
            {word.hasAudio && (
              <Volume2 className="w-3.5 h-3.5 text-green-400" />
            )}
          </div>
          <p className="text-sm text-slate-400 truncate">{word.translation}</p>
          {word.phonetic && (
            <p className="text-xs text-slate-500">/{word.phonetic}/</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <span
            className={`text-xs px-1.5 py-0.5 rounded ${statusColors[word.docStatus]}`}
          >
            {word.docStatus}
          </span>
          {word.domains.length > 1 && (
            <span className="text-xs text-slate-500">
              +{word.domains.length - 1} domain{word.domains.length > 2 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// Domain card component for constellation sidebar
function DomainCard({ domain, wordCount, onSelect }) {
  return (
    <Card hover onClick={() => onSelect(domain)} className="group">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
          style={{ backgroundColor: domain.color + '20' }}
        >
          {domain.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-white">{domain.nameLocal}</h3>
            {domain.restricted && (
              <Lock className="w-3.5 h-3.5 text-amber-500" />
            )}
          </div>
          <p className="text-sm text-slate-400">{domain.nameEn}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold" style={{ color: domain.color }}>
            {wordCount}
          </p>
          <p className="text-xs text-slate-500">words</p>
        </div>
        <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
      </div>
    </Card>
  );
}

// Word detail view component
function WordDetailView({ word, onSelectWord, onBack }) {
  const domains = word.domains.map(id => getDomainById(id)).filter(Boolean);
  const connectedWords = getConnectedWords(word.id);

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack} icon={ChevronLeft}>
        Back to domain
      </Button>

      <div className="text-center p-6 bg-white/5 rounded-xl border border-white/10">
        <h2 className="text-3xl font-bold text-white mb-2">{word.word}</h2>
        <p className="text-xl text-slate-300 mb-1">{word.translation}</p>
        {word.phonetic && (
          <p className="text-slate-500">/{word.phonetic}/</p>
        )}
        {word.hasAudio && (
          <Button variant="ghost" size="sm" className="mt-4" icon={Volume2}>
            Play audio
          </Button>
        )}
      </div>

      <div>
        <h3 className="text-sm font-medium text-slate-400 mb-2">Domains</h3>
        <div className="flex flex-wrap gap-2">
          {domains.map(domain => (
            <span
              key={domain.id}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm"
              style={{ backgroundColor: domain.color + '20', color: domain.color }}
            >
              {domain.icon} {domain.nameLocal}
            </span>
          ))}
        </div>
      </div>

      {word.example && (
        <div>
          <h3 className="text-sm font-medium text-slate-400 mb-2">Example</h3>
          <p className="text-white italic bg-white/5 rounded-lg p-3 border border-white/10">
            "{word.example}"
          </p>
        </div>
      )}

      {connectedWords.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-slate-400 mb-2">
            Connected Words ({connectedWords.length})
          </h3>
          <div className="space-y-2">
            {connectedWords.map(connWord => {
              const connDomain = getDomainById(connWord.domains[0]);
              return (
                <div
                  key={connWord.id}
                  onClick={() => onSelectWord(connWord)}
                  className="flex items-center gap-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer border border-white/10 transition-colors"
                >
                  <span
                    className="w-8 h-8 rounded flex items-center justify-center text-sm"
                    style={{ backgroundColor: connDomain?.color + '20' }}
                  >
                    {connDomain?.icon}
                  </span>
                  <div>
                    <p className="font-medium text-white">{connWord.word}</p>
                    <p className="text-xs text-slate-400">{connWord.translation}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="text-center pt-4 border-t border-white/10">
        <Badge variant={word.docStatus === 'verified' ? 'success' : 'default'}>
          {word.docStatus}
        </Badge>
      </div>
    </div>
  );
}

// Constellation explorer view (shown when viewing a deck with taxonomy)
function ConstellationExplorer({ deck, onBack }) {
  const [showConstellation, setShowConstellation] = useState(true);
  const [viewMode, setViewMode] = useState('overview');
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [selectedWord, setSelectedWord] = useState(null);
  const [hoveredWord, setHoveredWord] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const domainWordCounts = useMemo(() => {
    const counts = {};
    DEMO_TAXONOMY.domains.forEach(domain => {
      counts[domain.id] = getWordsForDomain(domain.id).length;
    });
    return counts;
  }, []);

  const currentWords = useMemo(() => {
    let words = DEMO_VOCABULARY;
    if (viewMode === 'domain' && selectedDomain) {
      words = getWordsForDomain(selectedDomain.id);
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      words = words.filter(
        w => w.word.toLowerCase().includes(query) || w.translation.toLowerCase().includes(query)
      );
    }
    return words;
  }, [viewMode, selectedDomain, searchQuery]);

  const handleSelectDomain = (domain) => {
    setSelectedDomain(domain);
    setSelectedWord(null);
    setViewMode('domain');
    setSearchQuery('');
  };

  const handleSelectWord = (word) => {
    setSelectedWord(word);
    if (!selectedDomain) {
      setSelectedDomain(getDomainById(word.domains[0]));
    }
    setViewMode('word');
  };

  const handleBackConstellation = () => {
    if (viewMode === 'word') {
      setSelectedWord(null);
      setViewMode('domain');
    } else if (viewMode === 'domain') {
      setSelectedDomain(null);
      setViewMode('overview');
    }
  };

  const totalWords = DEMO_VOCABULARY.length;
  const verifiedCount = DEMO_VOCABULARY.filter(w => w.docStatus === 'verified').length;
  const audioCount = DEMO_VOCABULARY.filter(w => w.hasAudio).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-xl font-bold text-white">{DEMO_TAXONOMY.name}</h2>
            <p className="text-sm text-slate-400">{DEMO_TAXONOMY.nameEn}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowConstellation(!showConstellation)}
          title={showConstellation ? 'Hide constellation' : 'Show constellation'}
        >
          {showConstellation ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeft className="w-5 h-5" />}
        </Button>
      </div>

      {/* Main content - side by side */}
      <div className="flex gap-6" style={{ height: 'calc(100vh - 14rem)' }}>
        {showConstellation && (
          <div className="w-1/2 flex-shrink-0">
            <LanguageConstellation
              taxonomy={DEMO_TAXONOMY}
              vocabulary={DEMO_VOCABULARY}
              viewMode={viewMode}
              selectedDomain={selectedDomain}
              selectedWord={selectedWord}
              hoveredWord={hoveredWord}
              onHoverWord={setHoveredWord}
              onSelectDomain={handleSelectDomain}
              onSelectWord={handleSelectWord}
              onBack={handleBackConstellation}
              className="h-full"
            />
          </div>
        )}

        <div className={`flex-1 overflow-y-auto ${!showConstellation ? 'max-w-2xl mx-auto' : ''}`}>
          {viewMode === 'overview' && (
            <div className="space-y-4">
              <Input
                placeholder="Search words..."
                icon={Search}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              {searchQuery ? (
                <div className="space-y-2">
                  <p className="text-sm text-slate-400">
                    {currentWords.length} result{currentWords.length !== 1 ? 's' : ''} for "{searchQuery}"
                  </p>
                  {currentWords.map(word => (
                    <WordListItem
                      key={word.id}
                      word={word}
                      domain={getDomainById(word.domains[0])}
                      isHovered={hoveredWord === word.id}
                      onHover={setHoveredWord}
                      onClick={handleSelectWord}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-slate-400">
                    Semantic Domains ({DEMO_TAXONOMY.domains.length})
                  </h3>
                  {DEMO_TAXONOMY.domains.map(domain => (
                    <DomainCard
                      key={domain.id}
                      domain={domain}
                      wordCount={domainWordCounts[domain.id]}
                      onSelect={handleSelectDomain}
                    />
                  ))}
                </div>
              )}

              <div className="p-4 bg-slate-900/50 rounded-xl mt-6">
                <h3 className="font-medium text-white mb-3">Collection Stats</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-starlog-400">{totalWords}</p>
                    <p className="text-sm text-slate-500">Total words</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-400">{verifiedCount}</p>
                    <p className="text-sm text-slate-500">Verified</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-400">{audioCount}</p>
                    <p className="text-sm text-slate-500">With audio</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {viewMode === 'domain' && selectedDomain && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <Button variant="ghost" size="icon" onClick={handleBackConstellation}>
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                  style={{ backgroundColor: selectedDomain.color + '20' }}
                >
                  {selectedDomain.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-white text-lg flex items-center gap-2">
                    {selectedDomain.nameLocal}
                    {selectedDomain.restricted && <Lock className="w-4 h-4 text-amber-500" />}
                  </h3>
                  <p className="text-sm text-slate-400">{selectedDomain.nameEn}</p>
                </div>
              </div>

              {selectedDomain.description && (
                <p className="text-sm text-slate-400 bg-white/5 rounded-lg p-3 border border-white/10">
                  {selectedDomain.description}
                </p>
              )}

              <Input
                placeholder={`Search in ${selectedDomain.nameLocal}...`}
                icon={Search}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              <div className="space-y-2">
                <p className="text-sm text-slate-500">
                  {currentWords.length} word{currentWords.length !== 1 ? 's' : ''}
                </p>
                {currentWords.map(word => (
                  <WordListItem
                    key={word.id}
                    word={word}
                    domain={selectedDomain}
                    isHovered={hoveredWord === word.id}
                    onHover={setHoveredWord}
                    onClick={handleSelectWord}
                  />
                ))}
              </div>
            </div>
          )}

          {viewMode === 'word' && selectedWord && (
            <WordDetailView
              word={selectedWord}
              onSelectWord={handleSelectWord}
              onBack={handleBackConstellation}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Main Community Tab component
export default function CommunityTab() {
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLanguage, setFilterLanguage] = useState(null);

  // Get unique languages from decks
  const languages = useMemo(() => {
    const langMap = {};
    DEMO_COMMUNITY_DECKS.forEach(deck => {
      if (!langMap[deck.languageCode]) {
        langMap[deck.languageCode] = {
          code: deck.languageCode,
          name: deck.languageName,
          count: 0,
        };
      }
      langMap[deck.languageCode].count++;
    });
    return Object.values(langMap);
  }, []);

  // Filter decks
  const filteredDecks = useMemo(() => {
    let decks = DEMO_COMMUNITY_DECKS;

    if (filterLanguage) {
      decks = decks.filter(d => d.languageCode === filterLanguage);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      decks = decks.filter(d =>
        d.name.toLowerCase().includes(query) ||
        d.nameEn.toLowerCase().includes(query) ||
        d.description.toLowerCase().includes(query) ||
        d.languageName.toLowerCase().includes(query)
      );
    }

    return decks;
  }, [searchQuery, filterLanguage]);

  const handleSelectDeck = (deck) => {
    if (deck.hasTaxonomy) {
      setSelectedDeck(deck);
    } else {
      // For non-taxonomy decks, we could show a different view or message
      // For now, just show an alert or do nothing
      console.log('Deck detail view not yet implemented for:', deck.name);
    }
  };

  // Show constellation explorer if a deck with taxonomy is selected
  if (selectedDeck?.hasTaxonomy) {
    return (
      <ConstellationExplorer
        deck={selectedDeck}
        onBack={() => setSelectedDeck(null)}
      />
    );
  }

  // Total stats
  const totalWords = DEMO_COMMUNITY_DECKS.reduce((sum, d) => sum + d.wordCount, 0);
  const totalLearners = DEMO_COMMUNITY_DECKS.reduce((sum, d) => sum + d.learnerCount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white mb-2">Community Decks</h2>
        <p className="text-slate-400">
          Explore vocabulary collections from language communities around the world
        </p>
      </div>

      {/* Search */}
      <Input
        placeholder="Search community decks..."
        icon={Search}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      {/* Language filter */}
      <div>
        <p className="text-sm text-slate-500 mb-2">Filter by language</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterLanguage(null)}
            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
              !filterLanguage
                ? 'bg-starlog-500/20 text-starlog-400 border border-starlog-500/30'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            All languages
          </button>
          {languages.map(lang => (
            <button
              key={lang.code}
              onClick={() => setFilterLanguage(lang.code)}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                filterLanguage === lang.code
                  ? 'bg-starlog-500/20 text-starlog-400 border border-starlog-500/30'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {lang.name}
              <span className="ml-1 text-slate-500">({lang.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Deck list */}
      {filteredDecks.length === 0 ? (
        <div className="text-center py-12">
          <Globe className="w-12 h-12 text-slate-700 mx-auto mb-4" />
          <p className="text-slate-500">No community decks found</p>
          {searchQuery && (
            <Button variant="ghost" onClick={() => setSearchQuery('')} className="mt-2">
              Clear search
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDecks.map(deck => (
            <CommunityDeckCard
              key={deck.id}
              deck={deck}
              onSelect={handleSelectDeck}
            />
          ))}
        </div>
      )}

      {/* Stats footer */}
      <div className="p-4 bg-slate-900/50 rounded-xl">
        <h3 className="font-medium text-white mb-3">Community Stats</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-starlog-400">{totalWords.toLocaleString()}</p>
            <p className="text-sm text-slate-500">Total words</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-starlog-400">{languages.length}</p>
            <p className="text-sm text-slate-500">Languages</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-starlog-400">{totalLearners.toLocaleString()}</p>
            <p className="text-sm text-slate-500">Learners</p>
          </div>
        </div>
      </div>
    </div>
  );
}
