/**
 * Word lists for Bridge Mode mini-games.
 * Each word has: word, hint (pronunciation guide), difficulty (1-3), points.
 * Organized by target language.
 */

export const LANGUAGES = {
  en: { code: 'en', recognitionLang: 'en-US', name: 'English', flag: '🇬🇧' },
  zh: { code: 'zh', recognitionLang: 'zh-TW', name: '中文', flag: '🇹🇼' },
  es: { code: 'es', recognitionLang: 'es-ES', name: 'Español', flag: '🇪🇸' },
};

export const wordLists = {
  en: [
    // Difficulty 1 — common words (1 point)
    { word: 'cat', hint: 'kat', difficulty: 1, points: 1 },
    { word: 'dog', hint: 'dawg', difficulty: 1, points: 1 },
    { word: 'sun', hint: 'suhn', difficulty: 1, points: 1 },
    { word: 'moon', hint: 'moon', difficulty: 1, points: 1 },
    { word: 'book', hint: 'buk', difficulty: 1, points: 1 },
    { word: 'fish', hint: 'fish', difficulty: 1, points: 1 },
    { word: 'red', hint: 'red', difficulty: 1, points: 1 },
    { word: 'blue', hint: 'bloo', difficulty: 1, points: 1 },
    { word: 'happy', hint: 'HAP-ee', difficulty: 1, points: 1 },
    { word: 'water', hint: 'WAH-ter', difficulty: 1, points: 1 },
    { word: 'house', hint: 'hows', difficulty: 1, points: 1 },
    { word: 'tree', hint: 'tree', difficulty: 1, points: 1 },
    { word: 'hello', hint: 'heh-LOH', difficulty: 1, points: 1 },
    { word: 'green', hint: 'green', difficulty: 1, points: 1 },
    { word: 'music', hint: 'MYOO-zik', difficulty: 1, points: 1 },
    { word: 'star', hint: 'star', difficulty: 1, points: 1 },
    { word: 'fire', hint: 'FY-er', difficulty: 1, points: 1 },
    { word: 'open', hint: 'OH-pen', difficulty: 1, points: 1 },
    { word: 'rain', hint: 'rayn', difficulty: 1, points: 1 },
    { word: 'smile', hint: 'smyl', difficulty: 1, points: 1 },

    // Difficulty 2 — intermediate (2 points)
    { word: 'beautiful', hint: 'BYOO-tih-ful', difficulty: 2, points: 2 },
    { word: 'adventure', hint: 'ad-VEN-cher', difficulty: 2, points: 2 },
    { word: 'computer', hint: 'kum-PYOO-ter', difficulty: 2, points: 2 },
    { word: 'mountain', hint: 'MOWN-tin', difficulty: 2, points: 2 },
    { word: 'together', hint: 'tuh-GETH-er', difficulty: 2, points: 2 },
    { word: 'tomorrow', hint: 'tuh-MOR-oh', difficulty: 2, points: 2 },
    { word: 'delicious', hint: 'deh-LISH-us', difficulty: 2, points: 2 },
    { word: 'wonderful', hint: 'WUN-der-ful', difficulty: 2, points: 2 },
    { word: 'chocolate', hint: 'CHOK-lit', difficulty: 2, points: 2 },
    { word: 'butterfly', hint: 'BUT-er-fly', difficulty: 2, points: 2 },
    { word: 'important', hint: 'im-POR-tant', difficulty: 2, points: 2 },
    { word: 'remember', hint: 'ree-MEM-ber', difficulty: 2, points: 2 },

    // Difficulty 3 — advanced (3 points)
    { word: 'extraordinary', hint: 'ek-STROR-din-air-ee', difficulty: 3, points: 3 },
    { word: 'communication', hint: 'kuh-myoo-nih-KAY-shun', difficulty: 3, points: 3 },
    { word: 'pronunciation', hint: 'pruh-nun-see-AY-shun', difficulty: 3, points: 3 },
    { word: 'international', hint: 'in-ter-NASH-uh-nul', difficulty: 3, points: 3 },
    { word: 'congratulations', hint: 'kun-GRACH-oo-lay-shunz', difficulty: 3, points: 3 },
    { word: 'encyclopedia', hint: 'en-sy-kluh-PEE-dee-uh', difficulty: 3, points: 3 },
    { word: 'sophisticated', hint: 'suh-FIS-tih-kay-tid', difficulty: 3, points: 3 },
    { word: 'approximately', hint: 'uh-PROK-sih-mit-lee', difficulty: 3, points: 3 },
  ],

  zh: [
    // Difficulty 1 — basic characters/phrases (1 point)
    { word: '你好', hint: 'nǐ hǎo', difficulty: 1, points: 1 },
    { word: '謝謝', hint: 'xiè xie', difficulty: 1, points: 1 },
    { word: '再見', hint: 'zài jiàn', difficulty: 1, points: 1 },
    { word: '貓', hint: 'māo', difficulty: 1, points: 1 },
    { word: '狗', hint: 'gǒu', difficulty: 1, points: 1 },
    { word: '水', hint: 'shuǐ', difficulty: 1, points: 1 },
    { word: '大', hint: 'dà', difficulty: 1, points: 1 },
    { word: '小', hint: 'xiǎo', difficulty: 1, points: 1 },
    { word: '好', hint: 'hǎo', difficulty: 1, points: 1 },
    { word: '一', hint: 'yī', difficulty: 1, points: 1 },
    { word: '二', hint: 'èr', difficulty: 1, points: 1 },
    { word: '三', hint: 'sān', difficulty: 1, points: 1 },
    { word: '紅', hint: 'hóng', difficulty: 1, points: 1 },
    { word: '吃', hint: 'chī', difficulty: 1, points: 1 },
    { word: '魚', hint: 'yú', difficulty: 1, points: 1 },
    { word: '書', hint: 'shū', difficulty: 1, points: 1 },
    { word: '人', hint: 'rén', difficulty: 1, points: 1 },
    { word: '天', hint: 'tiān', difficulty: 1, points: 1 },
    { word: '月', hint: 'yuè', difficulty: 1, points: 1 },
    { word: '火', hint: 'huǒ', difficulty: 1, points: 1 },

    // Difficulty 2 — compound words (2 points)
    { word: '朋友', hint: 'péng yǒu', difficulty: 2, points: 2 },
    { word: '學習', hint: 'xué xí', difficulty: 2, points: 2 },
    { word: '老師', hint: 'lǎo shī', difficulty: 2, points: 2 },
    { word: '學生', hint: 'xué shēng', difficulty: 2, points: 2 },
    { word: '台灣', hint: 'tái wān', difficulty: 2, points: 2 },
    { word: '美麗', hint: 'měi lì', difficulty: 2, points: 2 },
    { word: '快樂', hint: 'kuài lè', difficulty: 2, points: 2 },
    { word: '電腦', hint: 'diàn nǎo', difficulty: 2, points: 2 },
    { word: '音樂', hint: 'yīn yuè', difficulty: 2, points: 2 },
    { word: '時間', hint: 'shí jiān', difficulty: 2, points: 2 },
    { word: '家庭', hint: 'jiā tíng', difficulty: 2, points: 2 },
    { word: '工作', hint: 'gōng zuò', difficulty: 2, points: 2 },

    // Difficulty 3 — advanced (3 points)
    { word: '圖書館', hint: 'tú shū guǎn', difficulty: 3, points: 3 },
    { word: '巧克力', hint: 'qiǎo kè lì', difficulty: 3, points: 3 },
    { word: '非常好', hint: 'fēi cháng hǎo', difficulty: 3, points: 3 },
    { word: '經驗', hint: 'jīng yàn', difficulty: 3, points: 3 },
    { word: '環境', hint: 'huán jìng', difficulty: 3, points: 3 },
    { word: '發展', hint: 'fā zhǎn', difficulty: 3, points: 3 },
    { word: '機會', hint: 'jī huì', difficulty: 3, points: 3 },
    { word: '成功', hint: 'chéng gōng', difficulty: 3, points: 3 },
  ],

  es: [
    // Difficulty 1 — basic words (1 point)
    { word: 'hola', hint: 'OH-lah', difficulty: 1, points: 1 },
    { word: 'gato', hint: 'GAH-toh', difficulty: 1, points: 1 },
    { word: 'perro', hint: 'PEH-rroh', difficulty: 1, points: 1 },
    { word: 'sol', hint: 'sohl', difficulty: 1, points: 1 },
    { word: 'luna', hint: 'LOO-nah', difficulty: 1, points: 1 },
    { word: 'agua', hint: 'AH-gwah', difficulty: 1, points: 1 },
    { word: 'casa', hint: 'KAH-sah', difficulty: 1, points: 1 },
    { word: 'rojo', hint: 'RROH-hoh', difficulty: 1, points: 1 },
    { word: 'azul', hint: 'ah-SOOL', difficulty: 1, points: 1 },
    { word: 'uno', hint: 'OO-noh', difficulty: 1, points: 1 },
    { word: 'dos', hint: 'dohs', difficulty: 1, points: 1 },
    { word: 'tres', hint: 'trehs', difficulty: 1, points: 1 },
    { word: 'bien', hint: 'byehn', difficulty: 1, points: 1 },
    { word: 'pan', hint: 'pahn', difficulty: 1, points: 1 },
    { word: 'leche', hint: 'LEH-cheh', difficulty: 1, points: 1 },
    { word: 'verde', hint: 'BEHR-deh', difficulty: 1, points: 1 },
    { word: 'grande', hint: 'GRAHN-deh', difficulty: 1, points: 1 },
    { word: 'feliz', hint: 'feh-LEES', difficulty: 1, points: 1 },
    { word: 'fuego', hint: 'FWEH-goh', difficulty: 1, points: 1 },
    { word: 'cielo', hint: 'SYEH-loh', difficulty: 1, points: 1 },

    // Difficulty 2 — intermediate (2 points)
    { word: 'ventana', hint: 'behn-TAH-nah', difficulty: 2, points: 2 },
    { word: 'corazón', hint: 'koh-rah-SOHN', difficulty: 2, points: 2 },
    { word: 'manzana', hint: 'mahn-SAH-nah', difficulty: 2, points: 2 },
    { word: 'escuela', hint: 'ehs-KWEH-lah', difficulty: 2, points: 2 },
    { word: 'hermoso', hint: 'ehr-MOH-soh', difficulty: 2, points: 2 },
    { word: 'pequeño', hint: 'peh-KEH-nyoh', difficulty: 2, points: 2 },
    { word: 'familia', hint: 'fah-MEE-lyah', difficulty: 2, points: 2 },
    { word: 'trabajo', hint: 'trah-BAH-hoh', difficulty: 2, points: 2 },
    { word: 'amigo', hint: 'ah-MEE-goh', difficulty: 2, points: 2 },
    { word: 'comida', hint: 'koh-MEE-dah', difficulty: 2, points: 2 },
    { word: 'ciudad', hint: 'syoo-DAHD', difficulty: 2, points: 2 },
    { word: 'estrella', hint: 'ehs-TREH-yah', difficulty: 2, points: 2 },

    // Difficulty 3 — advanced (3 points)
    { word: 'mariposa', hint: 'mah-ree-POH-sah', difficulty: 3, points: 3 },
    { word: 'biblioteca', hint: 'bee-blyoh-TEH-kah', difficulty: 3, points: 3 },
    { word: 'conocimiento', hint: 'koh-noh-see-MYEHN-toh', difficulty: 3, points: 3 },
    { word: 'extraordinario', hint: 'eks-trah-or-dee-NAH-ryoh', difficulty: 3, points: 3 },
    { word: 'comunicación', hint: 'koh-moo-nee-kah-SYOHN', difficulty: 3, points: 3 },
    { word: 'experiencia', hint: 'eks-peh-RYEHN-syah', difficulty: 3, points: 3 },
    { word: 'oportunidad', hint: 'oh-por-too-nee-DAHD', difficulty: 3, points: 3 },
    { word: 'felicidades', hint: 'feh-lee-see-DAH-dehs', difficulty: 3, points: 3 },
  ],
};

/**
 * Get a shuffled word queue for a language.
 * Words are ordered by difficulty (easy → hard) with shuffling within each tier.
 */
export function getWordQueue(lang) {
  const words = wordLists[lang];
  if (!words) return [];

  const shuffle = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const easy = shuffle(words.filter((w) => w.difficulty === 1));
  const medium = shuffle(words.filter((w) => w.difficulty === 2));
  const hard = shuffle(words.filter((w) => w.difficulty === 3));

  return [...easy, ...medium, ...hard];
}

/**
 * Check if a speech transcript matches a target word.
 */
export function matchesWord(transcript, targetWord, lang) {
  const t = transcript.toLowerCase().trim();
  const w = targetWord.toLowerCase().trim();

  if (lang === 'zh') {
    // Chinese: check if target characters appear in transcript
    return t.includes(w);
  }

  // English/Spanish: check if word appears in transcript
  // Also check individual words in transcript
  if (t.includes(w)) return true;
  return t.split(/\s+/).some((word) => word === w);
}
