import { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { supabase } from '../../lib/supabase';
import { DOMAIN_ICONS } from '../../lib/constellation-adapter';

export default function SuggestWordModal({
  isOpen,
  onClose,
  languageCode,
  domains = [],
  onWordAdded,
}) {
  const [word, setWord] = useState('');
  const [translation, setTranslation] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!word.trim() || !translation.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const { data, error: rpcError } = await supabase.rpc('suggest_constellation_word', {
        p_language_code: languageCode,
        p_word: word.trim(),
        p_translation: translation.trim(),
        p_primary_domain: selectedDomain || null,
      });

      if (rpcError) throw rpcError;

      setSuccess(true);
      onWordAdded?.();

      // Reset after brief success display
      setTimeout(() => {
        setWord('');
        setTranslation('');
        setSelectedDomain('');
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to suggest word');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Suggest a Word"
      description="Add a word to this language's constellation"
      size="sm"
    >
      {success ? (
        <div className="text-center py-6">
          <div className="text-4xl mb-2">&#11088;</div>
          <p className="text-emerald-400 font-medium">Word added!</p>
          <p className="text-sm text-slate-500 mt-1">Your star is now in the constellation</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Word</label>
            <input
              type="text"
              value={word}
              onChange={(e) => setWord(e.target.value)}
              placeholder="e.g. zuva"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Translation</label>
            <input
              type="text"
              value={translation}
              onChange={(e) => setTranslation(e.target.value)}
              placeholder="e.g. sun, day"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">
              Domain <span className="text-slate-600">(optional)</span>
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {domains.map(d => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setSelectedDomain(d.id === selectedDomain ? '' : d.id)}
                  className={`px-2 py-1.5 rounded-lg text-xs text-left transition-colors ${
                    selectedDomain === d.id
                      ? 'bg-slate-700 border border-cyan-500/50 text-white'
                      : 'bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-white'
                  }`}
                >
                  {DOMAIN_ICONS[d.id]} {d.nameLocal}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={submitting}
              disabled={!word.trim() || !translation.trim()}
              className="flex-1 bg-cyan-600 hover:bg-cyan-500"
            >
              Add Star
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
