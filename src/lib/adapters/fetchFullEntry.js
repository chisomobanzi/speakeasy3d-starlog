/**
 * Full-entry fetchers for external dictionary sources.
 * Unlike the search adapters (capped at 5 flat results), these return
 * hierarchical data with all definitions grouped by part of speech.
 */

const FREE_DICT_API = 'https://api.dictionaryapi.dev/api/v2/entries';
const WIKTIONARY_API = 'https://en.wiktionary.org/api/rest_v1/page/definition';

const LANG_MAP = {
  en: 'English', pt: 'Portuguese', es: 'Spanish', fr: 'French',
  de: 'German', it: 'Italian', nl: 'Dutch', sv: 'Swedish',
  ru: 'Russian', ja: 'Japanese', zh: 'Chinese', ko: 'Korean',
  ar: 'Arabic', hi: 'Hindi', tr: 'Turkish', pl: 'Polish',
  vi: 'Vietnamese', th: 'Thai', id: 'Indonesian', ms: 'Malay',
  tl: 'Tagalog', sw: 'Swahili', la: 'Latin', el: 'Greek',
  he: 'Hebrew', fi: 'Finnish', no: 'Norwegian', da: 'Danish',
  cs: 'Czech', ro: 'Romanian', hu: 'Hungarian', uk: 'Ukrainian',
  ca: 'Catalan', hr: 'Croatian', sr: 'Serbian', bg: 'Bulgarian',
  sk: 'Slovak', sl: 'Slovenian', lt: 'Lithuanian', lv: 'Latvian',
  et: 'Estonian', ga: 'Irish', cy: 'Welsh', sn: 'Shona', ami: 'Amis',
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
 * Detect Wiktionary form-of definitions and extract the root word.
 */
function extractFormOf(htmlDef) {
  if (!htmlDef) return null;
  if (!htmlDef.includes('form-of-definition')) return null;
  const match = htmlDef.match(/form-of-definition-link[^>]*>.*?<a[^>]*>([^<]+)<\/a>/i);
  if (!match) return null;
  return {
    rootWord: match[1].trim(),
    inflection: stripHtml(htmlDef),
  };
}

/**
 * Fetch full entry from Free Dictionary API.
 * Returns all definitions grouped by part of speech.
 */
export async function fetchFullFreeDictionary(word, language = 'en') {
  if (language && language !== 'en') return null;

  const res = await fetch(`${FREE_DICT_API}/${language}/${encodeURIComponent(word)}`);
  if (!res.ok) return null;

  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) return null;

  const entry = data[0];
  const phonetic = entry.phonetic || entry.phonetics?.find(p => p.text)?.text || '';
  const audioUrl = entry.phonetics?.find(p => p.audio)?.audio || null;

  // Merge meanings across all response entries (rare but possible)
  const meaningsMap = new Map();
  for (const item of data) {
    for (const meaning of item.meanings || []) {
      const pos = meaning.partOfSpeech || 'other';
      if (!meaningsMap.has(pos)) {
        meaningsMap.set(pos, []);
      }
      for (const def of meaning.definitions || []) {
        meaningsMap.get(pos).push({
          definition: def.definition || '',
          example: def.example || '',
          synonyms: def.synonyms || [],
          antonyms: def.antonyms || [],
        });
      }
    }
  }

  const meanings = Array.from(meaningsMap.entries()).map(([partOfSpeech, definitions]) => ({
    partOfSpeech,
    definitions,
  }));

  return {
    word: entry.word || word,
    phonetic: phonetic.replace(/^\/?/, '').replace(/\/?$/, ''),
    audio_url: audioUrl,
    language,
    source_type: 'freeDictionary',
    contributor_name: 'Free Dictionary API',
    meanings,
  };
}

/**
 * Fetch full entry from Wiktionary REST API.
 * Returns all definitions grouped by part of speech.
 */
