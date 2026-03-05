/**
 * Client-side fetcher for Klokah (Taiwan indigenous language) vocabulary.
 * Calls the fetch-klokah edge function and transforms results into
 * constellation-ready data (same shape as wiktionaryQuickSample).
 */

import { supabase } from './supabase';
import { CANONICAL_SIL_DOMAINS } from './sil-domains';

// Klokah dialect IDs — one representative dialect per language
const DIALECT_MAP = {
  ami: 1,   // 南勢阿美語 (Nanshi Amis)
  tay: 6,   // 賽考利克泰雅語 (Squliq Atayal)
  xsy: 13,  // 賽夏語 (Saisiyat)
  ssf: 14,  // 邵語 (Thao)
  sdq: 16,  // 德固達雅賽德克語 (Tgdaya Seediq)
  bnn: 22,  // 郡群布農語 (Isbukun Bunun)
  pwn: 23,  // 東排灣語 (Eastern Paiwan)
  dru: 28,  // 霧台魯凱語 (Budai Rukai)
  trv: 33,  // 太魯閣語 (Truku)
  ckv: 34,  // 噶瑪蘭語 (Kavalan)
  tsu: 35,  // 鄒語 (Tsou)
  xnb: 36,  // 卡那卡那富語 (Kanakanavu)
  sxr: 37,  // 拉阿魯哇語 (Hla'alua)
  pyu: 38,  // 南王卑南語 (Nanwang Puyuma)
  tao: 42,  // 雅美語 (Yami / Tao)
  szy: 43,  // 撒奇萊雅語 (Sakizaya)
};

// Language info for building constellation response
const LANG_INFO = {
  ami: { name: 'Amis',        family: 'Austronesian' },
  tay: { name: 'Atayal',      family: 'Austronesian' },
  xsy: { name: 'Saisiyat',    family: 'Austronesian' },
  ssf: { name: 'Thao',        family: 'Austronesian' },
  sdq: { name: 'Seediq',      family: 'Austronesian' },
  bnn: { name: 'Bunun',       family: 'Austronesian' },
  pwn: { name: 'Paiwan',      family: 'Austronesian' },
  dru: { name: 'Rukai',       family: 'Austronesian' },
  trv: { name: 'Truku',       family: 'Austronesian' },
  ckv: { name: 'Kavalan',     family: 'Austronesian' },
  tsu: { name: 'Tsou',        family: 'Austronesian' },
  xnb: { name: 'Kanakanavu',  family: 'Austronesian' },
  sxr: { name: "Hla'alua",    family: 'Austronesian' },
  pyu: { name: 'Puyuma',      family: 'Austronesian' },
  tao: { name: 'Tao',         family: 'Austronesian' },
  szy: { name: 'Sakizaya',    family: 'Austronesian' },
};

/**
 * Fetch vocabulary from Klokah for a given language code.
 * Returns data in the same shape as fetchQuickSample from wiktionaryQuickSample.js.
 *
 * @param {string} languageCode - e.g. 'pwn' for Paiwan
 * @param {(progress: {fetched: number, total: number, words: Array}) => void} [onProgress]
 * @returns {Promise<{language, taxonomy, vocabulary} | null>}
 */
export async function fetchKlokahSample(languageCode, onProgress) {
  const dialect = DIALECT_MAP[languageCode];
  if (dialect === undefined) return null;

  const { data, error } = await supabase.functions.invoke('fetch-klokah', {
    body: { dialect },
  });

  if (error) {
    console.error('Klokah edge function error:', error);
    return null;
  }

  if (!data?.words || data.words.length === 0) return null;

  const vocabulary = data.words.map((w, index) => {
    // Build translation: Chinese + English where available
    const translation = w.english
      ? `${w.chinese} (${w.english})`
      : w.chinese;

    return {
      id: `klokah-${languageCode}-${index}`,
      word: w.word,
      translation,
      domains: [w.sil_domain],
      subDomain: null,
      source: 'klokah',
      connections: [],
    };
  });

  // Report progress (single batch since edge function does all the work)
  if (onProgress) {
    onProgress({
      fetched: vocabulary.length,
      total: vocabulary.length,
      words: vocabulary,
    });
  }

  const domains = CANONICAL_SIL_DOMAINS;

  const info = LANG_INFO[languageCode] || { name: languageCode, family: 'Austronesian' };

  return {
    language: {
      code: languageCode,
      name: info.name,
      family: info.family,
    },
    taxonomy: { name: info.name, domains },
    vocabulary,
  };
}
