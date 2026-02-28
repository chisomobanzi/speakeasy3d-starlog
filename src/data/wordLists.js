/**
 * Word lists for Bridge Mode mini-games.
 * Each word has: word, hint (pronunciation guide), difficulty (1-3), points.
 * Organized by target language.
 */

export const LANGUAGES = {
  en: { code: 'en', recognitionLang: 'en-US', name: 'English', flag: '🇬🇧' },
  zh: { code: 'zh', recognitionLang: 'zh-TW', name: '中文', flag: '🇹🇼' },
  ja: { code: 'ja', recognitionLang: 'ja-JP', name: '日本語', flag: '🇯🇵' },
  fr: { code: 'fr', recognitionLang: 'fr-FR', name: 'Français', flag: '🇫🇷' },
  pt: { code: 'pt', recognitionLang: 'pt-BR', name: 'Português', flag: '🇧🇷' },
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
    { word: '一', alt: ['1'], hint: 'yī', difficulty: 1, points: 1 },
    { word: '二', alt: ['2'], hint: 'èr', difficulty: 1, points: 1 },
    { word: '三', alt: ['3'], hint: 'sān', difficulty: 1, points: 1 },
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
    { word: 'uno', alt: ['1'], hint: 'OO-noh', difficulty: 1, points: 1 },
    { word: 'dos', alt: ['2'], hint: 'dohs', difficulty: 1, points: 1 },
    { word: 'tres', alt: ['3'], hint: 'trehs', difficulty: 1, points: 1 },
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

  ja: [
    // Difficulty 1 — basic words (1 point)
    // word = kanji/common form (what ASR returns), alt = hiragana (also accepted)
    { word: 'こんにちは', alt: [], hint: 'kon-ni-chi-wa', difficulty: 1, points: 1 },
    { word: 'ありがとう', alt: [], hint: 'a-ri-ga-tō', difficulty: 1, points: 1 },
    { word: 'さようなら', alt: [], hint: 'sa-yō-na-ra', difficulty: 1, points: 1 },
    { word: '猫', alt: ['ねこ','ネコ'], hint: 'ねこ neko', difficulty: 1, points: 1 },
    { word: '犬', alt: ['いぬ','イヌ'], hint: 'いぬ inu', difficulty: 1, points: 1 },
    { word: '水', alt: ['みず'], hint: 'みず mizu', difficulty: 1, points: 1 },
    { word: '山', alt: ['やま'], hint: 'やま yama', difficulty: 1, points: 1 },
    { word: '花', alt: ['はな'], hint: 'はな hana', difficulty: 1, points: 1 },
    { word: '空', alt: ['そら'], hint: 'そら sora', difficulty: 1, points: 1 },
    { word: '赤', alt: ['あか'], hint: 'あか aka', difficulty: 1, points: 1 },
    { word: '青', alt: ['あお'], hint: 'あお ao', difficulty: 1, points: 1 },
    { word: '火', alt: ['ひ'], hint: 'ひ hi', difficulty: 1, points: 1 },
    { word: '月', alt: ['つき'], hint: 'つき tsuki', difficulty: 1, points: 1 },
    { word: '星', alt: ['ほし'], hint: 'ほし hoshi', difficulty: 1, points: 1 },
    { word: '魚', alt: ['さかな'], hint: 'さかな sakana', difficulty: 1, points: 1 },
    { word: '食べる', alt: ['たべる'], hint: 'たべる taberu', difficulty: 1, points: 1 },
    { word: '飲む', alt: ['のむ'], hint: 'のむ nomu', difficulty: 1, points: 1 },
    { word: '大きい', alt: ['おおきい'], hint: 'おおきい ōkī', difficulty: 1, points: 1 },
    { word: '小さい', alt: ['ちいさい'], hint: 'ちいさい chīsai', difficulty: 1, points: 1 },
    { word: '一', alt: ['いち','1'], hint: 'いち ichi', difficulty: 1, points: 1 },

    // Difficulty 2 — compound words (2 points)
    { word: '友達', alt: ['ともだち'], hint: 'ともだち tomodachi', difficulty: 2, points: 2 },
    { word: '先生', alt: ['せんせい'], hint: 'せんせい sensē', difficulty: 2, points: 2 },
    { word: '学校', alt: ['がっこう'], hint: 'がっこう gakkō', difficulty: 2, points: 2 },
    { word: '電車', alt: ['でんしゃ'], hint: 'でんしゃ densha', difficulty: 2, points: 2 },
    { word: '音楽', alt: ['おんがく'], hint: 'おんがく ongaku', difficulty: 2, points: 2 },
    { word: '仕事', alt: ['しごと'], hint: 'しごと shigoto', difficulty: 2, points: 2 },
    { word: '家族', alt: ['かぞく'], hint: 'かぞく kazoku', difficulty: 2, points: 2 },
    { word: '楽しい', alt: ['たのしい'], hint: 'たのしい tanoshī', difficulty: 2, points: 2 },
    { word: '美しい', alt: ['うつくしい'], hint: 'うつくしい utsukushī', difficulty: 2, points: 2 },
    { word: 'おいしい', alt: ['美味しい'], hint: 'oishī', difficulty: 2, points: 2 },
    { word: '勉強', alt: ['べんきょう'], hint: 'べんきょう benkyō', difficulty: 2, points: 2 },
    { word: '日本語', alt: ['にほんご'], hint: 'にほんご nihongo', difficulty: 2, points: 2 },

    // Difficulty 3 — advanced (3 points)
    { word: '図書館', alt: ['としょかん'], hint: 'としょかん toshokan', difficulty: 3, points: 3 },
    { word: '病院', alt: ['びょういん'], hint: 'びょういん byōin', difficulty: 3, points: 3 },
    { word: '新幹線', alt: ['しんかんせん'], hint: 'しんかんせん shinkansen', difficulty: 3, points: 3 },
    { word: 'おめでとう', alt: [], hint: 'omedetō', difficulty: 3, points: 3 },
    { word: '経験', alt: ['けいけん'], hint: 'けいけん kēken', difficulty: 3, points: 3 },
    { word: '環境', alt: ['かんきょう'], hint: 'かんきょう kankyō', difficulty: 3, points: 3 },
    { word: '素晴らしい', alt: ['すばらしい'], hint: 'すばらしい subarashī', difficulty: 3, points: 3 },
    { word: '挑戦', alt: ['ちょうせん'], hint: 'ちょうせん chōsen', difficulty: 3, points: 3 },
  ],

  fr: [
    // Difficulty 1 — basic words (1 point)
    { word: 'bonjour', hint: 'bohn-ZHOOR', difficulty: 1, points: 1 },
    { word: 'merci', hint: 'mehr-SEE', difficulty: 1, points: 1 },
    { word: 'chat', hint: 'shah', difficulty: 1, points: 1 },
    { word: 'chien', hint: 'shee-EHN', difficulty: 1, points: 1 },
    { word: 'soleil', hint: 'soh-LAY', difficulty: 1, points: 1 },
    { word: 'lune', hint: 'lewn', difficulty: 1, points: 1 },
    { word: 'eau', hint: 'oh', difficulty: 1, points: 1 },
    { word: 'rouge', hint: 'roozh', difficulty: 1, points: 1 },
    { word: 'bleu', hint: 'bluh', difficulty: 1, points: 1 },
    { word: 'maison', hint: 'meh-ZOHN', difficulty: 1, points: 1 },
    { word: 'livre', hint: 'leevr', difficulty: 1, points: 1 },
    { word: 'pain', hint: 'pahn', difficulty: 1, points: 1 },
    { word: 'fleur', hint: 'fluhr', difficulty: 1, points: 1 },
    { word: 'arbre', hint: 'ahrbr', difficulty: 1, points: 1 },
    { word: 'vert', hint: 'vehr', difficulty: 1, points: 1 },
    { word: 'oui', hint: 'wee', difficulty: 1, points: 1 },
    { word: 'non', hint: 'nohn', difficulty: 1, points: 1 },
    { word: 'bon', hint: 'bohn', difficulty: 1, points: 1 },
    { word: 'feu', hint: 'fuh', difficulty: 1, points: 1 },
    { word: 'ciel', hint: 'see-EHL', difficulty: 1, points: 1 },

    // Difficulty 2 — intermediate (2 points)
    { word: 'papillon', hint: 'pah-pee-YOHN', difficulty: 2, points: 2 },
    { word: 'fenêtre', hint: 'fuh-NEHTR', difficulty: 2, points: 2 },
    { word: 'musique', hint: 'mew-ZEEK', difficulty: 2, points: 2 },
    { word: 'chocolat', hint: 'shoh-koh-LAH', difficulty: 2, points: 2 },
    { word: 'famille', hint: 'fah-MEE-yuh', difficulty: 2, points: 2 },
    { word: 'travail', hint: 'trah-VYE', difficulty: 2, points: 2 },
    { word: 'montagne', hint: 'mohn-TAH-nyuh', difficulty: 2, points: 2 },
    { word: 'étoile', hint: 'ay-TWAHL', difficulty: 2, points: 2 },
    { word: 'oiseau', hint: 'wah-ZOH', difficulty: 2, points: 2 },
    { word: 'voyage', hint: 'vwah-YAHZH', difficulty: 2, points: 2 },
    { word: 'jardin', hint: 'zhahr-DAHN', difficulty: 2, points: 2 },
    { word: 'fromage', hint: 'froh-MAHZH', difficulty: 2, points: 2 },

    // Difficulty 3 — advanced (3 points)
    { word: 'bibliothèque', hint: 'bee-blee-oh-TEHK', difficulty: 3, points: 3 },
    { word: 'extraordinaire', hint: 'eks-trah-or-dee-NEHR', difficulty: 3, points: 3 },
    { word: 'communication', hint: 'koh-mew-nee-kah-SYOHN', difficulty: 3, points: 3 },
    { word: 'félicitations', hint: 'fay-lee-see-tah-SYOHN', difficulty: 3, points: 3 },
    { word: 'environnement', hint: 'ahn-vee-rohn-MAHN', difficulty: 3, points: 3 },
    { word: 'développement', hint: 'day-vlohp-MAHN', difficulty: 3, points: 3 },
    { word: 'connaissance', hint: 'koh-neh-SAHNS', difficulty: 3, points: 3 },
    { word: 'compréhension', hint: 'kohm-pray-ahn-SYOHN', difficulty: 3, points: 3 },
  ],

  pt: [
    // Difficulty 1 — basic words (1 point)
    { word: 'olá', hint: 'oh-LAH', difficulty: 1, points: 1 },
    { word: 'obrigado', hint: 'oh-bree-GAH-doo', difficulty: 1, points: 1 },
    { word: 'gato', hint: 'GAH-too', difficulty: 1, points: 1 },
    { word: 'sol', hint: 'sow', difficulty: 1, points: 1 },
    { word: 'lua', hint: 'LOO-ah', difficulty: 1, points: 1 },
    { word: 'água', hint: 'AH-gwah', difficulty: 1, points: 1 },
    { word: 'casa', hint: 'KAH-zah', difficulty: 1, points: 1 },
    { word: 'livro', hint: 'LEE-vroo', difficulty: 1, points: 1 },
    { word: 'peixe', hint: 'PAY-shee', difficulty: 1, points: 1 },
    { word: 'verde', hint: 'VEHR-dee', difficulty: 1, points: 1 },
    { word: 'azul', hint: 'ah-ZOO', difficulty: 1, points: 1 },
    { word: 'um', alt: ['1'], hint: 'oong', difficulty: 1, points: 1 },
    { word: 'dois', alt: ['2'], hint: 'doysh', difficulty: 1, points: 1 },
    { word: 'três', alt: ['3'], hint: 'trehsh', difficulty: 1, points: 1 },
    { word: 'bom', hint: 'bohng', difficulty: 1, points: 1 },
    { word: 'fogo', hint: 'FOH-goo', difficulty: 1, points: 1 },
    { word: 'flor', hint: 'flohr', difficulty: 1, points: 1 },
    { word: 'sim', hint: 'seeng', difficulty: 1, points: 1 },
    { word: 'não', hint: 'nowng', difficulty: 1, points: 1 },
    { word: 'feliz', hint: 'feh-LEEZ', difficulty: 1, points: 1 },

    // Difficulty 2 — intermediate (2 points)
    { word: 'borboleta', hint: 'bor-boh-LEH-tah', difficulty: 2, points: 2 },
    { word: 'coração', hint: 'koh-rah-SOWNG', difficulty: 2, points: 2 },
    { word: 'janela', hint: 'zhah-NEH-lah', difficulty: 2, points: 2 },
    { word: 'escola', hint: 'ish-KOH-lah', difficulty: 2, points: 2 },
    { word: 'família', hint: 'fah-MEE-lyah', difficulty: 2, points: 2 },
    { word: 'trabalho', hint: 'trah-BAH-lyoo', difficulty: 2, points: 2 },
    { word: 'montanha', hint: 'mohn-TAH-nyah', difficulty: 2, points: 2 },
    { word: 'estrela', hint: 'ish-TREH-lah', difficulty: 2, points: 2 },
    { word: 'música', hint: 'MOO-zee-kah', difficulty: 2, points: 2 },
    { word: 'chocolate', hint: 'shoh-koh-LAH-chee', difficulty: 2, points: 2 },
    { word: 'amigo', hint: 'ah-MEE-goo', difficulty: 2, points: 2 },
    { word: 'bonito', hint: 'boh-NEE-too', difficulty: 2, points: 2 },

    // Difficulty 3 — advanced (3 points)
    { word: 'biblioteca', hint: 'bee-blee-oh-TEH-kah', difficulty: 3, points: 3 },
    { word: 'extraordinário', hint: 'ish-trah-or-dee-NAH-ryoo', difficulty: 3, points: 3 },
    { word: 'comunicação', hint: 'koh-moo-nee-kah-SOWNG', difficulty: 3, points: 3 },
    { word: 'parabéns', hint: 'pah-rah-BEHNGSH', difficulty: 3, points: 3 },
    { word: 'experiência', hint: 'ish-peh-ree-EHN-syah', difficulty: 3, points: 3 },
    { word: 'desenvolvimento', hint: 'deh-zehn-vol-vee-MEHN-too', difficulty: 3, points: 3 },
    { word: 'conhecimento', hint: 'koh-nyeh-see-MEHN-too', difficulty: 3, points: 3 },
    { word: 'oportunidade', hint: 'oh-por-too-nee-DAH-dee', difficulty: 3, points: 3 },
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
 * targetWord can be a string or a word entry object (with .word and optional .alt array).
 */
export function matchesWord(transcript, targetWord, lang) {
  const t = transcript.toLowerCase().trim();

  // Build list of accepted forms
  const primary = typeof targetWord === 'string' ? targetWord : targetWord.word;
  const alts = (typeof targetWord === 'object' && targetWord.alt) || [];
  const candidates = [primary, ...alts];

  if (lang === 'zh' || lang === 'ja') {
    // CJK: check if any accepted form appears in transcript
    return candidates.some((c) => t.includes(c.toLowerCase()));
  }

  // Alphabetic languages: check if word appears in transcript
  const words = t.split(/\s+/);
  return candidates.some((c) => {
    const w = c.toLowerCase();
    return t.includes(w) || words.some((word) => word === w);
  });
}
