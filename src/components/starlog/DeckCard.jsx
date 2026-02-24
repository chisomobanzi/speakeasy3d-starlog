import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, MoreVertical, Edit, Trash2, Share2, Volume2 } from 'lucide-react';
import { useState } from 'react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

export default function DeckCard({
  deck,
  onEdit,
  onDelete,
  onShare,
  onGenerateAudio,
  onReview,
  dueCount = 0,
  showActions = true,
  className = '',
}) {
  const [showMenu, setShowMenu] = useState(false);

  // Determine deck color
  const deckColor = deck.color || '#10b981';

  return (
    <Link to={`/decks/${deck.id}`}>
      <Card
        hover
        className={`relative overflow-hidden ${className}`}
      >
        {/* Color accent */}
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{ backgroundColor: deckColor }}
        />

        {/* Content */}
        <div className="pt-2">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Icon */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ backgroundColor: `${deckColor}20` }}
              >
                {deck.icon || <BookOpen style={{ color: deckColor }} className="w-6 h-6" />}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white truncate">{deck.name}</h3>
                {deck.description && (
                  <p className="text-sm text-slate-400 truncate">{deck.description}</p>
                )}
              </div>
            </div>

            {/* Actions */}
            {showActions && (
              <div className="relative" onClick={(e) => e.preventDefault()}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowMenu(!showMenu);
                  }}
                >
                  <MoreVertical className="w-5 h-5" />
                </Button>

                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute right-0 top-full mt-1 w-40 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden z-10"
                  >
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onEdit?.(deck);
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-white/5"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onShare?.(deck);
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-white/5"
                    >
                      <Share2 className="w-4 h-4" />
                      Share
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onGenerateAudio?.(deck);
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-white/5"
                    >
                      <Volume2 className="w-4 h-4" />
                      Generate Audio
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onDelete?.(deck);
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </motion.div>
                )}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3 mt-4">
            <Badge size="sm">
              {deck.word_count || 0} words
            </Badge>
            <Badge variant="primary" size="sm">
              {deck.target_language?.toUpperCase() || 'N/A'}
            </Badge>
            {deck.forked_from && (
              <Badge variant="info" size="sm">Forked</Badge>
            )}
            {dueCount > 0 && (
              <Badge
                variant="warning"
                size="sm"
                className="cursor-pointer"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onReview?.(deck); }}
              >
                {dueCount} due
              </Badge>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}

// Community deck variant
export function CommunityDeckCard({ deck, onFork, className = '' }) {
  return (
    <Card hover className={className}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white">{deck.name}</h3>
          {deck.description && (
            <p className="text-sm text-slate-400 mt-1">{deck.description}</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2">
          <Badge size="sm">{deck.word_count || 0} words</Badge>
          <Badge variant="primary" size="sm">
            {deck.language_code?.toUpperCase()}
          </Badge>
          {deck.is_featured && (
            <Badge variant="warning" size="sm">Featured</Badge>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>{deck.learner_count || 0} learners</span>
          <span>•</span>
          <span>{Math.round((deck.verified_percent || 0) * 100)}% verified</span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          {deck.profiles?.username && (
            <span>by @{deck.profiles.username}</span>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onFork?.(deck)}
        >
          Add to Library
        </Button>
      </div>
    </Card>
  );
}
