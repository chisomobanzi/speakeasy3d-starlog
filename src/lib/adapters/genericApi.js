/**
 * Generic API adapter factory.
 * Creates a search function from user-provided adapter_config.
 *
 * Config shape (stored in source_registry.adapter_config):
 * {
 *   url: "https://api.example.com/search",
 *   queryParam: "q",            // query parameter name
 *   languageParam: "lang",      // optional language parameter name
 *   wordPath: "results[].word", // dot-path to word in response
 *   translationPath: "results[].definition",
 *   phoneticPath: "results[].phonetic",  // optional
 *   headers: { "X-Api-Key": "..." },     // optional
 * }
 */

/**
 * Resolve a dot-path on an object. Supports array notation like "results[].word".
 */
function resolvePath(obj, path) {
  if (!path || !obj) return undefined;
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current == null) return undefined;
    if (part.endsWith('[]')) {
      const key = part.slice(0, -2);
      current = current[key];
      // Array expansion happens at the caller level
      return current;
    }
    current = current[part];
  }
  return current;
}

/**
 * Extract items from response using a path that may contain [].
 * Returns an array of extracted values.
 */
function extractItems(response, path) {
  if (!path) return [];
  const arrayPart = path.indexOf('[]');
  if (arrayPart === -1) {
    // Simple path, wrap in array
    const val = resolvePath(response, path);
    return val != null ? [val] : [];
  }

  // Split at []
  const arrayPath = path.substring(0, arrayPart);
  const itemPath = path.substring(arrayPart + 3); // skip [].
  const arr = resolvePath(response, arrayPath);
  if (!Array.isArray(arr)) return [];

  return arr.map(item => itemPath ? resolvePath(item, itemPath) : item).filter(v => v != null);
}

/**
 * Create a search adapter from config.
 * @param {object} config - adapter_config from source_registry
 * @returns {Function} async (query, language, options) => results[]
 */
export function createGenericApiAdapter(config) {
  const { url, queryParam = 'q', languageParam, wordPath, translationPath, phoneticPath, headers = {} } = config;

  return async (query, language, options = {}) => {
    if (!url || !query) return [];

    try {
      const params = new URLSearchParams({ [queryParam]: query });
      if (languageParam && language) {
        params.set(languageParam, language);
      }

      const res = await fetch(`${url}?${params.toString()}`, {
        headers: { Accept: 'application/json', ...headers },
      });

      if (!res.ok) return [];
      const data = await res.json();

      const words = extractItems(data, wordPath);
      const translations = extractItems(data, translationPath);
      const phonetics = phoneticPath ? extractItems(data, phoneticPath) : [];

      const results = [];
      const count = Math.min(words.length, translations.length, 10);
      for (let i = 0; i < count; i++) {
        results.push({
          id: `generic:${query}:${i}`,
          word: String(words[i]),
          translation: String(translations[i]),
          phonetic: phonetics[i] ? String(phonetics[i]) : '',
          language: language || '',
          notes: '',
          tags: [],
          examples: [],
          audio_url: null,
          source_type: 'generic_api',
          contributor_name: '',
        });
      }

      return results;
    } catch {
      return [];
    }
  };
}
