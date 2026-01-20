import { useEffect, useState } from 'react';
import { Plus, BookOpen } from 'lucide-react';
import { useDecks } from '../../hooks/useDecks';
import DeckCard from './DeckCard';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Input, { Textarea } from '../ui/Input';
import { DeckCardSkeleton } from '../ui/LoadingSpinner';
import { useToast } from '../ui/Toast';
import { ConfirmDialog } from '../ui/Modal';

export default function DecksTab() {
  const { decks, loading, fetchDecks, createDeck, updateDeck, deleteDeck } = useDecks();
  const { success, error } = useToast();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    target_language: '',
    color: '#10b981',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchDecks();
  }, [fetchDecks]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      target_language: '',
      color: '#10b981',
    });
  };

  const handleCreate = async () => {
    if (!formData.name.trim() || !formData.target_language.trim()) {
      error('Please fill in the required fields');
      return;
    }

    setSaving(true);
    const { error: createError } = await createDeck({
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      target_language: formData.target_language.trim().toLowerCase(),
      color: formData.color,
    });

    setSaving(false);

    if (createError) {
      error('Failed to create deck');
    } else {
      success('Deck created!');
      setShowCreateModal(false);
      resetForm();
    }
  };

  const handleEdit = async () => {
    if (!selectedDeck) return;

    setSaving(true);
    const { error: updateError } = await updateDeck(selectedDeck.id, {
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      target_language: formData.target_language.trim().toLowerCase(),
      color: formData.color,
    });

    setSaving(false);

    if (updateError) {
      error('Failed to update deck');
    } else {
      success('Deck updated!');
      setShowEditModal(false);
      setSelectedDeck(null);
      resetForm();
    }
  };

  const handleDelete = async () => {
    if (!selectedDeck) return;

    setSaving(true);
    const { error: deleteError } = await deleteDeck(selectedDeck.id);
    setSaving(false);

    if (deleteError) {
      error('Failed to delete deck');
    } else {
      success('Deck deleted');
      setShowDeleteConfirm(false);
      setSelectedDeck(null);
    }
  };

  const openEditModal = (deck) => {
    setSelectedDeck(deck);
    setFormData({
      name: deck.name,
      description: deck.description || '',
      target_language: deck.target_language,
      color: deck.color || '#10b981',
    });
    setShowEditModal(true);
  };

  const openDeleteConfirm = (deck) => {
    setSelectedDeck(deck);
    setShowDeleteConfirm(true);
  };

  const colorOptions = [
    '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6',
    '#ec4899', '#f43f5e', '#f97316', '#eab308',
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">My Decks</h2>
          <p className="text-slate-400 text-sm">
            {decks.length} {decks.length === 1 ? 'deck' : 'decks'}
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus className="w-5 h-5" />
          New Deck
        </Button>
      </div>

      {/* Decks list */}
      {loading ? (
        <div className="space-y-4">
          <DeckCardSkeleton />
          <DeckCardSkeleton />
        </div>
      ) : decks.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-slate-700 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No decks yet</h3>
          <p className="text-slate-400 mb-4">
            Create your first deck to start building your vocabulary
          </p>
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            <Plus className="w-5 h-5" />
            Create Deck
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {decks.map(deck => (
            <DeckCard
              key={deck.id}
              deck={deck}
              onEdit={openEditModal}
              onDelete={openDeleteConfirm}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); resetForm(); }}
        title="Create New Deck"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setShowCreateModal(false); resetForm(); }}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreate} loading={saving}>
              Create Deck
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Deck Name"
            placeholder="e.g., Portuguese Basics"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
          />
          <Textarea
            label="Description (optional)"
            placeholder="What's this deck for?"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          />
          <Input
            label="Target Language"
            placeholder="e.g., pt, sn, ami"
            value={formData.target_language}
            onChange={(e) => setFormData(prev => ({ ...prev, target_language: e.target.value }))}
            hint="Use language codes like 'pt' for Portuguese"
            required
          />
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Color
            </label>
            <div className="flex gap-2">
              {colorOptions.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, color }))}
                  className={`
                    w-8 h-8 rounded-full transition-transform
                    ${formData.color === color ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110' : ''}
                  `}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setSelectedDeck(null); resetForm(); }}
        title="Edit Deck"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setShowEditModal(false); setSelectedDeck(null); resetForm(); }}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleEdit} loading={saving}>
              Save Changes
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Deck Name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          />
          <Textarea
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          />
          <Input
            label="Target Language"
            value={formData.target_language}
            onChange={(e) => setFormData(prev => ({ ...prev, target_language: e.target.value }))}
          />
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Color
            </label>
            <div className="flex gap-2">
              {colorOptions.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, color }))}
                  className={`
                    w-8 h-8 rounded-full transition-transform
                    ${formData.color === color ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110' : ''}
                  `}
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
        message={`Are you sure you want to delete "${selectedDeck?.name}"? This will also delete all entries in this deck. This action cannot be undone.`}
        confirmText="Delete"
        loading={saving}
      />
    </div>
  );
}
