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

          const definition = stripHtml(def.definition || '');
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

            const definition = stripHtml(def.definition || '');
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
            });
          }
        }
      }
    }

    return results;
  } catch {
    return [];
  }
}
