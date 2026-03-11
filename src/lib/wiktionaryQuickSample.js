/**
 * Client-side vocabulary fetcher from Wiktionary for instant constellation population.
 *
 * Two-phase strategy:
 *   Phase 1 — Topical categories (fast, pre-classified)
 *     Fetch words from semantic categories like "English_terms_for_animals",
 *     "Spanish_terms_for_food", etc. These give us domain classification for free
 *     (the category IS the domain) and don't need individual definition lookups.
 *     Yields 1000+ words in seconds.
 *
 *   Phase 2 — POS categories with definitions (slower, richer)
 *     Fetch from nouns/verbs/adjectives categories with paginated results,
 *     look up definitions via REST API in parallel batches.
 *     Fills gaps and adds translation definitions.
 *
 * Targets 1500+ words per language.
 */

import { LANGUAGES } from './languages';
import { classifyByHeuristic } from './classifyDomain';
import { CANONICAL_SIL_DOMAINS } from './sil-domains';

const WIKI_API = 'https://en.wiktionary.org/w/api.php';
const WIKI_REST = 'https://en.wiktionary.org/api/rest_v1/page/definition';

// ─── Topical categories mapped to SIL domains ───
// Each entry: { category suffix, SIL domain id, fallback definition prefix }
// Category format: "{LanguageName}_{suffix}" e.g. "English_terms_for_animals"
const TOPICAL_CATEGORIES = [
  // Domain 1: Universe & Creation
  { suffix: 'terms_for_animals',             domain: '1', label: 'animal' },
  { suffix: 'terms_for_birds',               domain: '1', label: 'bird' },
  { suffix: 'terms_for_fish',                domain: '1', label: 'fish' },
  { suffix: 'terms_for_insects',             domain: '1', label: 'insect' },
  { suffix: 'terms_for_mammals',             domain: '1', label: 'mammal' },
  { suffix: 'terms_for_reptiles',            domain: '1', label: 'reptile' },
  { suffix: 'terms_for_plants',              domain: '1', label: 'plant' },
  { suffix: 'terms_for_trees',               domain: '1', label: 'tree' },
  { suffix: 'terms_for_flowers',             domain: '1', label: 'flower' },
  { suffix: 'terms_for_fruits',              domain: '1', label: 'fruit' },
  { suffix: 'terms_for_vegetables',          domain: '1', label: 'vegetable' },
  { suffix: 'terms_for_weather',             domain: '1', label: 'weather' },
  { suffix: 'terms_for_celestial_bodies',    domain: '1', label: 'celestial body' },
  { suffix: 'terms_for_landforms',           domain: '1', label: 'landform' },
  { suffix: 'terms_for_water',               domain: '1', label: 'water' },
  { suffix: 'terms_for_minerals',            domain: '1', label: 'mineral' },
  { suffix: 'terms_for_metals',              domain: '1', label: 'metal' },
  { suffix: 'terms_for_seasons',             domain: '1', label: 'season' },

  // Domain 2: Person
  { suffix: 'terms_for_body_parts',          domain: '2', label: 'body part' },
  { suffix: 'terms_for_diseases',            domain: '2', label: 'disease' },
  { suffix: 'terms_for_medicine',            domain: '2', label: 'medicine' },
  { suffix: 'terms_for_anatomy',             domain: '2', label: 'anatomy' },
  { suffix: 'terms_for_disabilities',        domain: '2', label: 'disability' },

  // Domain 3: Language & Thought
  { suffix: 'terms_for_emotions',            domain: '3', label: 'emotion' },
  { suffix: 'terms_for_feelings',            domain: '3', label: 'feeling' },
  { suffix: 'terms_for_colors',              domain: '3', label: 'color' },
  { suffix: 'terms_for_sounds',              domain: '3', label: 'sound' },
  { suffix: 'terms_for_musical_instruments', domain: '3', label: 'musical instrument' },
  { suffix: 'terms_for_music',               domain: '3', label: 'music' },
  { suffix: 'terms_for_arts',                domain: '3', label: 'art' },
  { suffix: 'terms_for_literature',          domain: '3', label: 'literature' },
  { suffix: 'terms_for_languages',           domain: '3', label: 'language' },

  // Domain 4: Social Behavior
  { suffix: 'terms_for_family_members',      domain: '4', label: 'family member' },
  { suffix: 'terms_for_religion',            domain: '4', label: 'religion' },
  { suffix: 'terms_for_government',          domain: '4', label: 'government' },
  { suffix: 'terms_for_law',                 domain: '4', label: 'law' },
  { suffix: 'terms_for_war',                 domain: '4', label: 'war' },
  { suffix: 'terms_for_weapons',             domain: '4', label: 'weapon' },
  { suffix: 'terms_for_titles',              domain: '4', label: 'title' },
  { suffix: 'terms_for_holidays',            domain: '4', label: 'holiday' },

  // Domain 5: Daily Life
  { suffix: 'terms_for_food',                domain: '5', label: 'food' },
  { suffix: 'terms_for_beverages',           domain: '5', label: 'beverage' },
  { suffix: 'terms_for_cooking',             domain: '5', label: 'cooking' },
  { suffix: 'terms_for_spices',              domain: '5', label: 'spice' },
  { suffix: 'terms_for_clothing',            domain: '5', label: 'clothing' },
  { suffix: 'terms_for_fabrics',             domain: '5', label: 'fabric' },
  { suffix: 'terms_for_furniture',           domain: '5', label: 'furniture' },
  { suffix: 'terms_for_rooms',               domain: '5', label: 'room' },
  { suffix: 'terms_for_buildings',           domain: '5', label: 'building' },
  { suffix: 'terms_for_vehicles',            domain: '5', label: 'vehicle' },
  { suffix: 'terms_for_tools',               domain: '5', label: 'tool' },

  // Domain 6: Work & Occupation
  { suffix: 'terms_for_occupations',         domain: '6', label: 'occupation' },
  { suffix: 'terms_for_professions',         domain: '6', label: 'profession' },
  { suffix: 'terms_for_business',            domain: '6', label: 'business' },
  { suffix: 'terms_for_agriculture',         domain: '6', label: 'agriculture' },
  { suffix: 'terms_for_money',               domain: '6', label: 'money' },
  { suffix: 'terms_for_currencies',          domain: '6', label: 'currency' },

  // Domain 7: Physical Actions
  { suffix: 'terms_for_sports',              domain: '7', label: 'sport' },
  { suffix: 'terms_for_games',               domain: '7', label: 'game' },
  { suffix: 'terms_for_dances',              domain: '7', label: 'dance' },

  // Domain 8: States
  { suffix: 'terms_for_shapes',              domain: '8', label: 'shape' },
  { suffix: 'terms_for_units_of_measure',    domain: '8', label: 'unit of measure' },
  { suffix: 'terms_for_time',                domain: '8', label: 'time' },
  { suffix: 'terms_for_numbers',             domain: '8', label: 'number' },
  { suffix: 'terms_for_days_of_the_week',    domain: '8', label: 'day' },
  { suffix: 'terms_for_months',              domain: '8', label: 'month' },
];

