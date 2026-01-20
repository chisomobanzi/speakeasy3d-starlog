import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Play, Plus, MoreVertical, Edit, Trash2, Share2, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { useDecks } from '../hooks/useDecks';
import { useEntries } from '../hooks/useEntries';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import EntryCard from '../components/starlog/EntryCard';
import ReviewMode from '../components/starlog/ReviewMode';
import { EntryCardSkeleton } from '../components/ui/LoadingSpinner';
import { useToast } from '../components/ui/Toast';
import { ConfirmDialog } from '../components/ui/Modal';
import { getDueEntries, getReviewStats } from '../lib/srs';

export default function DeckDetailPage() {
  const { deckId } = useParams();
  const navigate = useNavigate();
  const { success, error } = useToast();

  const { getDeck, deleteDeck } = useDecks();
  const { entries, loading, fetchEntries, deleteEntry, updateSrsData } = useEntries(deckId);

  const [deck, setDeck] = useState(null);
  const [showReview, setShowReview] = useState(false);
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
  const dueEntries = getDueEntries(entries);

  if (!deck) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        <div className="h-20 bg-slate-800 rounded-xl animate-pulse" />
        <EntryCardSkeleton />
        <EntryCardSkeleton />
      </div>
    );
  }

  if (showReview) {
    return (
      <ReviewMode
        entries={dueEntries}
        onComplete={() => setShowReview(false)}
        onUpdateEntry={updateSrsData}
        onClose={() => setShowReview(false)}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link to="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ backgroundColor: `${deck.color || '#10b981'}20` }}
            >
              {deck.icon || <BookOpen style={{ color: deck.color || '#10b981' }} className="w-5 h-5" />}
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{deck.name}</h1>
              {deck.description && (
                <p className="text-sm text-slate-400">{deck.description}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats & Actions */}
      <Card className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Badge>{entries.length} words</Badge>
          <Badge variant="primary">{deck.target_language?.toUpperCase()}</Badge>
          {dueEntries.length > 0 && (
            <Badge variant="warning">{dueEntries.length} due</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {dueEntries.length > 0 && (
            <Button variant="primary" onClick={() => setShowReview(true)}>
              <Play className="w-4 h-4" />
              Review ({dueEntries.length})
            </Button>
          )}
          <Link to="/add">
            <Button variant="secondary">
              <Plus className="w-4 h-4" />
              Add Word
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 className="w-5 h-5" />
          </Button>
        </div>
      </Card>

      {/* Progress stats */}
      {entries.length > 0 && (
        <div className="grid grid-cols-4 gap-4">
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
            <p className="text-lg font-bold text-starlog-400">
              {Math.round(stats.averageMastery * 100)}%
            </p>
            <p className="text-xs text-slate-500">Avg Mastery</p>
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
          className="space-y-4"
        >
          {entries.map((entry, index) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
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
