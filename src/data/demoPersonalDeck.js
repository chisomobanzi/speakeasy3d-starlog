// Demo personal Amis deck with ~150 words and SRS progress
// Shows what an active learning deck looks like

export const DEMO_AMIS_DECK = {
  id: 'demo-amis-personal',
  user_id: 'dev-user-123',
  name: 'My Amis Journey',
  description: 'Personal vocabulary collection from learning Amis with the Pangcah coastal community',
  target_language: 'ami',
  color: '#0ea5e9',
  word_count: 156,
  forked_from: 'amis-coastal',
  created_at: '2024-09-15T10:30:00Z',
  updated_at: new Date().toISOString(),
};

// Helper to generate varied SRS states
function generateSrsData(masteryBucket) {
  const now = new Date();

  switch (masteryBucket) {
    case 'mastered':
      return {
        srs_state: 'active',
        mastery_level: 0.85 + Math.random() * 0.15,
        streak: 8 + Math.floor(Math.random() * 10),
        review_count: 15 + Math.floor(Math.random() * 20),
        next_review_at: new Date(now.getTime() + (7 + Math.random() * 14) * 24 * 60 * 60 * 1000).toISOString(),
        last_reviewed_at: new Date(now.getTime() - Math.random() * 5 * 24 * 60 * 60 * 1000).toISOString(),
      };
    case 'learning':
      return {
        srs_state: 'active',
        mastery_level: 0.4 + Math.random() * 0.35,
        streak: 2 + Math.floor(Math.random() * 5),
        review_count: 5 + Math.floor(Math.random() * 10),
        next_review_at: new Date(now.getTime() + (1 + Math.random() * 3) * 24 * 60 * 60 * 1000).toISOString(),
        last_reviewed_at: new Date(now.getTime() - Math.random() * 2 * 24 * 60 * 60 * 1000).toISOString(),
      };
    case 'struggling':
      return {
        srs_state: 'active',
        mastery_level: 0.15 + Math.random() * 0.25,
        streak: 0,
        review_count: 8 + Math.floor(Math.random() * 5),
        next_review_at: new Date(now.getTime() - Math.random() * 2 * 24 * 60 * 60 * 1000).toISOString(), // overdue
        last_reviewed_at: new Date(now.getTime() - (2 + Math.random() * 3) * 24 * 60 * 60 * 1000).toISOString(),
      };
    case 'due':
      return {
        srs_state: 'active',
        mastery_level: 0.5 + Math.random() * 0.3,
        streak: 3 + Math.floor(Math.random() * 4),
        review_count: 6 + Math.floor(Math.random() * 8),
        next_review_at: new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000).toISOString(), // due today or yesterday
        last_reviewed_at: new Date(now.getTime() - (3 + Math.random() * 4) * 24 * 60 * 60 * 1000).toISOString(),
      };
    case 'new':
    default:
      return {
        srs_state: 'new',
        mastery_level: 0,
        streak: 0,
        review_count: 0,
        next_review_at: null,
        last_reviewed_at: null,
      };
  }
}

// Generate entries with proper distribution
// ~30% mastered, ~35% learning, ~15% due, ~10% struggling, ~10% new
const srsDistribution = [
  ...Array(47).fill('mastered'),
  ...Array(55).fill('learning'),
  ...Array(23).fill('due'),
  ...Array(16).fill('struggling'),
  ...Array(15).fill('new'),
];

// Shuffle the distribution
for (let i = srsDistribution.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [srsDistribution[i], srsDistribution[j]] = [srsDistribution[j], srsDistribution[i]];
}

