import { supabase } from './supabase';

/**
 * Generate TTS audio for a single word.
 * Calls the shared generate-tts Supabase Edge Function.
 * @returns {Promise<string>} audioUrl
 */
export async function generateTTS(text, language, deckId) {
  const { data, error } = await supabase.functions.invoke('generate-tts', {
    body: { text, language, deckCode: deckId },
  });

  if (error) throw new Error(error.message || 'TTS generation failed');
  if (!data?.audioUrl) throw new Error('No audio URL returned');

  return data.audioUrl;
}

/**
 * Generate TTS for all entries missing audio_url in a deck.
 * @param {Array} entries - entries to process (will filter to those without audio_url)
 * @param {string} language - target language code
 * @param {string} deckId - deck UUID (used as deckCode for storage path)
 * @param {Function} progressCallback - called with { current, total, currentWord }
 * @returns {Promise<Array<{ entryId: string, audioUrl: string }>>}
 */
export async function generateDeckTTS(entries, language, deckId, progressCallback) {
  const missing = entries.filter(e => !e.audio_url);
  const results = [];

  for (let i = 0; i < missing.length; i++) {
    const entry = missing[i];
    progressCallback?.({ current: i + 1, total: missing.length, currentWord: entry.word });

    try {
      const audioUrl = await generateTTS(entry.word, language, deckId);
      results.push({ entryId: entry.id, audioUrl });
    } catch (err) {
      console.error(`TTS failed for "${entry.word}":`, err);
      // Skip failures, continue with next entry
    }
  }

  return results;
}

/**
 * Play audio from a URL.
 * @returns {HTMLAudioElement} the Audio instance (for pause control)
 */
export function playAudio(url) {
  const audio = new Audio(url);
  audio.play();
  return audio;
}
