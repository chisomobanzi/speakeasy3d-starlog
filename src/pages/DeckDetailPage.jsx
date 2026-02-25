import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, BookOpen, Search, X, Upload, LayoutList, Table2, Volume2, Loader2, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useDecks } from '../hooks/useDecks';
import { useEntries } from '../hooks/useEntries';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';
import EntryCard from '../components/starlog/EntryCard';
import ConstellationView from '../components/starlog/ConstellationView';
import DeckSpreadsheet from '../components/starlog/DeckSpreadsheet';
import { EntryCardSkeleton } from '../components/ui/LoadingSpinner';
import { useToast } from '../components/ui/Toast';
import { ConfirmDialog } from '../components/ui/Modal';
import { getReviewStats, getDueEntries, sortByPriority } from '../lib/srs';
import { generateTTS, generateDeckTTS } from '../lib/tts';
import ReviewMode from '../components/starlog/ReviewMode';

export default function DeckDetailPage() {
  const { deckId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const { getDeck, deleteDeck } = useDecks();
  const { entries, loading, fetchEntries, deleteEntry, createEntry, updateEntry } = useEntries(deckId);

  const [deck, setDeck] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'
  const [ttsLoadingId, setTtsLoadingId] = useState(null);
  const [ttsBulkProgress, setTtsBulkProgress] = useState(null);
  const [ttsBulkRunning, setTtsBulkRunning] = useState(false);
  const [reviewMode, setReviewMode] = useState(null); // 'due' | 'all' | null
  const [reviewEntries, setReviewEntries] = useState([]);

  useEffect(() => {
    loadDeck();
    fetchEntries();
  }, [deckId]);

  const loadDeck = async () => {
    const deckData = await getDeck(deckId);
    if (!deckData) {
      toast.error('Deck not found');
      navigate('/');
      return;
    }
    setDeck(deckData);
  };

  const handleDelete = async () => {
    setDeleting(true);
    const { error: deleteError } = await deleteDeck(deckId);
    setDeleting(false);

    if (deleteError) {
      toast.error('Failed to delete deck');
    } else {
      toast.success('Deck deleted');
      navigate('/');
    }
  };

  const handleDeleteEntry = async (entry) => {
    const { error: deleteError } = await deleteEntry(entry.id);
    if (deleteError) {
      toast.error('Failed to delete entry');
    } else {
      toast.success('Entry deleted');
    }
  };

  const handlePlayAudio = async (url) => {
    const audio = new Audio(url);
    await audio.play();
  };

  const handleGenerateTTS = async (entry) => {
    setTtsLoadingId(entry.id);
    try {
      const audioUrl = await generateTTS(entry.word, deck.target_language, deckId);
      await updateEntry(entry.id, { audio_url: audioUrl });
      toast.success(`Audio generated for "${entry.word}"`);
    } catch (err) {
      toast.error(`TTS failed: ${err.message}`);
    } finally {
      setTtsLoadingId(null);
    }
  };

  const handleBulkTTS = async () => {
    const missing = entries.filter(e => !e.audio_url);
    if (missing.length === 0) {
      toast.info('All entries already have audio');
      return;
    }
    setTtsBulkRunning(true);
    const results = await generateDeckTTS(missing, deck.target_language, deckId, (progress) => {
      setTtsBulkProgress(progress);
    });
    for (const { entryId, audioUrl } of results) {
      await updateEntry(entryId, { audio_url: audioUrl });
    }
    setTtsBulkRunning(false);
    setTtsBulkProgress(null);
    toast.success(`Generated audio for ${results.length} words`);
  };

  const missingAudioCount = entries.filter(e => !e.audio_url).length;

  // Due entries for review
  const dueEntries = useMemo(() => sortByPriority(getDueEntries(entries)), [entries]);

  const handleStartReview = () => {
    if (dueEntries.length === 0) return;
    setReviewEntries(dueEntries);
    setReviewMode('due');
  };

  const handleReviewComplete = () => {
    setReviewMode(null);
    setReviewEntries([]);
    fetchEntries();
  };

  // Filter entries by search
  const filteredEntries = useMemo(() => {
    if (!searchQuery) return entries;
    const query = searchQuery.toLowerCase();
    return entries.filter(entry =>
      entry.word?.toLowerCase().includes(query) ||
      entry.translation?.toLowerCase().includes(query) ||
      entry.phonetic?.toLowerCase().includes(query) ||
      entry.notes?.toLowerCase().includes(query) ||
      entry.tags?.some(t => t.toLowerCase().includes(query))
    );
  }, [entries, searchQuery]);

  // Get review stats
  const stats = getReviewStats(entries);

  if (!deck) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        <div className="h-20 bg-slate-800 rounded-xl animate-pulse" />
        <div className="h-64 bg-slate-800 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-0">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between bg-slate-900/50 border-b border-slate-800 sticky top-0 md:top-14 z-30 backdrop-blur-lg">
        <Link to="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft size={20} />
          <span>Back</span>
        </Link>
        <div className="flex items-center gap-3">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: deck.color || '#10b981' }}
          />
          <span className="font-semibold text-white">{deck.name}</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowDeleteConfirm(true)}
          className="text-slate-400 hover:text-red-400"
        >
          <Trash2 size={18} />
        </Button>
      </div>

      {/* Stats bar */}
      <div className="px-4 py-3 flex items-center gap-2 justify-between bg-slate-900/30 border-b border-slate-800">
        <div className="flex items-center gap-2 text-sm">
          <Badge>{entries.length} words</Badge>
          <Badge variant="primary">{deck.target_language?.toUpperCase()}</Badge>

          {/* Cards / Table toggle */}
          <div className="flex rounded-lg overflow-hidden border border-slate-700">
            <button
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium transition-colors ${
                viewMode === 'cards'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
              Cards
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium transition-colors ${
                viewMode === 'table'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Table2 className="w-3.5 h-3.5" />
              Table
            </button>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-1.5">
          {dueEntries.length > 0 && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleStartReview}
            >
              <Zap className="w-4 h-4" />
              Review ({dueEntries.length})
            </Button>
          )}
          {missingAudioCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBulkTTS}
              disabled={ttsBulkRunning}
              className="text-slate-400 hover:text-starlog-400"
            >
              {ttsBulkRunning ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
              {ttsBulkRunning && ttsBulkProgress
                ? `${ttsBulkProgress.current}/${ttsBulkProgress.total}...`
                : `Audio (${missingAudioCount})`}
            </Button>
          )}
          <Link to={`/import?deck=${deckId}`}>
            <Button variant="ghost" size="sm">
              <Upload className="w-4 h-4" />
              Import
            </Button>
          </Link>
          <Link to="/add">
            <Button variant="secondary" size="sm">
              <Plus className="w-4 h-4" />
              Add
            </Button>
          </Link>
        </div>
      </div>

      {/* Bulk TTS progress bar */}
      {ttsBulkRunning && ttsBulkProgress && (
        <div className="px-4 py-2 bg-slate-900/30 border-b border-slate-800">
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <Loader2 className="w-3 h-3 animate-spin text-starlog-400" />
            <span>Generating: "{ttsBulkProgress.currentWord}"</span>
            <span className="ml-auto">{ttsBulkProgress.current}/{ttsBulkProgress.total}</span>
          </div>
          <div className="mt-1.5 h-1 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full bg-starlog-500 transition-all"
              style={{ width: `${(ttsBulkProgress.current / ttsBulkProgress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Content: Table view or Cards view */}
      {viewMode === 'table' ? (
        <div className="p-4">
          <DeckSpreadsheet
            entries={entries}
            deck={deck}
            onCreateEntry={createEntry}
            onUpdateEntry={updateEntry}
            onDeleteEntry={deleteEntry}
            deckId={deckId}
            toast={toast}
            onGenerateTTS={handleGenerateTTS}
            ttsLoadingId={ttsLoadingId}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-4 lg:p-4">
          {/* Constellation view */}
          <div className="lg:sticky lg:top-32 lg:h-[calc(100vh-10rem)]">
            <ConstellationView
              entries={entries}
              deckName={deck.name}
              deckColor={deck.color || '#10b981'}
            />

            {/* Review button - mobile only, below constellation */}
            {entries.length > 0 && (
              <div className="px-4 pb-2 lg:hidden">
                <Button
                  variant="primary"
                  onClick={handleStartReview}
                  disabled={dueEntries.length === 0}
                  className="w-full"
                >
                  <Zap className="w-4 h-4" />
                  Review {dueEntries.length > 0 ? `(${dueEntries.length} due)` : '— All caught up!'}
                </Button>
              </div>
            )}
          </div>

          {/* Words list */}
          <div className="px-4 py-4 lg:px-0 space-y-4">
            {/* Review button - desktop only */}
            {entries.length > 0 && (
              <Button
                variant="primary"
                onClick={handleStartReview}
                disabled={dueEntries.length === 0}
                className="w-full hidden lg:flex"
              >
                <Zap className="w-4 h-4" />
                Review {dueEntries.length > 0 ? `(${dueEntries.length} due)` : '— All caught up!'}
              </Button>
            )}

            {/* Progress stats */}
            {entries.length > 0 && (
              <div className="hidden lg:grid grid-cols-4 gap-3">
                <Card className="text-center py-3">
                  <p className="text-lg font-bold text-white">{stats.new + stats.pending}</p>
                  <p className="text-xs text-slate-500">New</p>
                </Card>
                <Card className="text-center py-3">
                  <p className="text-lg font-bold text-yellow-400">{stats.due}</p>
                  <p className="text-xs text-slate-500">Due</p>
                </Card>
                <Card className="text-center py-3">
                  <p className="text-lg font-bold text-green-400">{stats.mastered}</p>
                  <p className="text-xs text-slate-500">Mastered</p>
                </Card>
                <Card className="text-center py-3">
                  <p className="text-lg font-bold text-cyan-400">
                    {Math.round(stats.averageMastery * 100)}%
                  </p>
                  <p className="text-xs text-slate-500">Mastery</p>
                </Card>
              </div>
            )}

            {/* Search */}
            {entries.length > 0 && (
              <div className="relative">
                <Input
                  placeholder="Search words, translations, tags..."
                  icon={Search}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {/* Filtered count */}
            {searchQuery && (
              <p className="text-sm text-slate-400">
                {filteredEntries.length} of {entries.length} word{entries.length !== 1 ? 's' : ''} matching "{searchQuery}"
              </p>
            )}

            {/* Entries list */}
            {loading ? (
              <div className="space-y-4">
                <EntryCardSkeleton />
                <EntryCardSkeleton />
                <EntryCardSkeleton />
              </div>
            ) : filteredEntries.length === 0 && !searchQuery ? (
              <Card className="text-center py-12">
                <BookOpen className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No words yet</h3>
                <p className="text-slate-400 mb-4">
                  Start adding vocabulary to this deck
                </p>
                <Link to="/add">
                  <Button variant="primary">
                    <Plus className="w-5 h-5" />
                    Add Your First Word
                  </Button>
                </Link>
              </Card>
            ) : filteredEntries.length === 0 && searchQuery ? (
              <Card className="text-center py-8">
                <Search className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                <p className="text-slate-400">No words matching "{searchQuery}"</p>
                <Button variant="ghost" onClick={() => setSearchQuery('')} className="mt-2">
                  Clear search
                </Button>
              </Card>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-3"
              >
                {filteredEntries.map((entry, index) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <EntryCard
                      entry={entry}
                      onDelete={handleDeleteEntry}
                      onPlay={handlePlayAudio}
                      onGenerateTTS={handleGenerateTTS}
                      ttsLoading={ttsLoadingId === entry.id}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      )}

      {/* Review Mode */}
      {reviewMode && reviewEntries.length > 0 && (
        <ReviewMode
          entries={reviewEntries}
          onComplete={handleReviewComplete}
          onUpdateEntry={(id, data) => updateEntry(id, data)}
          onClose={() => { setReviewMode(null); setReviewEntries([]); }}
        />
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Deck"
        message={`Are you sure you want to delete "${deck.name}"? This will also delete all ${entries.length} entries. This action cannot be undone.`}
        confirmText="Delete"
        loading={deleting}
      />
    </div>
  );
}
