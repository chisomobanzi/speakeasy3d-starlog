/**
 * Dictionary source registry
 * Each source defines metadata for display and filtering.
 */

export const SOURCES = {
  personal: {
    id: 'personal',
    name: 'My Decks',
    shortName: 'Mine',
    icon: 'BookOpen',
    color: '#10b981', // emerald
    isBuiltIn: true,
    enabledByDefault: true,
    supportedLanguages: null, // all
  },
  community: {
    id: 'community',
    name: 'Community',
    shortName: 'Community',
    icon: 'Users',
    color: '#6366f1', // indigo
    isBuiltIn: true,
    enabledByDefault: true,
    supportedLanguages: null,
  },
  freeDictionary: {
    id: 'freeDictionary',
    name: 'Free Dictionary',
    shortName: 'Free Dict',
    icon: 'BookMarked',
    color: '#f59e0b', // amber
    isBuiltIn: false,
    enabledByDefault: true,
    supportedLanguages: ['en'],
  },
  wiktionary: {
    id: 'wiktionary',
    name: 'Wiktionary',
    shortName: 'Wiktionary',
    icon: 'Globe',
    color: '#8b5cf6', // violet
    isBuiltIn: false,
    enabledByDefault: true,
    supportedLanguages: null, // many languages supported
  },
};

export const ALL_SOURCE_IDS = Object.keys(SOURCES);
export const DEFAULT_ENABLED = ALL_SOURCE_IDS.filter(id => SOURCES[id].enabledByDefault);

/**
 * Filter sources to those applicable for a given language and enabled set.
 */
export function getSourcesForLanguage(language, enabledIds) {
  return enabledIds
    .filter(id => {
      const source = SOURCES[id];
      if (!source) return false;
      if (!source.supportedLanguages) return true;
      return source.supportedLanguages.includes(language);
    })
    .map(id => SOURCES[id]);
}
