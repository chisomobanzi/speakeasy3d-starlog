import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { useDecks } from '../hooks/useDecks';
import { useEntries } from '../hooks/useEntries';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import EntryCard from '../components/starlog/EntryCard';
import ConstellationView from '../components/starlog/ConstellationView';
import { EntryCardSkeleton } from '../components/ui/LoadingSpinner';
import { useToast } from '../components/ui/Toast';
import { ConfirmDialog } from '../components/ui/Modal';
import { getReviewStats } from '../lib/srs';

export default function DeckDetailPage() {
  const { deckId } = useParams();
  const navigate = useNavigate();
  const { success, error } = useToast();

  const { getDeck, deleteDeck } = useDecks();
  const { entries, loading, fetchEntries, deleteEntry } = useEntries(deckId);

  const [deck, setDeck] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadDeck();
    fetchEntries();
  }, [deckId]);

  const loadDeck = async () => {
    const deckData = await getDeck(deckId);
    if (!deckData) {
      error('Deck not found');
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
      error('Failed to delete deck');
    } else {
      success('Deck deleted');
      navigate('/');
    }
  };

  const handleDeleteEntry = async (entry) => {
    const { error: deleteError } = await deleteEntry(entry.id);
    if (deleteError) {
      error('Failed to delete entry');
    } else {
      success('Entry deleted');
    }
  };

  const handlePlayAudio = async (url) => {
    const audio = new Audio(url);
    await audio.play();
  };

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
      <div className="px-4 py-3 flex items-center justify-between bg-slate-900/50 border-b border-slate-800 sticky top-14 z-30 backdrop-blur-lg">
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
      <div className="px-4 py-3 flex items-center justify-between bg-slate-900/30 border-b border-slate-800">
        <div className="flex items-center gap-4 text-sm">
          <Badge>{entries.length} words</Badge>
          <Badge variant="primary">{deck.target_language?.toUpperCase()}</Badge>
        </div>
        <Link to="/add">
          <Button variant="secondary" size="sm">
            <Plus className="w-4 h-4" />
            Add
          </Button>
        </Link>
      </div>

      {/* Side-by-side layout on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-4 lg:p-4">
        {/* Constellation view */}
        <div className="lg:sticky lg:top-32 lg:h-[calc(100vh-10rem)]">
          <ConstellationView
            entries={entries}
            deckName={deck.name}
            deckColor={deck.color || '#10b981'}
          />
        </div>

        {/* Words list */}
        <div className="px-4 py-4 lg:px-0 space-y-4">
          {/* Progress stats */}
          {entries.length > 0 && (
            <div className="grid grid-cols-4 gap-3">
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

          {/* Entries list */}
          {loading ? (
            <div className="space-y-4">
              <EntryCardSkeleton />
              <EntryCardSkeleton />
              <EntryCardSkeleton />
            </div>
          ) : entries.length === 0 ? (
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
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3"
            >
              {entries.map((entry, index) => (
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
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>

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
