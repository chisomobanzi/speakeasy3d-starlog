/**
 * AI-powered definition lookup using Claude API
 * Note: This calls a serverless function to keep API keys secure
 */

const AI_ENDPOINT = '/api/ai/define';

/**
 * Get an AI-generated definition for a word
 * @param {string} word - The word to define
 * @param {string} targetLanguage - The language of the word (e.g., 'pt', 'sn')
 * @param {string} nativeLanguage - The user's native language (default: 'en')
 * @returns {Promise<AIDefinition>}
 */
export async function getAIDefinition(word, targetLanguage, nativeLanguage = 'en') {
  try {
    const response = await fetch(AI_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        word,
        targetLanguage,
        nativeLanguage,
      }),
    });

    if (!response.ok) {
      throw new Error('AI lookup failed');
    }

    return await response.json();
  } catch (error) {
    console.error('AI definition error:', error);
    throw error;
  }
}

/**
 * @typedef {Object} AIDefinition
 * @property {string} word - The original word
 * @property {string} translation - The translation
 * @property {string} phonetic - Phonetic pronunciation
 * @property {string} partOfSpeech - Part of speech (noun, verb, etc.)
 * @property {string} notes - Additional context or cultural notes
 * @property {string[]} examples - Example sentences
 * @property {string[]} relatedWords - Related words
 */

/**
 * Language codes and their full names
 */
export const LANGUAGE_NAMES = {
  en: 'English',
  pt: 'Portuguese',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  zh: 'Chinese (Mandarin)',
  ja: 'Japanese',
  ko: 'Korean',
  ar: 'Arabic',
  hi: 'Hindi',
  sw: 'Swahili',
  sn: 'Shona',
  zu: 'Zulu',
  yo: 'Yoruba',
  ig: 'Igbo',
  ha: 'Hausa',
  ami: 'Amis',
  // Add more as needed
};

/**
 * Get the display name for a language code
 * @param {string} code - The language code
 * @returns {string} The language name or the code if not found
 */
export function getLanguageName(code) {
  return LANGUAGE_NAMES[code] || code;
}