// POS categories for Phase 2
const POS_TARGETS = [
  { pos: 'nouns',      target: 400 },
  { pos: 'verbs',      target: 250 },
  { pos: 'adjectives', target: 150 },
];

// Language code → Wiktionary language name for categories
const LANG_NAME_MAP = {
  en: 'English', es: 'Spanish', fr: 'French', de: 'German', pt: 'Portuguese',
  it: 'Italian', nl: 'Dutch', sv: 'Swedish', ru: 'Russian', ja: 'Japanese',
  zh: 'Chinese', ko: 'Korean', ar: 'Arabic', hi: 'Hindi', tr: 'Turkish',
  pl: 'Polish', vi: 'Vietnamese', th: 'Thai', id: 'Indonesian', ms: 'Malay',
  tl: 'Tagalog', sw: 'Swahili', la: 'Latin', el: 'Greek', he: 'Hebrew',
  fi: 'Finnish', no: 'Norwegian', da: 'Danish', cs: 'Czech', ro: 'Romanian',
  hu: 'Hungarian', uk: 'Ukrainian', ca: 'Catalan', hr: 'Croatian', sr: 'Serbian',
  bg: 'Bulgarian', sk: 'Slovak', sl: 'Slovenian', lt: 'Lithuanian', lv: 'Latvian',
  et: 'Estonian', ga: 'Irish', cy: 'Welsh', sn: 'Shona',
};

// Words to skip — common function words and grammatical entries
const SKIP_WORDS = new Set([
  'a', 'an', 'the', 'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'shall', 'should',
  'may', 'might', 'can', 'could', 'must', 'need', 'dare', 'ought',
  'i', 'me', 'my', 'mine', 'we', 'us', 'our', 'ours',
  'you', 'your', 'yours', 'he', 'him', 'his', 'she', 'her', 'hers',
  'it', 'its', 'they', 'them', 'their', 'theirs',
  'this', 'that', 'these', 'those', 'who', 'whom', 'whose', 'which', 'what',
  'and', 'or', 'but', 'if', 'then', 'else', 'when', 'where', 'how', 'why',
  'not', 'no', 'yes', 'so', 'as', 'than', 'too', 'very', 'just',
  'in', 'on', 'at', 'to', 'for', 'of', 'with', 'from', 'by', 'about',
  'into', 'through', 'during', 'before', 'after', 'above', 'below',
  'between', 'under', 'over', 'up', 'down', 'out', 'off', 'again',
]);

