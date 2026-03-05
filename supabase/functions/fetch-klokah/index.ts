import { corsHeaders } from '../_shared/cors.ts';

/**
 * Klokah API proxy edge function.
 *
 * Fetches vocabulary from Taiwan's Klokah indigenous language platform
 * (web.klokah.tw) and returns constellation-ready JSON.
 *
 * POST body: {
 *   dialect?: number,       // Klokah dialect ID (default 23 = Paiwan Northern)
 *   search_terms?: string[] // Chinese search terms (default ~30 common chars)
 * }
 *
 * Returns: { words: [...], meta: { dialect, total } }
 */

const KLOKAH_API = 'https://web.klokah.tw/api/multiSearchResult.php';

// Default search terms: ~30 common Chinese characters spanning semantic categories
const DEFAULT_SEARCH_TERMS = [
  '人', '水', '手', '口', '食', '大', '小', '日', '木', '地',
  '山', '魚', '鳥', '家', '走', '說', '看', '天', '花', '物',
  '身', '心', '火', '石', '草', '雨', '河', '衣', '刀', '耳',
];

// Klokah category number → SIL domain ID mapping
const KLOKAH_TO_SIL: Record<number, string> = {
  1: '2', 2: '2', 3: '2',           // Body → Person
  4: '5', 5: '5',                     // Clothing, Housing → Daily Life
  6: '6', 7: '6',                     // Transportation, Tools → Work
  8: '1',                             // Animals → Universe
  9: '1', 10: '1', 11: '1', 12: '1', // Plants, Nature, Weather, Geography → Universe
  13: '8', 14: '8', 15: '8',         // Time, Numbers, Colors → States
  16: '4', 17: '4', 18: '4',         // Family, Society, Religion → Social
  19: '5', 20: '5', 21: '5', 22: '5', // Food categories → Daily Life
  23: '7', 24: '3', 25: '3',         // Actions → Actions, Emotions/Thinking → Mind
  26: '7', 27: '6', 28: '6', 29: '7', 30: '6', // Daily activities, Work
  31: '9', 32: '9', 33: '9', 34: '9', 35: '9', 36: '9', // Grammar
};

// Chinese → English lookup for common terms (bundled to avoid extra API calls)
const ZH_EN_MAP: Record<string, string> = {
  '人': 'person', '水': 'water', '手': 'hand', '口': 'mouth', '食': 'food',
  '大': 'big', '小': 'small', '日': 'sun/day', '木': 'wood/tree', '地': 'earth/ground',
  '山': 'mountain', '魚': 'fish', '鳥': 'bird', '家': 'home/family', '走': 'walk',
  '說': 'speak', '看': 'look/see', '天': 'sky/day', '花': 'flower', '物': 'thing',
  '身': 'body', '心': 'heart/mind', '火': 'fire', '石': 'stone', '草': 'grass',
  '雨': 'rain', '河': 'river', '衣': 'clothing', '刀': 'knife', '耳': 'ear',
  '頭': 'head', '眼': 'eye', '腳': 'foot', '鼻': 'nose', '牙': 'tooth',
  '血': 'blood', '骨': 'bone', '肉': 'meat/flesh', '皮': 'skin', '毛': 'hair/fur',
  '吃': 'eat', '喝': 'drink', '睡': 'sleep', '坐': 'sit', '站': 'stand',
  '跑': 'run', '來': 'come', '去': 'go', '死': 'die', '生': 'live/birth',
  '好': 'good', '壞': 'bad', '多': 'many', '少': 'few', '長': 'long',
  '短': 'short', '重': 'heavy', '輕': 'light', '冷': 'cold', '熱': 'hot',
  '白': 'white', '黑': 'black', '紅': 'red', '黃': 'yellow', '綠': 'green',
  '藍': 'blue', '新': 'new', '舊': 'old', '男': 'male', '女': 'female',
  '父': 'father', '母': 'mother', '子': 'child', '兄': 'elder brother', '弟': 'younger brother',
  '姊': 'elder sister', '妹': 'younger sister', '夫': 'husband', '妻': 'wife', '友': 'friend',
  '狗': 'dog', '貓': 'cat', '牛': 'cow', '豬': 'pig', '雞': 'chicken',
  '蛇': 'snake', '蟲': 'insect', '鹿': 'deer', '猴': 'monkey', '熊': 'bear',
  '風': 'wind', '雲': 'cloud', '雪': 'snow', '月': 'moon/month', '星': 'star',
  '海': 'sea', '田': 'field', '林': 'forest', '土': 'soil', '沙': 'sand',
  '米': 'rice', '酒': 'alcohol', '鹽': 'salt', '糖': 'sugar', '油': 'oil',
  '刺': 'thorn', '根': 'root', '葉': 'leaf', '果': 'fruit', '種': 'seed',
  '路': 'road', '門': 'door', '窗': 'window', '床': 'bed', '桌': 'table',
  '碗': 'bowl', '鍋': 'pot', '繩': 'rope', '網': 'net', '布': 'cloth',
  '歌': 'song', '舞': 'dance', '夢': 'dream', '話': 'speech/word', '名': 'name',
  '年': 'year', '晚': 'evening', '早': 'morning', '今': 'today/now', '昨': 'yesterday',
  '一': 'one', '二': 'two', '三': 'three', '四': 'four', '五': 'five',
  '六': 'six', '七': 'seven', '八': 'eight', '九': 'nine', '十': 'ten',
  '百': 'hundred', '千': 'thousand', '萬': 'ten thousand',
  '我': 'I/me', '你': 'you', '他': 'he/him', '她': 'she/her', '我們': 'we/us',
  '是': 'is/am', '有': 'have', '不': 'not', '在': 'at/in', '這': 'this',
  '那': 'that', '什麼': 'what', '誰': 'who', '哪裡': 'where', '為什麼': 'why',
  '和': 'and', '的': 'of', '了': 'particle', '很': 'very', '也': 'also',
  '上': 'up/above', '下': 'down/below', '左': 'left', '右': 'right', '前': 'front',
  '後': 'back/behind', '裡': 'inside', '外': 'outside', '中': 'middle',
  '工': 'work', '農': 'farm', '獵': 'hunt', '織': 'weave', '打': 'hit/strike',
  '切': 'cut', '拿': 'take', '給': 'give', '送': 'send', '帶': 'carry/bring',
  '笑': 'laugh', '哭': 'cry', '怕': 'fear', '愛': 'love', '恨': 'hate',
  '想': 'think/miss', '知': 'know', '聽': 'listen/hear', '聞': 'smell', '摸': 'touch',
  '雷': 'thunder', '彩虹': 'rainbow', '霧': 'fog', '露': 'dew', '泉': 'spring (water)',
};

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

