/**
 * Client-side quick sample from Wiktionary for instant constellation population.
 * Fetches word titles from a category, grabs definitions in parallel,
 * classifies into SIL domains, and returns constellation-ready data.
 */

import { LANGUAGES } from './languages';
import { classifyByHeuristic } from './classifyDomain';

// Language code → Wiktionary category name
const CATEGORY_MAP = {
  en: 'English_lemmas', es: 'Spanish_lemmas', fr: 'French_lemmas',
  de: 'German_lemmas', pt: 'Portuguese_lemmas', it: 'Italian_lemmas',
  ja: 'Japanese_lemmas', zh: 'Chinese_lemmas', ko: 'Korean_lemmas',
  ru: 'Russian_lemmas', ar: 'Arabic_lemmas', hi: 'Hindi_lemmas',
  nl: 'Dutch_lemmas', sv: 'Swedish_lemmas', tr: 'Turkish_lemmas',
  pl: 'Polish_lemmas', vi: 'Vietnamese_lemmas', th: 'Thai_lemmas',
  id: 'Indonesian_lemmas', ms: 'Malay_lemmas', tl: 'Tagalog_lemmas',
  sw: 'Swahili_lemmas', la: 'Latin_lemmas', el: 'Greek_lemmas',
  he: 'Hebrew_lemmas', fi: 'Finnish_lemmas', no: 'Norwegian_lemmas',
  da: 'Danish_lemmas', cs: 'Czech_lemmas', ro: 'Romanian_lemmas',
  hu: 'Hungarian_lemmas', uk: 'Ukrainian_lemmas', ca: 'Catalan_lemmas',
  hr: 'Croatian_lemmas', sr: 'Serbian_lemmas', bg: 'Bulgarian_lemmas',
  sk: 'Slovak_lemmas', sl: 'Slovenian_lemmas', lt: 'Lithuanian_lemmas',
  lv: 'Latvian_lemmas', et: 'Estonian_lemmas', ga: 'Irish_lemmas',
  cy: 'Welsh_lemmas', sn: 'Shona_lemmas', ami: 'Amis_lemmas',
};

// Language code → language name for Wiktionary definition sections
const LANG_NAME_MAP = {
  en: 'English', es: 'Spanish', fr: 'French', de: 'German', pt: 'Portuguese',
  it: 'Italian', nl: 'Dutch', sv: 'Swedish', ru: 'Russian', ja: 'Japanese',
  zh: 'Chinese', ko: 'Korean', ar: 'Arabic', hi: 'Hindi', tr: 'Turkish',
  pl: 'Polish', vi: 'Vietnamese', th: 'Thai', id: 'Indonesian', ms: 'Malay',
  tl: 'Tagalog', sw: 'Swahili', la: 'Latin', el: 'Greek', he: 'Hebrew',
  fi: 'Finnish', no: 'Norwegian', da: 'Danish', cs: 'Czech', ro: 'Romanian',
  hu: 'Hungarian', uk: 'Ukrainian', ca: 'Catalan', hr: 'Croatian', sr: 'Serbian',
  bg: 'Bulgarian', sk: 'Slovak', sl: 'Slovenian', lt: 'Lithuanian', lv: 'Latvian',
  et: 'Estonian', ga: 'Irish', cy: 'Welsh', sn: 'Shona', ami: 'Amis',
};

const WIKI_API = 'https://en.wiktionary.org/w/api.php';
const WIKI_REST = 'https://en.wiktionary.org/api/rest_v1/page/definition';

// Default SIL domains (shared across all languages)
const SIL_DOMAINS = [
  { id: '1', name: 'Universe & Creation', short: 'Universe', expected: 320, angle: 0, color: '#4ECDC4' },
  { id: '2', name: 'Person', short: 'Person', expected: 280, angle: 40, color: '#FF6B8A' },
  { id: '3', name: 'Language & Thought', short: 'Mind', expected: 250, angle: 80, color: '#CE93D8' },
  { id: '4', name: 'Social Behavior', short: 'Social', expected: 380, angle: 120, color: '#FFB347' },
  { id: '5', name: 'Daily Life', short: 'Daily Life', expected: 300, angle: 160, color: '#7ED87E' },
  { id: '6', name: 'Work & Occupation', short: 'Work', expected: 340, angle: 200, color: '#A5D6A7' },
  { id: '7', name: 'Physical Actions', short: 'Actions', expected: 220, angle: 240, color: '#82B1FF' },
  { id: '8', name: 'States', short: 'States', expected: 200, angle: 280, color: '#FFAB91' },
  { id: '9', name: 'Grammar', short: 'Grammar', expected: 150, angle: 320, color: '#B0BEC5' },
];