function stripHtml(html) {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#039;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Fetch titles from a Wiktionary category with pagination support.
 * @param {string} category - Full category name
 * @param {number} limit - Max titles to return
 * @param {number} [pages=1] - Number of API pages to fetch (each up to 500)
 */
async function fetchCategoryTitles(category, limit = 500, pages = 1) {
  const allTitles = [];
  let cmcontinue = null;

  for (let page = 0; page < pages && allTitles.length < limit; page++) {
    const params = new URLSearchParams({
      action: 'query',
      list: 'categorymembers',
      cmtitle: `Category:${category}`,
      cmlimit: String(Math.min(500, limit - allTitles.length)),
      cmtype: 'page',
      cmprop: 'title',
      cmsort: 'timestamp',
      cmdir: 'older',
      format: 'json',
      origin: '*',
    });
    if (cmcontinue) params.set('cmcontinue', cmcontinue);

    try {
      const res = await fetch(`${WIKI_API}?${params}`);
      if (!res.ok) break;
      const data = await res.json();
      const members = data.query?.categorymembers || [];
      allTitles.push(...members.map(m => m.title).filter(t => !t.includes(':')));
      cmcontinue = data.continue?.cmcontinue;
      if (!cmcontinue) break; // no more pages
    } catch {
      break;
    }
  }

  return allTitles.slice(0, limit);
}

/**
 * Fetch an English definition for a word from Wiktionary REST API.
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

    let bestDef = null;

    for (const section of sections) {
      for (const def of section.definitions || []) {
        const raw = def.definition || '';
        if (raw.includes('form-of-definition')) continue;
        if (raw.includes('inflection of')) continue;
        if (raw.includes('plural of')) continue;
        if (raw.includes('past tense of')) continue;
        if (raw.includes('alternative spelling of')) continue;
        if (raw.includes('obsolete spelling of')) continue;
        if (raw.includes('archaic form of')) continue;
        if (raw.includes('dated form of')) continue;

        const text = stripHtml(raw);
        if (!text || text.length < 3) continue;
        if (/^see\s/i.test(text)) continue;
        if (/^used to\s/i.test(text)) continue;

        if (!bestDef) bestDef = text;
      }
    }

    return bestDef ? { definition: bestDef } : null;
  } catch {
    return null;
  }
}

/**
 * Fetch definitions for a batch of titles in parallel.
 */
async function fetchDefinitionBatch(titles, languageCode) {
  const results = await Promise.allSettled(
    titles.map(title =>
      fetchDefinition(title, languageCode).then(result =>
        result ? { title, ...result } : null
      )
    )
  );
  return results
    .filter(r => r.status === 'fulfilled' && r.value)
    .map(r => r.value);
}

/**
 * Phase 1: Fetch words from topical/semantic Wiktionary categories.
 * These words come pre-classified by domain (the category IS the domain).
 * No individual definition lookups needed — very fast.
 */
async function fetchTopicalWords(langName, seen) {
  const words = [];

  // Fetch all topical categories in parallel (batched to avoid overwhelming)
  const TOPICAL_BATCH = 10;
  for (let i = 0; i < TOPICAL_CATEGORIES.length; i += TOPICAL_BATCH) {
    const batch = TOPICAL_CATEGORIES.slice(i, i + TOPICAL_BATCH);

    const results = await Promise.allSettled(
      batch.map(({ suffix, domain, label }) => {
        const category = `${langName}_${suffix}`;
        return fetchCategoryTitles(category, 200, 1)
          .then(titles => ({ titles, domain, label }));
      })
    );

    for (const r of results) {
      if (r.status !== 'fulfilled') continue;
      const { titles, domain, label } = r.value;
      for (const title of titles) {
        const lower = title.toLowerCase();
        if (seen.has(lower) || SKIP_WORDS.has(lower)) continue;
        // Skip multi-word entries that are likely phrases
        if (title.split(/\s+/).length > 3) continue;
        seen.add(lower);

        words.push({
          id: `wikt-topical-${words.length}`,
          word: title,
          translation: label, // e.g. "animal", "body part", "food"
          domains: [domain],
          subDomain: null,
          source: 'wiktionary',
          connections: [],
        });
      }
    }
  }

  return words;
}

/**
 * Phase 2: Fetch words from POS categories with definition lookups.
 * Paginated to get deeper into categories. Slower but richer data.
 */
async function fetchPOSWords(langName, languageCode, seen, existingWords, onProgress) {
  const words = [];
  const BATCH_SIZE = 30;

  // Fetch titles from all POS categories in parallel, with pagination
  const categoryResults = await Promise.allSettled(
    POS_TARGETS.map(({ pos, target }) => {
      const category = `${langName}_${pos}`;
      // Fetch 2 pages (up to 1000 titles) to get plenty of candidates
      return fetchCategoryTitles(category, Math.ceil(target * 2), 2)
        .then(titles => ({ pos, target, titles }));
    })
  );

  // Build title queue
  const titleQueue = [];
  for (const result of categoryResults) {
    if (result.status !== 'fulfilled') continue;
    const { titles } = result.value;
    // Shuffle to avoid alphabetical bias
    const shuffled = titles.sort(() => Math.random() - 0.5);
    for (const title of shuffled) {
      const lower = title.toLowerCase();
      if (!seen.has(lower) && !SKIP_WORDS.has(lower)) {
        seen.add(lower);
        titleQueue.push(title);
      }
    }
  }

  // Fetch definitions in parallel batches
  const posTarget = POS_TARGETS.reduce((sum, p) => sum + p.target, 0);
  for (let i = 0; i < titleQueue.length && words.length < posTarget; i += BATCH_SIZE) {
    const batch = titleQueue.slice(i, i + BATCH_SIZE);
    const results = await fetchDefinitionBatch(batch, languageCode);

    for (const { title, definition } of results) {
      const { domain_id } = classifyByHeuristic(definition);

      words.push({
        id: `wikt-pos-${words.length}`,
        word: title,
        translation: definition,
        domains: [domain_id],
        subDomain: null,
        source: 'wiktionary',
        connections: [],
      });
    }

    if (onProgress) {
      onProgress({
        fetched: existingWords.length + words.length,
        total: existingWords.length + posTarget,
        words: [...existingWords, ...words],
      });
    }
  }

  return words;
}

/**
 * Fetch a rich sample of words for a language from Wiktionary.
 * Two-phase: topical categories (fast, pre-classified) then POS with definitions.
 *
 * @param {string} languageCode
 * @param {(progress: {fetched: number, total: number, words: Array}) => void} [onProgress]
 * @returns {Promise<{language, taxonomy, vocabulary}>}
 */
export async function fetchQuickSample(languageCode, onProgress) {
  const langName = LANG_NAME_MAP[languageCode] ||
    LANGUAGES.find(l => l.code === languageCode)?.name;
  if (!langName) return null;

  const seen = new Set();

  // Phase 1: Topical categories (fast — no definition lookups)
  const topicalWords = await fetchTopicalWords(langName, seen);

  if (onProgress && topicalWords.length > 0) {
    onProgress({
      fetched: topicalWords.length,
      total: topicalWords.length + 800, // estimate for phase 2
      words: [...topicalWords],
    });
  }

  // Phase 2: POS categories with definitions (slower, richer)
  const posWords = await fetchPOSWords(langName, languageCode, seen, topicalWords, onProgress);

  const allWords = [...topicalWords, ...posWords];

  // Re-number IDs
  allWords.forEach((w, i) => { w.id = `wikt-${languageCode}-${i}`; });

  if (allWords.length === 0) {
    // Ultimate fallback: try lemmas category
    const lemmaTitles = await fetchCategoryTitles(`${langName}_lemmas`, 300);
    const fallbackWords = [];
    for (const title of lemmaTitles) {
      if (!SKIP_WORDS.has(title.toLowerCase())) {
        fallbackWords.push({
          id: `wikt-${languageCode}-${fallbackWords.length}`,
          word: title,
          translation: '',
          domains: ['8'],
          subDomain: null,
          source: 'wiktionary',
          connections: [],
        });
      }
    }
    if (fallbackWords.length === 0) return null;
    return {
      language: { code: languageCode, name: langName },
      taxonomy: { name: langName, domains: CANONICAL_SIL_DOMAINS },
      vocabulary: fallbackWords,
    };
  }

  return {
    language: { code: languageCode, name: langName },
    taxonomy: { name: langName, domains: CANONICAL_SIL_DOMAINS },
    vocabulary: allWords,
  };
}
