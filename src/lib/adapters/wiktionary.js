/**
 * Wiktionary REST API adapter
 * https://en.wiktionary.org/api/rest_v1/
 * Multilingual, CORS-friendly, no API key needed.
 */

import { LANG_NAME_TO_CODE } from '../languages';

const API_BASE = 'https://en.wiktionary.org/api/rest_v1/page/definition';

// Map ISO codes to Wiktionary language section names
const LANG_MAP = {
  en: 'English',
  pt: 'Portuguese',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  nl: 'Dutch',
  sv: 'Swedish',
  ru: 'Russian',
  ja: 'Japanese',
  zh: 'Chinese',
  ko: 'Korean',
  ar: 'Arabic',
  hi: 'Hindi',
  tr: 'Turkish',
  pl: 'Polish',
  vi: 'Vietnamese',
  th: 'Thai',
  id: 'Indonesian',
  ms: 'Malay',
  tl: 'Tagalog',
  sw: 'Swahili',
  la: 'Latin',
  el: 'Greek',
  he: 'Hebrew',
  fi: 'Finnish',
  no: 'Norwegian',
  da: 'Danish',
  cs: 'Czech',
  ro: 'Romanian',
  hu: 'Hungarian',
  uk: 'Ukrainian',
  ca: 'Catalan',
  hr: 'Croatian',
  sr: 'Serbian',
  bg: 'Bulgarian',
  sk: 'Slovak',
  sl: 'Slovenian',
  lt: 'Lithuanian',
  lv: 'Latvian',
  et: 'Estonian',
  ga: 'Irish',
  cy: 'Welsh',
  sn: 'Shona',
  ami: 'Amis',
};

function stripHtml(html) {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Detect Wiktionary "form-of" definitions (e.g. "first-person singular present indicative of vender")
 * and extract the root word from the HTML link before stripping.
 */
function extractFormOf(htmlDef) {
  if (!htmlDef) return null;
  // Wiktionary wraps form-of definitions in <span class="form-of-definition ...">
  if (!htmlDef.includes('form-of-definition')) return null;
  // Extract root word from the form-of-definition-link span's inner <a> tag
  const match = htmlDef.match(/form-of-definition-link[^>]*>.*?<a[^>]*>([^<]+)<\/a>/i);
  if (!match) return null;
  return {
    rootWord: match[1].trim(),
    inflection: stripHtml(htmlDef),
  };
}

/**
 * Fetch the first real (non-form-of) definitions for a root word
 * from a specific Wiktionary language section.
 */
async function fetchRootDefinitions(rootWord, langName) {
  try {
    const res = await fetch(`${API_BASE}/${encodeURIComponent(rootWord)}`, {
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) return [];

    const data = await res.json();
    const sections = data[langName];
    if (!sections || !Array.isArray(sections)) return [];

    const defs = [];
    for (const section of sections) {
      for (const def of section.definitions || []) {
        const raw = def.definition || '';
        // Skip nested form-of definitions
        if (extractFormOf(raw)) continue;
        const text = stripHtml(raw);
        if (text) {
          defs.push(text);
          if (defs.length >= 2) return defs;
        }
      }
    }
    return defs;
  } catch {
    return [];
  }
}

export async function searchWiktionary(query, language = 'en') {
  try {
    const res = await fetch(`${API_BASE}/${encodeURIComponent(query)}`, {
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) return [];

    const data = await res.json();

    // Wiktionary groups definitions by language
    const targetLang = language ? LANG_MAP[language] : null;
    const allLanguages = !targetLang;
    const maxTotal = allLanguages ? 15 : 5;
    const maxPerLang = allLanguages ? 3 : 5;
    const results = [];

    for (const [lang, definitions] of Object.entries(data)) {
      // If we have a target language, only include matching section
      if (targetLang && lang !== targetLang) continue;
      if (results.length >= maxTotal) break;

      const langCode = allLanguages ? (LANG_NAME_TO_CODE[lang] || language) : language;
      let langCount = 0;

      for (const section of definitions) {
        if (results.length >= maxTotal || langCount >= maxPerLang) break;

        const partOfSpeech = section.partOfSpeech || '';

        for (const def of section.definitions || []) {
          if (results.length >= maxTotal || langCount >= maxPerLang) break;

          const rawHtml = def.definition || '';
          const formOf = extractFormOf(rawHtml);
          const definition = stripHtml(rawHtml);
          if (!definition) continue;

          const examples = (def.examples || [])
            .map(ex => stripHtml(ex))
            .filter(Boolean)
            .slice(0, 2);

          results.push({
            id: `wiktionary:${query}:${results.length}`,
            word: query,
            phonetic: '',
            translation: definition,
            language: langCode,
            notes: '',
            tags: partOfSpeech ? [partOfSpeech] : [],
            examples,
            audio_url: null,
            source_type: 'wiktionary',
            contributor_name: 'Wiktionary',
            _formOf: formOf ? { ...formOf, langName: lang } : null,
          });
          langCount++;
        }
      }
    }

    // If no results for target language, try without language filter
    if (results.length === 0 && targetLang) {
      for (const [lang, definitions] of Object.entries(data)) {
        if (results.length >= 5) break;

        const langCode = LANG_NAME_TO_CODE[lang] || language;

        for (const section of definitions) {
          if (results.length >= 5) break;

          const partOfSpeech = section.partOfSpeech || '';

          for (const def of section.definitions || []) {
            if (results.length >= 5) break;

            const rawHtml = def.definition || '';
            const formOf = extractFormOf(rawHtml);
            const definition = stripHtml(rawHtml);
            if (!definition) continue;

            const examples = (def.examples || [])
              .map(ex => stripHtml(ex))
              .filter(Boolean)
              .slice(0, 2);

            results.push({
              id: `wiktionary:${query}:${results.length}`,
              word: query,
              phonetic: '',
              translation: definition,
              language: langCode,
              notes: '',
              tags: partOfSpeech ? [partOfSpeech] : [],
              examples,
              audio_url: null,
              source_type: 'wiktionary',
              contributor_name: 'Wiktionary',
              _formOf: formOf ? { ...formOf, langName: lang } : null,
            });
          }
        }
      }
    }

    // Auto-resolve form-of definitions to actual root word meanings
    const formOfEntries = results.filter(r => r._formOf);
    if (formOfEntries.length > 0) {
      // Collect unique (rootWord, langName) pairs, limit to 3 fetches
      const toFetch = new Map();
      for (const entry of formOfEntries) {
        const key = `${entry._formOf.rootWord}:${entry._formOf.langName}`;
        if (!toFetch.has(key) && toFetch.size < 3) {
          toFetch.set(key, entry._formOf);
        }
      }

      const fetches = await Promise.allSettled(
        [...toFetch.entries()].map(async ([key, { rootWord, langName }]) => ({
          key,
          defs: await fetchRootDefinitions(rootWord, langName),
        }))
      );

      const rootDefMap = new Map();
      for (const outcome of fetches) {
        if (outcome.status === 'fulfilled' && outcome.value.defs.length > 0) {
          rootDefMap.set(outcome.value.key, outcome.value.defs);
        }
      }

      for (const entry of results) {
        if (entry._formOf) {
          const key = `${entry._formOf.rootWord}:${entry._formOf.langName}`;
          const rootDefs = rootDefMap.get(key);
          if (rootDefs) {
            entry.notes = entry._formOf.inflection;
            entry.translation = rootDefs[0];
          }
        }
      }
    }

    // Clean up internal metadata
    for (const entry of results) {
      delete entry._formOf;
    }

    return results;
  } catch {
    return [];
  }
}