const DOMAIN_ICONS = {
  '1': '\u{1F30D}', '2': '\u{1F9D1}', '3': '\u{1F4AD}', '4': '\u{1F91D}',
  '5': '\u{1F3E0}', '6': '\u{1F528}', '7': '\u{1F3C3}', '8': '\u{1F522}', '9': '\u{1F524}',
};

function stripHtml(html) {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#039;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Fetch ~200 lemma titles from a Wiktionary category (single API call).
 */
async function fetchCategoryTitles(languageCode, limit = 200) {
  const category = CATEGORY_MAP[languageCode];
  if (!category) return [];

  const params = new URLSearchParams({
    action: 'query',
    list: 'categorymembers',
    cmtitle: `Category:${category}`,
    cmlimit: String(limit),
    cmtype: 'page',
    cmprop: 'title',
    format: 'json',
    origin: '*',
  });

  const res = await fetch(`${WIKI_API}?${params}`);
  if (!res.ok) return [];

  const data = await res.json();
  const members = data.query?.categorymembers || [];
  return members
    .map(m => m.title)
    .filter(t => !t.includes(':'));  // Skip namespace pages
}

/**
 * Fetch an English definition for a word in a specific language from Wiktionary REST API.
 * The REST API keys sections by language CODE (e.g. 'es'), not name (e.g. 'Spanish').
 */
async function fetchDefinition(word, languageCode) {
  try {
    const res = await fetch(`${WIKI_REST}/${encodeURIComponent(word)}`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;

    const data = await res.json();
    const sections = data[languageCode];
    if (!sections || !Array.isArray(sections)) return null;

    for (const section of sections) {
      for (const def of section.definitions || []) {
        const raw = def.definition || '';
        if (raw.includes('form-of-definition')) continue;
        const text = stripHtml(raw);
        if (text && text.length > 2) return text;
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Fetch a quick sample of words for a language from Wiktionary.
 * Returns data in the shape expected by PublicConstellation.
 *
 * Strategy:
 * 1. Fetch 200 category titles (1 API call, instant)
 * 2. Fetch definitions in parallel batches of 15 (fast, ~2-3 seconds total)
 * 3. Classify each into SIL domains with heuristic
 * 4. Return constellation-ready data
 *
 * @param {string} languageCode
 * @param {(progress: {fetched: number, total: number, words: Array}) => void} [onProgress]
 * @returns {Promise<{language, taxonomy, vocabulary}>}
 */
export async function fetchQuickSample(languageCode, onProgress) {
  const langName = LANG_NAME_MAP[languageCode] || LANGUAGES.find(l => l.code === languageCode)?.name;
  if (!langName) return null;

  // Step 1: Get titles
  const titles = await fetchCategoryTitles(languageCode, 200);
  if (titles.length === 0) return null;

  // Step 2: Fetch definitions in parallel batches
  // REST API keys by language code, not name
  const BATCH_SIZE = 15;
  const words = [];
  const seen = new Set();

  for (let i = 0; i < titles.length && words.length < 150; i += BATCH_SIZE) {
    const batch = titles.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map(title => fetchDefinition(title, languageCode).then(def => ({ title, def })))
    );

    for (const r of results) {
      if (r.status !== 'fulfilled' || !r.value.def) continue;
      const { title, def } = r.value;
      if (seen.has(title)) continue;
      seen.add(title);

      const { domain_id } = classifyByHeuristic(def);

      words.push({
        id: `wikt-${languageCode}-${words.length}`,
        word: title,
        translation: def,
        domains: [domain_id],
        subDomain: null,
        source: 'wiktionary',
        connections: [],
      });
    }

    // Report progress after each batch
    if (onProgress) {
      onProgress({
        fetched: Math.min(i + BATCH_SIZE, titles.length),
        total: titles.length,
        words: [...words],
      });
    }
  }

  if (words.length === 0) return null;

  const domains = SIL_DOMAINS.map(d => ({
    id: d.id,
    name: d.name,
    nameLocal: d.short,
    color: d.color,
    icon: DOMAIN_ICONS[d.id] || '\u{2B50}',
    expected: d.expected,
    angle: d.angle,
  }));

  return {
    language: {
      code: languageCode,
      name: langName,
    },
    taxonomy: { name: langName, domains },
    vocabulary: words,
  };
}
