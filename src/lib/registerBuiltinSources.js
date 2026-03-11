/**
 * Register all built-in data sources with the source registry.
 * Import this module once at app startup (or in useConstellation).
 *
 * To add a new source:
 *   1. Write a fetch function that returns { language, taxonomy, vocabulary }
 *   2. Add a registerSource() call below
 *   3. That's it — the constellation will automatically use it
 */

import { registerSource } from './sourceRegistry';
import { fetchQuickSample } from './wiktionaryQuickSample';
import { fetchKlokahSample } from './klokahFetcher';

// ─── Klokah: Taiwan Indigenous Languages E-Park ───
// Priority 80 — preferred over Wiktionary for these languages
registerSource({
  id: 'klokah',
  name: 'Klokah 原住民族語言',
  description: 'Taiwan Council of Indigenous Peoples language e-learning platform. Verified vocabulary with Chinese and English translations.',
  url: 'https://web.klokah.tw',
  languages: [
    'ami', 'tay', 'xsy', 'ssf', 'sdq', 'bnn', 'pwn', 'dru',
    'trv', 'ckv', 'tsu', 'xnb', 'sxr', 'pyu', 'tao', 'szy',
  ],
  priority: 80,
  provenance: 'klokah',
  fetch: fetchKlokahSample,
});

// ─── Wiktionary: Multilingual wiki dictionary ───
// Priority 30 — universal fallback for any language with a Wiktionary presence
registerSource({
  id: 'wiktionary',
  name: 'Wiktionary',
  description: 'Collaborative multilingual dictionary. Fetches nouns, verbs, and adjectives from English Wiktionary with definitions.',
  url: 'https://en.wiktionary.org',
  languages: ['*'],
  priority: 30,
  provenance: 'dictionary',
  fetch: fetchQuickSample,
});

// ─────────────────────────────────────────────────
// ADD NEW SOURCES BELOW
// ─────────────────────────────────────────────────
//
// Example: Adding a Swahili dictionary
//
//   import { fetchSwahiliDict } from './sources/swahiliDict';
//   registerSource({
//     id: 'tuki',
//     name: 'TUKI Dictionary',
//     description: 'TUKI Kamusi ya Kiswahili—Kiingereza (Swahili-English dictionary)',
//     url: 'https://example.com/tuki',
//     languages: ['sw'],
//     priority: 70,
//     provenance: 'dictionary',
//     fetch: fetchSwahiliDict,
//   });
//
// Example: Adding JMdict for Japanese
//
//   import { fetchJMdict } from './sources/jmdict';
//   registerSource({
//     id: 'jmdict',
//     name: 'JMdict',
//     description: 'Japanese-Multilingual Dictionary (Jim Breen)',
//     url: 'https://www.edrdg.org/jmdict/j_jmdict.html',
//     languages: ['ja'],
//     priority: 70,
//     provenance: 'dictionary',
//     fetch: fetchJMdict,
//   });