export async function fetchFullWiktionary(word, language = 'en') {
  const res = await fetch(`${WIKTIONARY_API}/${encodeURIComponent(word)}`, {
    headers: { 'Accept': 'application/json' },
  });
  if (!res.ok) return null;

  const data = await res.json();
  const targetLang = language ? LANG_MAP[language] : null;

  // Find matching language section
  let sections = null;
  let langName = targetLang;
  if (targetLang && data[targetLang]) {
    sections = data[targetLang];
  } else {
    // Fall back to first available language
    const firstKey = Object.keys(data)[0];
    if (firstKey) {
      sections = data[firstKey];
      langName = firstKey;
    }
  }

  if (!sections || !Array.isArray(sections)) return null;

  // Check if all definitions are form-of; if so, resolve the root word
  const allDefs = sections.flatMap(s => (s.definitions || []).map(d => d.definition || ''));
  const formOfs = allDefs.map(extractFormOf).filter(Boolean);

  // If every definition is a form-of, fetch the root word's full entry instead
  if (formOfs.length > 0 && formOfs.length === allDefs.filter(d => stripHtml(d)).length) {
    // Use the first root word found
    const rootWord = formOfs[0].rootWord;
    const inflectionNote = formOfs[0].inflection;

    try {
      const rootRes = await fetch(`${WIKTIONARY_API}/${encodeURIComponent(rootWord)}`, {
        headers: { 'Accept': 'application/json' },
      });
      if (rootRes.ok) {
        const rootData = await rootRes.json();
        const rootSections = rootData[langName];
        if (rootSections && Array.isArray(rootSections)) {
          const rootMeanings = rootSections
            .filter(section => section.definitions?.length > 0)
            .map(section => ({
              partOfSpeech: section.partOfSpeech || 'other',
              definitions: section.definitions
                .filter(def => !extractFormOf(def.definition || ''))
                .map(def => ({
                  definition: stripHtml(def.definition || ''),
                  example: (def.examples || []).map(ex => stripHtml(ex)).filter(Boolean).join(' | '),
                  synonyms: [],
                  antonyms: [],
                }))
                .filter(d => d.definition),
            }))
            .filter(m => m.definitions.length > 0);

          if (rootMeanings.length > 0) {
            return {
              word,
              phonetic: '',
              audio_url: null,
              language,
              source_type: 'wiktionary',
              contributor_name: 'Wiktionary',
              meanings: rootMeanings,
              rootWord,
              inflectionNote,
            };
          }
        }
      }
    } catch {
      // Fall through to regular output
    }
  }

  // Standard path: build meanings, marking form-of definitions with resolved text
  const rootWordsToFetch = new Map();
  const rawMeanings = sections
    .filter(section => section.definitions?.length > 0)
    .map(section => ({
      partOfSpeech: section.partOfSpeech || 'other',
      definitions: section.definitions.map(def => {
        const raw = def.definition || '';
        const formOf = extractFormOf(raw);
        if (formOf) {
          rootWordsToFetch.set(formOf.rootWord, langName);
        }
        return {
          definition: stripHtml(raw),
          example: (def.examples || []).map(ex => stripHtml(ex)).filter(Boolean).join(' | '),
          synonyms: [],
          antonyms: [],
          _formOf: formOf,
        };
      }).filter(d => d.definition),
    }))
    .filter(m => m.definitions.length > 0);

  // Resolve any form-of definitions to actual meanings
  if (rootWordsToFetch.size > 0) {
    const fetches = await Promise.allSettled(
      [...rootWordsToFetch.entries()].slice(0, 3).map(async ([rootWord, rootLang]) => {
        const rootRes = await fetch(`${WIKTIONARY_API}/${encodeURIComponent(rootWord)}`, {
          headers: { 'Accept': 'application/json' },
        });
        if (!rootRes.ok) return { rootWord, def: null };
        const rootData = await rootRes.json();
        const rootSections = rootData[rootLang];
        if (!rootSections) return { rootWord, def: null, example: '' };
        for (const section of rootSections) {
          for (const d of section.definitions || []) {
            if (extractFormOf(d.definition || '')) continue;
            const text = stripHtml(d.definition || '');
            if (text) {
              const example = (d.examples || []).map(ex => stripHtml(ex)).filter(Boolean).join(' | ');
              return { rootWord, def: text, example };
            }
          }
        }
        return { rootWord, def: null, example: '' };
      })
    );

    const rootDefMap = new Map();
    for (const outcome of fetches) {
      if (outcome.status === 'fulfilled' && outcome.value.def) {
        rootDefMap.set(outcome.value.rootWord, outcome.value);
      }
    }

    for (const meaning of rawMeanings) {
      for (const def of meaning.definitions) {
        if (def._formOf) {
          const resolved = rootDefMap.get(def._formOf.rootWord);
          if (resolved) {
            def.definition = `${resolved.def} (${def._formOf.inflection})`;
            if (!def.example && resolved.example) {
              def.example = resolved.example;
            }
          }
        }
      }
    }
  }

  // Clean up internal metadata
  const meanings = rawMeanings.map(m => ({
    ...m,
    definitions: m.definitions.map(({ _formOf, ...rest }) => rest),
  }));

  return {
    word,
    phonetic: '',
    audio_url: null,
    language,
    source_type: 'wiktionary',
    contributor_name: 'Wiktionary',
    meanings,
  };
}

const fullFetchers = {
  freeDictionary: fetchFullFreeDictionary,
  wiktionary: fetchFullWiktionary,
};

/**
 * Dispatcher: fetch full entry for an external source.
 * Returns null for built-in sources (personal, community).
 */
export async function fetchFullEntry(sourceId, word, language) {
  const fetcher = fullFetchers[sourceId];
  if (!fetcher) return null;

  try {
    return await fetcher(word, language);
  } catch {
    return null;
  }
}
