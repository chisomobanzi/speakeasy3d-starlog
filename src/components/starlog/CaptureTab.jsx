import { useState } from 'react';
import { Plus, Mic, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Input, { Textarea } from '../ui/Input';
import Button from '../ui/Button';
import AudioRecorder from './AudioRecorder';
import AddToDeckModal from './AddToDeckModal';
import { useEntries } from '../../hooks/useEntries';
import { useDecks } from '../../hooks/useDecks';
import { useToast } from '../ui/Toast';
import { uploadAudio } from '../../lib/storage';
import { useAuth } from '../../hooks/useAuth';

export default function CaptureTab() {
  const { user } = useAuth();
  const { createEntry } = useEntries();
  const { decks, fetchDecks } = useDecks();
  const { success, error } = useToast();

  const [formData, setFormData] = useState({
    word: '',
    phonetic: '',
    translation: '',
    notes: '',
    tags: '',
    sourceType: 'conversation',
    contributorName: '',
    contributorLocation: '',
  });

  const [selectedDeckId, setSelectedDeckId] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [showDeckModal, setShowDeckModal] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedDeck = decks.find(d => d.id === selectedDeckId);

  const handleInputChange = (field) => (e) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const handleAudioSave = (blob) => {
    setAudioBlob(blob);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.word.trim() || !formData.translation.trim()) {
      error('Please fill in the word and translation');
      return;
    }

    if (!selectedDeckId) {
      setShowDeckModal(true);
      return;
    }

    setSaving(true);

    try {
      // Upload audio if present
      let audioUrl = null;
      if (audioBlob && user) {
        const uploadResult = await uploadAudio(audioBlob, user.id);
        if (uploadResult) {
          audioUrl = uploadResult.url;
        }
      }

      // Create entry
      const entryData = {
        deck_id: selectedDeckId,
        word: formData.word.trim(),
        phonetic: formData.phonetic.trim() || null,
        translation: formData.translation.trim(),
        language: selectedDeck?.target_language || 'unknown',
        notes: formData.notes.trim() || null,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        source_type: formData.sourceType,
        contributor_name: formData.contributorName.trim() || null,
        contributor_location: formData.contributorLocation.trim() || null,
        audio_url: audioUrl,
      };

      const { error: createError } = await createEntry(entryData);

      if (createError) {
        throw createError;
      }

      success('Entry added successfully!');

      // Reset form
      setFormData({
        word: '',
        phonetic: '',
        translation: '',
        notes: '',
        tags: '',
        sourceType: 'conversation',
        contributorName: '',
        contributorLocation: '',
      });
      setAudioBlob(null);
    } catch (err) {
      console.error('Error saving entry:', err);
      error('Failed to save entry. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Deck selector */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Add to deck
          </label>
          <button
            type="button"
            onClick={() => setShowDeckModal(true)}
            className="w-full flex items-center justify-between p-3 bg-slate-900/50 border border-slate-700 rounded-lg hover:border-slate-600 transition-colors"
          >
            {selectedDeck ? (
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${selectedDeck.color || '#10b981'}20` }}
                >
                  {selectedDeck.icon || '📚'}
                </div>
                <span className="text-white">{selectedDeck.name}</span>
              </div>
            ) : (
              <span className="text-slate-500">Select a deck...</span>
            )}
            <ChevronDown className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Core fields */}
        <Input
          label="Word or Phrase"
          placeholder="e.g., saudade"
          value={formData.word}
          onChange={handleInputChange('word')}
          required
        />

        <Input
          label="Phonetic (optional)"
          placeholder="e.g., sow-DAH-jee"
          value={formData.phonetic}
          onChange={handleInputChange('phonetic')}
        />

        <Input
          label="Translation"
          placeholder="e.g., longing, nostalgia"
          value={formData.translation}
          onChange={handleInputChange('translation')}
          required
        />

        <Textarea
          label="Notes (optional)"
          placeholder="Add context, usage notes, or personal memories..."
          value={formData.notes}
          onChange={handleInputChange('notes')}
          rows={3}
        />

        {/* Audio recorder */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Pronunciation (optional)
          </label>
          <AudioRecorder
            onSave={handleAudioSave}
            onCancel={() => setAudioBlob(null)}
          />
        </div>

        {/* Advanced options toggle */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          Advanced options
        </button>

        {/* Advanced fields */}
        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 overflow-hidden"
            >
              <Input
                label="Tags"
                placeholder="e.g., emotion, untranslatable, greeting"
                value={formData.tags}
                onChange={handleInputChange('tags')}
                hint="Separate with commas"
              />

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Where did you learn this?
                </label>
                <div className="flex flex-wrap gap-2">
                  {['conversation', 'song', 'book', 'movie', 'class', 'other'].map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, sourceType: type }))}
                      className={`
                        px-3 py-1.5 rounded-lg text-sm capitalize transition-colors
                        ${formData.sourceType === type
                          ? 'bg-starlog-500/20 text-starlog-400 border border-starlog-500/30'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                        }
                      `}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <Input
                label="Learned from (optional)"
                placeholder="e.g., Maria Silva"
                value={formData.contributorName}
                onChange={handleInputChange('contributorName')}
                hint="Name of the person who taught you this"
              />

              <Input
                label="Location (optional)"
                placeholder="e.g., Lisbon, Portugal"
                value={formData.contributorLocation}
                onChange={handleInputChange('contributorLocation')}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit button */}
        <Button
          type="submit"
          variant="primary"
          loading={saving}
          className="w-full py-4"
        >
          <Plus className="w-5 h-5" />
          Add to Dictionary
        </Button>
      </form>

      {/* Deck selection modal */}
      <AddToDeckModal
        isOpen={showDeckModal}
        onClose={() => setShowDeckModal(false)}
        onSelect={(deckId) => {
          setSelectedDeckId(deckId);
          fetchDecks();
        }}
        selectedDeckId={selectedDeckId}
      />
    </div>
  );
}
