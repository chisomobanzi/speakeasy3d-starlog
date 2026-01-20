import { useState, useEffect } from 'react';
import { Search, Filter, Globe, TrendingUp, Star } from 'lucide-react';
import { useCommunity } from '../../hooks/useCommunity';
import { CommunityDeckCard } from './DeckCard';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Tabs from '../ui/Tabs';
import Badge from '../ui/Badge';
import { DeckCardSkeleton } from '../ui/LoadingSpinner';
import { useToast } from '../ui/Toast';
import { useDecks } from '../../hooks/useDecks';

export default function CommunityTab() {
  const {
    communityDecks,
    loading,
    fetchCommunityDecks,
    getLanguageCommunities,
  } = useCommunity();
  const { forkDeck } = useDecks();
  const { success, error } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [activeTab, setActiveTab] = useState('featured');
  const [languages, setLanguages] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    fetchCommunityDecks({
      language: selectedLanguage,
      featured: activeTab === 'featured',
      orderBy: activeTab === 'trending' ? 'fork_count' : 'learner_count',
    });
  }, [selectedLanguage, activeTab]);

  const loadData = async () => {
    const langs = await getLanguageCommunities();
    setLanguages(langs);
  };

  const handleFork = async (deck) => {
    const { error: forkError } = await forkDeck(deck.id);
    if (forkError) {
      error('Failed to add deck to library');
    } else {
      success(`"${deck.name}" added to your library!`);
    }
  };

  const filteredDecks = communityDecks.filter(deck =>
    !searchQuery ||
    deck.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    deck.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

      {/* Tabs */}
      <Tabs
        tabs={[
          { value: 'featured', label: 'Featured', icon: Star },
          { value: 'trending', label: 'Trending', icon: TrendingUp },
          { value: 'all', label: 'All', icon: Globe },
        ]}
        value={activeTab}
        onChange={setActiveTab}
        variant="pills"
      />

      {/* Language filter */}
      {languages.length > 0 && (
        <div>
          <p className="text-sm text-slate-500 mb-2">Filter by language</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedLanguage(null)}
              className={`
                px-3 py-1.5 rounded-full text-sm transition-colors
                ${!selectedLanguage
                  ? 'bg-starlog-500/20 text-starlog-400 border border-starlog-500/30'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
                }
              `}
            >
              All languages
            </button>
            {languages.slice(0, 6).map(lang => (
              <button
                key={lang.code}
                onClick={() => setSelectedLanguage(lang.code)}
                className={`
                  px-3 py-1.5 rounded-full text-sm transition-colors
                  ${selectedLanguage === lang.code
                    ? 'bg-starlog-500/20 text-starlog-400 border border-starlog-500/30'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                  }
                `}
              >
                {lang.name}
                <span className="ml-1 text-slate-500">({lang.total_entries || 0})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="space-y-4">
          <DeckCardSkeleton />
          <DeckCardSkeleton />
          <DeckCardSkeleton />
        </div>
      ) : filteredDecks.length === 0 ? (
        <div className="text-center py-12">
          <Globe className="w-12 h-12 text-slate-700 mx-auto mb-4" />
          <p className="text-slate-500">No community decks found</p>
          {searchQuery && (
            <Button
              variant="ghost"
              onClick={() => setSearchQuery('')}
              className="mt-2"
            >
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
              onFork={handleFork}
            />
          ))}
        </div>
      )}

      {/* Stats */}
      {languages.length > 0 && (
        <div className="mt-8 p-4 bg-slate-900/50 rounded-xl">
          <h3 className="font-medium text-white mb-3">Community Stats</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-starlog-400">
                {languages.reduce((sum, l) => sum + (l.total_entries || 0), 0).toLocaleString()}
              </p>
              <p className="text-sm text-slate-500">Total entries</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-starlog-400">
                {languages.length}
              </p>
              <p className="text-sm text-slate-500">Languages</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-starlog-400">
                {languages.reduce((sum, l) => sum + (l.total_contributors || 0), 0).toLocaleString()}
              </p>
              <p className="text-sm text-slate-500">Contributors</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