interface KlokahItem {
  text: string;
  chinese: string;
  class: string;
  order: string;
}

interface OutputWord {
  word: string;
  chinese: string;
  english: string | null;
  category: string;
  category_num: number;
  sil_domain: string;
}

/**
 * Parse Klokah XML response and extract vocabulary items.
 * Klokah returns XML with <vocabulary><item> elements.
 */
function parseKlokahXml(xml: string): KlokahItem[] {
  const items: KlokahItem[] = [];

  // Match each <item>...</item> block
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];

    const getText = (tag: string): string => {
      const tagMatch = block.match(new RegExp(`<${tag}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`));
      if (tagMatch) return tagMatch[1].trim();
      const simpleMatch = block.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`));
      return simpleMatch ? simpleMatch[1].trim() : '';
    };

    const text = getText('text');
    const chinese = getText('chinese');
    const cls = getText('class');
    const order = getText('order');

    if (text && chinese) {
      items.push({ text, chinese, class: cls, order });
    }
  }

  return items;
}

/**
 * Get English translation for a Chinese string.
 * Tries exact match first, then checks if any key is contained in the string.
 */
function getEnglish(chinese: string): string | null {
  // Exact match
  if (ZH_EN_MAP[chinese]) return ZH_EN_MAP[chinese];

  // Check if any mapped character appears in the Chinese string
  for (const [zh, en] of Object.entries(ZH_EN_MAP)) {
    if (chinese.includes(zh)) return en;
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const dialect: number = body.dialect ?? 23;
    const searchTerms: string[] = body.search_terms ?? DEFAULT_SEARCH_TERMS;

    const seen = new Set<string>();
    const words: OutputWord[] = [];

    for (const term of searchTerms) {
      try {
        const url = `${KLOKAH_API}?d=${dialect}&txt=${encodeURIComponent(term)}&type=vo`;
        const res = await fetch(url);

        if (!res.ok) {
          console.warn(`Klokah API error for "${term}": ${res.status}`);
          continue;
        }

        const xml = await res.text();
        const items = parseKlokahXml(xml);

        for (const item of items) {
          // Deduplicate by Paiwan word
          if (seen.has(item.text)) continue;
          seen.add(item.text);

          const categoryNum = parseInt(item.order, 10) || 0;
          const silDomain = KLOKAH_TO_SIL[categoryNum] || '9';
          const english = getEnglish(item.chinese);

          words.push({
            word: item.text,
            chinese: item.chinese,
            english,
            category: item.class,
            category_num: categoryNum,
            sil_domain: silDomain,
          });
        }
      } catch (err) {
        console.warn(`Error fetching term "${term}":`, err);
      }

      // Rate limit: 100ms between requests
      await sleep(100);
    }

    return new Response(
      JSON.stringify({
        words,
        meta: {
          dialect,
          total: words.length,
          search_terms_used: searchTerms.length,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Klokah fetch failed', details: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
