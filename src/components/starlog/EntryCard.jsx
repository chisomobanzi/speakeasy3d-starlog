import { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, MoreVertical, Edit, Trash2, Copy, Volume2, Plus } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

export default function EntryCard({
  entry,
  onEdit,
  onDelete,
  onCopy,
  onPlay,
  showDeck = false,
  compact = false,
  className = '',
  sourceBadge = null,
  showSaveAction = false,
  onSave,
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handlePlay = async () => {
    if (!entry.audio_url) return;

    setIsPlaying(true);
    try {
      await onPlay?.(entry.audio_url);
    } finally {
      setIsPlaying(false);
    }
  };

  // Mastery color
  const getMasteryColor = (level) => {
    if (level >= 0.8) return 'text-green-400';
    if (level >= 0.5) return 'text-yellow-400';
    if (level >= 0.25) return 'text-orange-400';
    return 'text-slate-500';
  };

  if (compact) {
    return (
      <Card
        hover
        className={`flex items-center gap-3 ${className}`}
        onClick={() => onEdit?.(entry)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-white">{entry.word}</span>
            {entry.phonetic && (
              <span className="text-sm text-slate-500">/{entry.phonetic}/</span>
            )}
          </div>
          <p className="text-sm text-slate-400 truncate">{entry.translation}</p>
        </div>
        {entry.audio_url && (
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handlePlay(); }}>
            {isPlaying ? <Pause className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>
        )}
      </Card>
    );
  }

  return (
    <Card className={`relative ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg font-semibold text-white">{entry.word}</h3>
            {sourceBadge}
            {entry.phonetic && (
              <span className="text-slate-500">/{entry.phonetic}/</span>
            )}
            {entry.audio_url && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePlay}
                className="text-slate-400 hover:text-starlog-400"
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </Button>
            )}
          </div>
          <p className="text-starlog-400 font-medium">{entry.translation}</p>
        </div>

        {/* Actions */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowMenu(!showMenu)}
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
                onClick={() => { onEdit?.(entry); setShowMenu(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-white/5"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={() => { onCopy?.(entry); setShowMenu(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-white/5"
              >
                <Copy className="w-4 h-4" />
                Copy to deck
              </button>
              {showSaveAction && (
                <button
                  onClick={() => { onSave?.(entry); setShowMenu(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-green-400 hover:bg-green-500/10"
                >
                  <Plus className="w-4 h-4" />
                  Save to Deck
                </button>
              )}
              <button
                onClick={() => { onDelete?.(entry); setShowMenu(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Notes */}
      {entry.notes && (
        <p className="text-sm text-slate-400 mb-3">{entry.notes}</p>
      )}

      {/* Examples */}
      {entry.examples && entry.examples.length > 0 && (
        <div className="mb-3 space-y-1">
          {entry.examples.map((example, i) => (
            <p key={i} className="text-sm text-slate-500 italic">
              "{example}"
            </p>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-white/10">
        <div className="flex items-center gap-2">
          {entry.tags?.map((tag) => (
            <Badge key={tag} size="sm">{tag}</Badge>
          ))}
          {showDeck && entry.decks?.name && (
            <Badge variant="primary" size="sm">{entry.decks.name}</Badge>
          )}
        </div>

        {entry.srs_state === 'active' && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">Mastery:</span>
            <span className={getMasteryColor(entry.mastery_level)}>
              {Math.round((entry.mastery_level || 0) * 100)}%
            </span>
          </div>
        )}
      </div>

      {/* Source attribution */}
      {entry.contributor_name && (
        <div className="mt-2 pt-2 border-t border-white/5 text-xs text-slate-500">
          Learned from {entry.contributor_name}
          {entry.contributor_location && ` (${entry.contributor_location})`}
        </div>
      )}
    </Card>
  );
}
