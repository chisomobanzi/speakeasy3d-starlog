// Transforms seed data and Supabase RPC data into the shape
// expected by PublicConstellation / LanguageConstellation

// Source-based visual encoding (replaces DOC_STATUS_STYLES)
export const SOURCE_STYLES = {
  elder:      { scale: 1.0,  opacity: 1.0,  glow: true,  coreColor: '#FFD700', symbol: '\u25C6', label: 'Elder-verified' },
  community:  { scale: 0.9,  opacity: 0.85, glow: true,  coreColor: '#00D4FF', symbol: '\u25C7', label: 'Community-contributed' },
  dictionary: { scale: 0.8,  opacity: 0.7,  glow: false, coreColor: '#7BA3E0', symbol: '\u25CF', label: 'Published dictionary' },
  academic:   { scale: 0.7,  opacity: 0.65, glow: false, coreColor: '#90CAF9', symbol: '\u25A0', label: 'Academic/linguistic' },
  ai:         { scale: 0.6,  opacity: 0.35, glow: false, coreColor: '#9B7FD4', symbol: '\u25CB', label: 'AI-suggested' },
};

// Domain id -> emoji icon
export const DOMAIN_ICONS = {
  '1': '\u{1F30D}', // earth
  '2': '\u{1F9D1}', // person
  '3': '\u{1F4AD}', // thought balloon
  '4': '\u{1F91D}', // handshake
  '5': '\u{1F3E0}', // house
  '6': '\u{1F528}', // hammer
  '7': '\u{1F3C3}', // runner
  '8': '\u{1F522}', // numbers
  '9': '\u{1F524}', // letters
};

/**
 * Transform seed data JSON into the prop shape expected by PublicConstellation.
 * @param {Object} seedData - Raw JSON from shona-seed-data.json
 * @returns {{ language, taxonomy: { name, domains }, vocabulary }}
 */
export function adaptSeedData(seedData) {
  const { language, sil_domains, words } = seedData;

  const domains = sil_domains.map(d => ({
    id: d.id,
    name: d.name,
    nameLocal: d.short,
    color: d.color,
    icon: DOMAIN_ICONS[d.id] || '\u{2B50}',
    expected: d.expected,
    angle: d.angle ?? 0,
  }));

  const vocabulary = words.map((w, index) => ({
    id: `${language.code}-${index}`,
    word: w.shona,
    translation: w.english,
    domains: [w.primary_domain, ...(w.secondary_domains || [])],
    subDomain: w.sub_domain,
    source: w.source,
    connections: [],
  }));

  return {
    language,
    taxonomy: { name: language.name, domains },
    vocabulary,
  };
}

/**
 * Transform Supabase RPC response into the same prop shape.
 * @param {Object} rpcResult - Response from get_constellation_data RPC
 * @returns {{ language, taxonomy: { name, domains }, vocabulary, recentSignals }}
 */
export function adaptSupabaseData(rpcResult) {
  const { language, domains, words, recent_signals } = rpcResult;

  // Default angles for 9 domains if not stored in DB
  const DEFAULT_ANGLES = { '1': 0, '2': 40, '3': 80, '4': 120, '5': 160, '6': 200, '7': 240, '8': 280, '9': 320 };
  const adaptedDomains = domains.map(d => ({
    id: d.id,
    name: d.name,
    nameLocal: d.short_name,
    color: d.color,
    icon: d.icon || DOMAIN_ICONS[d.id] || '\u{2B50}',
    expected: d.expected_count,
    angle: DEFAULT_ANGLES[d.id] ?? 0,
  }));

  const vocabulary = words.map(w => ({
    id: w.id,
    word: w.word,
    translation: w.translation,
    phonetic: w.phonetic,
    domains: [w.primary_domain, ...(w.secondary_domains || [])],
    subDomain: w.sub_domain,
    source: w.source,
    connections: [],
  }));

  return {
    language,
    taxonomy: { name: language?.name || 'Unknown', domains: adaptedDomains },
    vocabulary,
    recentSignals: recent_signals || [],
  };
}
