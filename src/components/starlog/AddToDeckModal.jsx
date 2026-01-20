import { useState, useEffect } from 'react';
import { Plus, Check } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { useDecks } from '../../hooks/useDecks';

export default function AddToDeckModal({
  isOpen,
  onClose,
  onSelect,
  selectedDeckId = null,
  showCreateOption = true,
}) {
  const { decks, loading, fetchDecks, createDeck } = useDecks();
  const [showCreate, setShowCreate] = useState(false);
  const [newDeckName, setNewDeckName] = useState('');
  const [newDeckLanguage, setNewDeckLanguage] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchDecks();
    }
  }, [isOpen, fetchDecks]);

  const handleCreateDeck = async () => {
    if (!newDeckName.trim() || !newDeckLanguage.trim()) return;

    setCreating(true);
    const { data, error } = await createDeck({
      name: newDeckName.trim(),
      target_language: newDeckLanguage.trim().toLowerCase(),
    });

    setCreating(false);

    if (!error && data) {
      onSelect(data.id);
      onClose();
      setShowCreate(false);
      setNewDeckName('');
      setNewDeckLanguage('');
    }
  };

  const handleSelect = (deckId) => {
    onSelect(deckId);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add to Deck"
      description="Choose a deck or create a new one"
    >
      {!showCreate ? (
        <div className="space-y-2">
          {loading ? (
            <div className="py-8 text-center text-slate-500">Loading decks...</div>
          ) : decks.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-slate-500 mb-4">You don't have any decks yet</p>
              {showCreateOption && (
                <Button variant="primary" onClick={() => setShowCreate(true)}>
                  Create your first deck
                </Button>
              )}
            </div>
          ) : (
            <>
              {decks.map((deck) => (
                <button
                  key={deck.id}
                  onClick={() => handleSelect(deck.id)}
                  className={`
                    w-full flex items-center justify-between p-3 rounded-lg transition-colors
                    ${selectedDeckId === deck.id
                      ? 'bg-starlog-500/20 border border-starlog-500/30'
                      : 'bg-slate-800/50 hover:bg-slate-800 border border-transparent'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                      style={{ backgroundColor: `${deck.color || '#10b981'}20` }}
                    >
                      {deck.icon || '📚'}
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-white">{deck.name}</p>
                      <p className="text-sm text-slate-500">
                        {deck.word_count || 0} words • {deck.target_language?.toUpperCase()}
                      </p>
                    </div>
                  </div>
                  {selectedDeckId === deck.id && (
                    <Check className="w-5 h-5 text-starlog-400" />
                  )}
                </button>
              ))}

              {showCreateOption && (
                <button
                  onClick={() => setShowCreate(true)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors text-slate-400 hover:text-white"
                >
                  <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center">
                    <Plus className="w-5 h-5" />
                  </div>
                  <span>Create new deck</span>
                </button>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <Input
            label="Deck Name"
            placeholder="e.g., Portuguese Basics"
            value={newDeckName}
            onChange={(e) => setNewDeckName(e.target.value)}
            autoFocus
          />
          <Input
            label="Target Language"
            placeholder="e.g., pt, sn, ami"
            value={newDeckLanguage}
            onChange={(e) => setNewDeckLanguage(e.target.value)}
            hint="Use language codes like 'pt' for Portuguese, 'sn' for Shona"
          />

          <div className="flex gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={() => {
                setShowCreate(false);
                setNewDeckName('');
                setNewDeckLanguage('');
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateDeck}
              loading={creating}
              disabled={!newDeckName.trim() || !newDeckLanguage.trim()}
              className="flex-1"
            >
              Create Deck
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
