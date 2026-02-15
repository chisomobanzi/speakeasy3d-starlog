/**
 * Translation helper using MyMemory Translation API (free, no API key, CORS-friendly).
 */

const MYMEMORY_URL = 'https://api.mymemory.translated.net/get';

/**
 * Translate a single text string.
 * @param {string} text - Text to translate
 * @param {string} fromLang - Source language code (e.g. 'pt', 'es')
 * @param {string} toLang - Target language code (default 'en')
 * @returns {Promise<string|null>} Translated text or null on failure
 */
export async function translateText(text, fromLang, toLang = 'en') {
  if (!text || !fromLang || fromLang === toLang) return null;

  try {
    const params = new URLSearchParams({
      q: text,
      langpair: `${fromLang}|${toLang}`,
    });

    const res = await fetch(`${MYMEMORY_URL}?${params}`);
    if (!res.ok) return null;

    const data = await res.json();
    const translated = data?.responseData?.translatedText;

    // MyMemory returns the original text when it can't translate
    if (!translated || translated.toLowerCase() === text.toLowerCase()) return null;

    return translated;
  } catch {
    return null;
  }
}

/**
 * Translate an array of example strings in parallel.
 * @param {string[]} examples - Array of example sentences
 * @param {string} fromLang - Source language code
 * @param {string} toLang - Target language code (default 'en')
 * @returns {Promise<Map<string, string>>} Map of original text → translated text
 */
export async function translateExamples(examples, fromLang, toLang = 'en') {
  const map = new Map();
  if (!examples?.length || !fromLang || fromLang === toLang) return map;

  const results = await Promise.allSettled(
    examples.map(async (ex) => {
      const translation = await translateText(ex, fromLang, toLang);
      return { original: ex, translation };
    })
  );

  for (const result of results) {
    if (result.status === 'fulfilled' && result.value.translation) {
      map.set(result.value.original, result.value.translation);
    }
  }

  return map;
}