const amisVocabulary = [
  // Greetings & Social (15)
  { word: 'nga\'ay ho', translation: 'hello/how are you', phonetic: 'ngaʔay ho', tags: ['greeting', 'essential'], notes: 'Most common greeting, can be used any time of day' },
  { word: 'nga\'ay ho kiso', translation: 'hello (to you)', phonetic: 'ngaʔay ho kiso', tags: ['greeting'], notes: 'More formal greeting addressing someone directly' },
  { word: 'maolah', translation: 'thank you', phonetic: 'ma.o.lah', tags: ['greeting', 'essential'], notes: 'Expression of gratitude' },
  { word: 'aray', translation: 'yes', phonetic: 'a.ray', tags: ['essential'], notes: 'Affirmative response' },
  { word: 'caay', translation: 'no/not', phonetic: 'ca.ay', tags: ['essential'], notes: 'Negative response' },
  { word: 'awaay', translation: 'none/nothing', phonetic: 'a.wa.ay', tags: ['essential'], notes: 'Indicates absence' },
  { word: 'ira', translation: 'there is/exists', phonetic: 'i.ra', tags: ['essential'], notes: 'Indicates existence' },
  { word: 'sapicakay', translation: 'please', phonetic: 'sa.pi.ca.kay', tags: ['greeting'], notes: 'Polite request' },
  { word: 'itini', translation: 'here', phonetic: 'i.ti.ni', tags: ['location'], notes: 'Proximal location' },
  { word: 'itira', translation: 'there', phonetic: 'i.ti.ra', tags: ['location'], notes: 'Distal location' },
  { word: 'icowa', translation: 'where', phonetic: 'i.co.wa', tags: ['question'], notes: 'Location question word' },
  { word: 'pina', translation: 'how many', phonetic: 'pi.na', tags: ['question', 'number'], notes: 'Quantity question word' },
  { word: 'cima', translation: 'who', phonetic: 'ci.ma', tags: ['question'], notes: 'Person question word' },
  { word: 'maan', translation: 'what', phonetic: 'ma.an', tags: ['question'], notes: 'Thing question word' },
  { word: 'nawhani', translation: 'why', phonetic: 'na.wha.ni', tags: ['question'], notes: 'Reason question word' },

  // Family & People (20)
  { word: 'tamdaw', translation: 'person/people', phonetic: 'tam.daw', tags: ['people', 'essential'], notes: 'General term for person or people' },
  { word: 'ina', translation: 'mother', phonetic: 'i.na', tags: ['family', 'essential'], notes: 'Term for mother' },
  { word: 'ama', translation: 'father', phonetic: 'a.ma', tags: ['family', 'essential'], notes: 'Term for father' },
  { word: 'wawa', translation: 'child', phonetic: 'wa.wa', tags: ['family', 'essential'], notes: 'Term for child/children' },
  { word: 'kaka', translation: 'older sibling', phonetic: 'ka.ka', tags: ['family'], notes: 'Elder brother or sister' },
  { word: 'safa', translation: 'younger sibling', phonetic: 'sa.fa', tags: ['family'], notes: 'Younger brother or sister' },
  { word: 'faki', translation: 'grandfather', phonetic: 'fa.ki', tags: ['family'], notes: 'Paternal grandfather' },
  { word: 'fai', translation: 'grandmother', phonetic: 'fa.i', tags: ['family'], notes: 'Paternal grandmother' },
  { word: 'mama', translation: 'uncle (maternal)', phonetic: 'ma.ma', tags: ['family'], notes: 'Mother\'s brother' },
  { word: 'fainayan', translation: 'man/male', phonetic: 'fai.na.yan', tags: ['people'], notes: 'Adult male' },
  { word: 'fafahiyan', translation: 'woman/female', phonetic: 'fa.fa.hi.yan', tags: ['people'], notes: 'Adult female' },
  { word: 'kapah', translation: 'youth/age group', phonetic: 'ka.pah', tags: ['people', 'culture'], notes: 'Traditional age-grade system' },
  { word: 'matoasay', translation: 'elder', phonetic: 'ma.to.a.say', tags: ['people', 'culture'], notes: 'Respected elder in community' },
  { word: 'cikawasay', translation: 'shaman/healer', phonetic: 'ci.ka.wa.say', tags: ['people', 'sacred'], notes: 'Traditional spiritual leader' },
  { word: 'radiw', translation: 'song/singer', phonetic: 'ra.diw', tags: ['people', 'culture'], notes: 'Traditional songs and those who sing them' },
  { word: 'pakelang', translation: 'gathering/assembly', phonetic: 'pa.ke.lang', tags: ['culture'], notes: 'Community gathering or meeting' },
  { word: 'niyaro\'', translation: 'village/community', phonetic: 'ni.ya.roʔ', tags: ['place', 'culture'], notes: 'Traditional village community' },
  { word: 'loma\'', translation: 'house/home', phonetic: 'lo.maʔ', tags: ['place', 'essential'], notes: 'Dwelling place' },
  { word: 'faloco\'', translation: 'heart/spirit', phonetic: 'fa.lo.coʔ', tags: ['body', 'emotion'], notes: 'Both physical heart and emotional center' },
  { word: 'ngangan', translation: 'name', phonetic: 'nga.ngan', tags: ['identity'], notes: 'Personal or place name' },

  // Body Parts (15)
  { word: 'tangah', translation: 'head', phonetic: 'ta.ngah', tags: ['body'], notes: 'Head' },
  { word: 'mata', translation: 'eye', phonetic: 'ma.ta', tags: ['body'], notes: 'Eye' },
  { word: 'ngoso\'', translation: 'nose', phonetic: 'ngo.soʔ', tags: ['body'], notes: 'Nose' },
  { word: 'ngalif', translation: 'ear', phonetic: 'nga.lif', tags: ['body'], notes: 'Ear' },
  { word: 'wawa\'', translation: 'mouth', phonetic: 'wa.waʔ', tags: ['body'], notes: 'Mouth' },
  { word: 'ngipen', translation: 'tooth', phonetic: 'ngi.pen', tags: ['body'], notes: 'Tooth/teeth' },
  { word: 'kamay', translation: 'hand', phonetic: 'ka.may', tags: ['body'], notes: 'Hand' },
  { word: 'papad', translation: 'foot/leg', phonetic: 'pa.pad', tags: ['body'], notes: 'Foot or leg' },
  { word: 'titi\'', translation: 'chest', phonetic: 'ti.tiʔ', tags: ['body'], notes: 'Chest area' },
  { word: 'tikel', translation: 'stomach', phonetic: 'ti.kel', tags: ['body'], notes: 'Stomach/belly' },
  { word: 'fokes', translation: 'hair', phonetic: 'fo.kes', tags: ['body'], notes: 'Hair on head' },
  { word: 'cikol', translation: 'neck', phonetic: 'ci.kol', tags: ['body'], notes: 'Neck' },
  { word: 'tokos', translation: 'back', phonetic: 'to.kos', tags: ['body'], notes: 'Back of body' },
  { word: 'lima', translation: 'arm', phonetic: 'li.ma', tags: ['body'], notes: 'Arm' },
  { word: 'dafak', translation: 'shoulder', phonetic: 'da.fak', tags: ['body'], notes: 'Shoulder' },

  // Ocean & Sea Life (20)
  { word: 'riyar', translation: 'the sea/ocean', phonetic: 'ri.yar', tags: ['ocean', 'nature'], notes: 'The sea, central to coastal Amis life' },
  { word: 'foting', translation: 'fish', phonetic: 'fo.ting', tags: ['ocean', 'food'], notes: 'General term for fish' },
  { word: 'kakacawan', translation: 'fishing boat', phonetic: 'ka.ka.ca.wan', tags: ['ocean', 'tool'], notes: 'Traditional fishing vessel' },
  { word: 'lalafi', translation: 'flying fish', phonetic: 'la.la.fi', tags: ['ocean', 'food'], notes: 'Important seasonal catch' },
  { word: 'dalung', translation: 'crab', phonetic: 'da.lung', tags: ['ocean', 'food'], notes: 'Crab species' },
  { word: 'cikarahay', translation: 'octopus', phonetic: 'ci.ka.ra.hay', tags: ['ocean', 'food'], notes: 'Octopus' },
  { word: 'cilakaday', translation: 'sea urchin', phonetic: 'ci.la.ka.day', tags: ['ocean', 'food'], notes: 'Sea urchin, traditional food' },
  { word: 'karorayan', translation: 'coral reef', phonetic: 'ka.ro.ra.yan', tags: ['ocean', 'nature'], notes: 'Coral reef ecosystem' },
  { word: 'pacidal', translation: 'to catch fish', phonetic: 'pa.ci.dal', tags: ['ocean', 'action'], notes: 'Fishing activity' },
  { word: 'tafokod', translation: 'net', phonetic: 'ta.fo.kod', tags: ['ocean', 'tool'], notes: 'Fishing net' },
  { word: 'dateng', translation: 'wave', phonetic: 'da.teng', tags: ['ocean', 'nature'], notes: 'Ocean wave' },
  { word: 'lakaw', translation: 'seaweed', phonetic: 'la.kaw', tags: ['ocean', 'food'], notes: 'Edible seaweed' },
  { word: 'pala\'', translation: 'shore/beach', phonetic: 'pa.laʔ', tags: ['ocean', 'place'], notes: 'Shoreline area' },
  { word: 'nanay', translation: 'sand', phonetic: 'na.nay', tags: ['ocean', 'nature'], notes: 'Beach sand' },
  { word: 'tapelik', translation: 'shellfish', phonetic: 'ta.pe.lik', tags: ['ocean', 'food'], notes: 'General shellfish' },
  { word: 'kalang', translation: 'shrimp', phonetic: 'ka.lang', tags: ['ocean', 'food'], notes: 'Shrimp/prawn' },
  { word: 'fokil', translation: 'shark', phonetic: 'fo.kil', tags: ['ocean', 'nature'], notes: 'Shark' },
  { word: 'payi', translation: 'stingray', phonetic: 'pa.yi', tags: ['ocean', 'nature'], notes: 'Stingray' },
  { word: 'ciporo', translation: 'whale', phonetic: 'ci.po.ro', tags: ['ocean', 'nature'], notes: 'Whale' },
  { word: 'dadaya', translation: 'dolphin', phonetic: 'da.da.ya', tags: ['ocean', 'nature'], notes: 'Dolphin' },

  // Mountain & Forest (15)
  { word: 'lotok', translation: 'mountain', phonetic: 'lo.tok', tags: ['nature', 'place'], notes: 'Mountain' },
  { word: 'kilakilangan', translation: 'forest', phonetic: 'ki.la.ki.la.ngan', tags: ['nature', 'place'], notes: 'Forest area' },
  { word: 'kilang', translation: 'tree', phonetic: 'ki.lang', tags: ['nature', 'plant'], notes: 'Tree' },
  { word: 'fafuy', translation: 'wild boar', phonetic: 'fa.fuy', tags: ['animal', 'hunt'], notes: 'Wild boar, hunted traditionally' },
  { word: 'wacu', translation: 'dog', phonetic: 'wa.cu', tags: ['animal'], notes: 'Dog, hunting companion' },
  { word: 'panah', translation: 'to hunt', phonetic: 'pa.nah', tags: ['action', 'hunt'], notes: 'Hunting activity' },
  { word: 'ayam', translation: 'bird', phonetic: 'a.yam', tags: ['animal', 'nature'], notes: 'Bird' },
  { word: 'lakaw', translation: 'bamboo', phonetic: 'la.kaw', tags: ['plant', 'material'], notes: 'Bamboo, important building material' },
  { word: 'tali', translation: 'taro', phonetic: 'ta.li', tags: ['food', 'plant'], notes: 'Taro plant' },
  { word: 'fana\'', translation: 'bow', phonetic: 'fa.naʔ', tags: ['tool', 'hunt'], notes: 'Hunting bow' },
  { word: 'fodoy', translation: 'arrow', phonetic: 'fo.doy', tags: ['tool', 'hunt'], notes: 'Arrow for hunting' },
  { word: 'orad', translation: 'rain', phonetic: 'o.rad', tags: ['nature', 'weather'], notes: 'Rain' },
  { word: 'dadipis', translation: 'snake', phonetic: 'da.di.pis', tags: ['animal', 'nature'], notes: 'Snake' },
  { word: 'kolang', translation: 'deer', phonetic: 'ko.lang', tags: ['animal', 'hunt'], notes: 'Deer' },
  { word: 'kayo', translation: 'wood', phonetic: 'ka.yo', tags: ['material', 'nature'], notes: 'Wood material' },

  // Agriculture & Food (20)
  { word: 'cudad', translation: 'farmland', phonetic: 'cu.dad', tags: ['place', 'farm'], notes: 'Agricultural field' },
  { word: 'panay', translation: 'rice/grain', phonetic: 'pa.nay', tags: ['food', 'essential'], notes: 'Rice, staple food' },
  { word: 'tipus', translation: 'millet', phonetic: 'ti.pus', tags: ['food', 'traditional'], notes: 'Traditional grain crop' },
  { word: 'komod', translation: 'sweet potato', phonetic: 'ko.mod', tags: ['food'], notes: 'Sweet potato' },
  { word: 'hayak', translation: 'to plant', phonetic: 'ha.yak', tags: ['action', 'farm'], notes: 'Planting activity' },
  { word: 'pala', translation: 'to harvest', phonetic: 'pa.la', tags: ['action', 'farm'], notes: 'Harvesting crops' },
  { word: 'koreng', translation: 'irrigation canal', phonetic: 'ko.reng', tags: ['farm', 'water'], notes: 'Water channel for farming' },
  { word: 'hafay', translation: 'rice (cooked)', phonetic: 'ha.fay', tags: ['food', 'essential'], notes: 'Cooked rice, meal' },
  { word: 'epah', translation: 'rice wine', phonetic: 'e.pah', tags: ['drink', 'culture'], notes: 'Traditional fermented rice drink' },
  { word: 'toron', translation: 'sticky rice cake', phonetic: 'to.ron', tags: ['food', 'culture'], notes: 'Traditional rice cake' },
  { word: 'icep', translation: 'to drink', phonetic: 'i.cep', tags: ['action', 'essential'], notes: 'Drinking action' },
  { word: 'kaen', translation: 'to eat', phonetic: 'ka.en', tags: ['action', 'essential'], notes: 'Eating action' },
  { word: 'simal', translation: 'meat', phonetic: 'si.mal', tags: ['food'], notes: 'Meat' },
  { word: 'losid', translation: 'vegetable', phonetic: 'lo.sid', tags: ['food'], notes: 'Vegetables' },
  { word: 'dateng', translation: 'ginger', phonetic: 'da.teng', tags: ['food', 'plant'], notes: 'Ginger root' },
  { word: 'tata\'ang', translation: 'chili pepper', phonetic: 'ta.taʔang', tags: ['food', 'plant'], notes: 'Hot pepper' },
  { word: 'siraw', translation: 'salt', phonetic: 'si.raw', tags: ['food', 'essential'], notes: 'Salt' },
  { word: 'sira', translation: 'salted fish', phonetic: 'si.ra', tags: ['food', 'traditional'], notes: 'Traditional preserved fish' },
  { word: 'lisin', translation: 'season/time', phonetic: 'li.sin', tags: ['time', 'farm'], notes: 'Season, especially harvest season' },
  { word: 'fafahi', translation: 'pig', phonetic: 'fa.fa.hi', tags: ['animal', 'food'], notes: 'Domesticated pig' },

  // Ceremonies & Sacred (15)
  { word: 'kawas', translation: 'spirit/deity', phonetic: 'ka.was', tags: ['sacred', 'culture'], notes: 'Spiritual beings' },
  { word: 'ilisin', translation: 'harvest festival', phonetic: 'i.li.sin', tags: ['ceremony', 'culture'], notes: 'Major annual festival' },
  { word: 'malikuda', translation: 'ritual ceremony', phonetic: 'ma.li.ku.da', tags: ['ceremony', 'sacred'], notes: 'Traditional ritual' },
  { word: 'kakitaan', translation: 'ancestral shrine', phonetic: 'ka.ki.ta.an', tags: ['sacred', 'place'], notes: 'Sacred ancestral site' },
  { word: 'to\'as', translation: 'ancestors', phonetic: 'toʔas', tags: ['sacred', 'family'], notes: 'Ancestral spirits' },
  { word: 'sakero', translation: 'prayer/blessing', phonetic: 'sa.ke.ro', tags: ['sacred', 'action'], notes: 'Prayer or blessing' },
  { word: 'pisawad', translation: 'offering', phonetic: 'pi.sa.wad', tags: ['sacred', 'ceremony'], notes: 'Ritual offering' },
  { word: 'sakatafang', translation: 'traditional dress', phonetic: 'sa.ka.ta.fang', tags: ['culture', 'clothing'], notes: 'Ceremonial attire' },
  { word: 'parod', translation: 'dance', phonetic: 'pa.rod', tags: ['culture', 'ceremony'], notes: 'Traditional dance' },
  { word: 'radiw', translation: 'traditional song', phonetic: 'ra.diw', tags: ['culture', 'ceremony'], notes: 'Traditional songs' },
  { word: 'talod', translation: 'legend/story', phonetic: 'ta.lod', tags: ['culture'], notes: 'Traditional stories' },
  { word: 'mikawas', translation: 'to worship', phonetic: 'mi.ka.was', tags: ['sacred', 'action'], notes: 'Worship activity' },
  { word: 'misalama', translation: 'to bless', phonetic: 'mi.sa.la.ma', tags: ['sacred', 'action'], notes: 'To give blessing' },
  { word: 'palimo\'', translation: 'taboo', phonetic: 'pa.li.moʔ', tags: ['sacred', 'culture'], notes: 'Cultural prohibition' },
  { word: 'safayan', translation: 'basket (ceremonial)', phonetic: 'sa.fa.yan', tags: ['culture', 'object'], notes: 'Woven ceremonial basket' },

  // Numbers & Time (15)
  { word: 'cacay', translation: 'one', phonetic: 'ca.cay', tags: ['number', 'essential'], notes: 'Number 1' },
  { word: 'tosa', translation: 'two', phonetic: 'to.sa', tags: ['number', 'essential'], notes: 'Number 2' },
  { word: 'tolo', translation: 'three', phonetic: 'to.lo', tags: ['number', 'essential'], notes: 'Number 3' },
  { word: 'sepat', translation: 'four', phonetic: 'se.pat', tags: ['number'], notes: 'Number 4' },
  { word: 'lima', translation: 'five', phonetic: 'li.ma', tags: ['number'], notes: 'Number 5' },
  { word: 'enem', translation: 'six', phonetic: 'e.nem', tags: ['number'], notes: 'Number 6' },
  { word: 'pito', translation: 'seven', phonetic: 'pi.to', tags: ['number'], notes: 'Number 7' },
  { word: 'falo', translation: 'eight', phonetic: 'fa.lo', tags: ['number'], notes: 'Number 8' },
  { word: 'siwa', translation: 'nine', phonetic: 'si.wa', tags: ['number'], notes: 'Number 9' },
  { word: 'mo\'etep', translation: 'ten', phonetic: 'moʔe.tep', tags: ['number'], notes: 'Number 10' },
  { word: 'roma\'ad', translation: 'day', phonetic: 'ro.maʔad', tags: ['time'], notes: 'Day/daytime' },
  { word: 'dafak', translation: 'morning', phonetic: 'da.fak', tags: ['time'], notes: 'Morning time' },
  { word: 'taliyok', translation: 'noon/midday', phonetic: 'ta.li.yok', tags: ['time'], notes: 'Midday' },
  { word: 'molahad', translation: 'afternoon', phonetic: 'mo.la.had', tags: ['time'], notes: 'Afternoon' },
  { word: 'fafahi', translation: 'night', phonetic: 'fa.fa.hi', tags: ['time'], notes: 'Nighttime' },

  // Actions & Verbs (20)
  { word: 'maro\'', translation: 'to come', phonetic: 'ma.roʔ', tags: ['action', 'essential'], notes: 'Coming motion' },
  { word: 'tayra', translation: 'to go', phonetic: 'tay.ra', tags: ['action', 'essential'], notes: 'Going motion' },
  { word: 'mifoting', translation: 'to fish', phonetic: 'mi.fo.ting', tags: ['action', 'ocean'], notes: 'Fishing activity' },
  { word: 'misa\'osi', translation: 'to work', phonetic: 'mi.saʔo.si', tags: ['action'], notes: 'Working' },
  { word: 'mi\'araw', translation: 'to see/look', phonetic: 'miʔa.raw', tags: ['action', 'essential'], notes: 'Seeing action' },
  { word: 'miladiw', translation: 'to run', phonetic: 'mi.la.diw', tags: ['action'], notes: 'Running' },
  { word: 'minengneng', translation: 'to listen', phonetic: 'mi.neng.neng', tags: ['action'], notes: 'Listening' },
  { word: 'misanga\'ay', translation: 'to speak', phonetic: 'mi.sa.ngaʔay', tags: ['action', 'essential'], notes: 'Speaking' },
  { word: 'mipanay', translation: 'to rice farm', phonetic: 'mi.pa.nay', tags: ['action', 'farm'], notes: 'Rice farming' },
  { word: 'maomah', translation: 'to farm', phonetic: 'ma.o.mah', tags: ['action', 'farm'], notes: 'General farming' },
  { word: 'milaliw', translation: 'to play', phonetic: 'mi.la.liw', tags: ['action'], notes: 'Playing' },
  { word: 'mitoor', translation: 'to sing', phonetic: 'mi.to.or', tags: ['action', 'culture'], notes: 'Singing' },
  { word: 'misaparo\'', translation: 'to dance', phonetic: 'mi.sa.pa.roʔ', tags: ['action', 'culture'], notes: 'Dancing' },
  { word: 'misakamo', translation: 'to cook', phonetic: 'mi.sa.ka.mo', tags: ['action', 'food'], notes: 'Cooking' },
  { word: 'mikalat', translation: 'to weave', phonetic: 'mi.ka.lat', tags: ['action', 'craft'], notes: 'Weaving' },
  { word: 'mifaco', translation: 'to wash', phonetic: 'mi.fa.co', tags: ['action'], notes: 'Washing' },
  { word: 'patayra', translation: 'to send', phonetic: 'pa.tay.ra', tags: ['action'], notes: 'Sending' },
  { word: 'pakaen', translation: 'to feed', phonetic: 'pa.ka.en', tags: ['action', 'food'], notes: 'Feeding' },
  { word: 'miremet', translation: 'to think', phonetic: 'mi.re.met', tags: ['action'], notes: 'Thinking' },
  { word: 'minanam', translation: 'to learn', phonetic: 'mi.na.nam', tags: ['action', 'essential'], notes: 'Learning' },

  // Descriptive Words (15)
  { word: 'maolah', translation: 'good/beautiful', phonetic: 'ma.o.lah', tags: ['description', 'essential'], notes: 'Positive quality' },
  { word: 'masadak', translation: 'bad', phonetic: 'ma.sa.dak', tags: ['description'], notes: 'Negative quality' },
  { word: 'mafolaw', translation: 'big/large', phonetic: 'ma.fo.law', tags: ['description', 'size'], notes: 'Large size' },
  { word: 'mi\'ami', translation: 'small', phonetic: 'miʔa.mi', tags: ['description', 'size'], notes: 'Small size' },
  { word: 'matiya\'', translation: 'hot', phonetic: 'ma.ti.yaʔ', tags: ['description'], notes: 'Hot temperature' },
  { word: 'macikcik', translation: 'cold', phonetic: 'ma.cik.cik', tags: ['description'], notes: 'Cold temperature' },
  { word: 'matalaw', translation: 'tall/high', phonetic: 'ma.ta.law', tags: ['description', 'size'], notes: 'Tall height' },
  { word: 'mapodo\'', translation: 'short', phonetic: 'ma.po.doʔ', tags: ['description', 'size'], notes: 'Short height' },
  { word: 'mafana\'', translation: 'fast', phonetic: 'ma.fa.naʔ', tags: ['description'], notes: 'Fast speed' },
  { word: 'mahrek', translation: 'slow', phonetic: 'mah.rek', tags: ['description'], notes: 'Slow speed' },
  { word: 'malafi', translation: 'new', phonetic: 'ma.la.fi', tags: ['description'], notes: 'New/fresh' },
  { word: 'mato\'asay', translation: 'old (things)', phonetic: 'ma.toʔa.say', tags: ['description'], notes: 'Old/aged' },
  { word: 'maramod', translation: 'delicious', phonetic: 'ma.ra.mod', tags: ['description', 'food'], notes: 'Tasty' },
  { word: 'mararay', translation: 'happy', phonetic: 'ma.ra.ray', tags: ['description', 'emotion'], notes: 'Happy feeling' },
  { word: 'madoka\'', translation: 'sad', phonetic: 'ma.do.kaʔ', tags: ['description', 'emotion'], notes: 'Sad feeling' },

  // More everyday items (6)
  { word: 'toki', translation: 'knife', phonetic: 'to.ki', tags: ['tool'], notes: 'Cutting tool' },
  { word: 'kolong', translation: 'pot/container', phonetic: 'ko.long', tags: ['tool', 'cooking'], notes: 'Cooking pot' },
  { word: 'kafid', translation: 'fire', phonetic: 'ka.fid', tags: ['nature', 'essential'], notes: 'Fire' },
  { word: 'nanom', translation: 'water', phonetic: 'na.nom', tags: ['nature', 'essential'], notes: 'Water' },
  { word: 'cidal', translation: 'sun', phonetic: 'ci.dal', tags: ['nature'], notes: 'Sun' },
  { word: 'folad', translation: 'moon', phonetic: 'fo.lad', tags: ['nature'], notes: 'Moon' },
];

// Generate all entries with SRS data
export const DEMO_AMIS_ENTRIES = amisVocabulary.map((vocab, index) => {
  const srsData = generateSrsData(srsDistribution[index] || 'new');
  const createdDaysAgo = Math.floor(Math.random() * 90) + 10; // 10-100 days ago

  return {
    id: `amis-entry-${index + 1}`,
    deck_id: 'demo-amis-personal',
    user_id: 'dev-user-123',
    word: vocab.word,
    phonetic: vocab.phonetic,
    translation: vocab.translation,
    language: 'ami',
    notes: vocab.notes,
    tags: vocab.tags,
    source_type: ['conversation', 'class', 'community', 'book'][Math.floor(Math.random() * 4)],
    contributor_name: index % 5 === 0 ? 'Panay Kusui' : null,
    contributor_location: index % 5 === 0 ? 'Taitung, Taiwan' : null,
    ...srsData,
    created_at: new Date(Date.now() - createdDaysAgo * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: srsData.last_reviewed_at || new Date(Date.now() - createdDaysAgo * 24 * 60 * 60 * 1000).toISOString(),
  };
});
