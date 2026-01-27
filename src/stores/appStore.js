import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Global app store using Zustand
 * Handles app-wide state that needs to persist across sessions
 */
export const useAppStore = create(
  persist(
    (set, get) => ({
      // UI State
      sidebarOpen: true,
      theme: 'dark', // 'dark' | 'light' | 'system'

      // Active states
      activeDeckId: null,
      activeLanguage: null,

      // Offline queue
      offlineQueue: [],

      // Recently viewed
      recentDecks: [],
      recentSearches: [],

      // Dictionary source toggles
      enabledSources: ['personal', 'community', 'freeDictionary', 'wiktionary'],

      // User preferences
      preferences: {
        dailyGoal: 10,
        notificationsEnabled: true,
        soundEnabled: true,
        hapticEnabled: true,
      },

      // Actions
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      setTheme: (theme) => set({ theme }),

      setActiveDeck: (deckId) => set({ activeDeckId: deckId }),
      setActiveLanguage: (language) => set({ activeLanguage: language }),

      // Recent items management
      addRecentDeck: (deckId) => set((state) => ({
        recentDecks: [deckId, ...state.recentDecks.filter(id => id !== deckId)].slice(0, 10)
      })),

      addRecentSearch: (query) => set((state) => ({
        recentSearches: [query, ...state.recentSearches.filter(q => q !== query)].slice(0, 10)
      })),

      clearRecentSearches: () => set({ recentSearches: [] }),

      toggleSource: (sourceId) => set((state) => ({
        enabledSources: state.enabledSources.includes(sourceId)
          ? state.enabledSources.filter(id => id !== sourceId)
          : [...state.enabledSources, sourceId]
      })),

      // Offline queue management
      addToOfflineQueue: (action) => set((state) => ({
        offlineQueue: [...state.offlineQueue, { id: Date.now(), ...action }]
      })),

      removeFromOfflineQueue: (id) => set((state) => ({
        offlineQueue: state.offlineQueue.filter(item => item.id !== id)
      })),

      clearOfflineQueue: () => set({ offlineQueue: [] }),

      // Preferences
      updatePreferences: (updates) => set((state) => ({
        preferences: { ...state.preferences, ...updates }
      })),

      // Reset store
      reset: () => set({
        activeDeckId: null,
        activeLanguage: null,
        offlineQueue: [],
        recentDecks: [],
        recentSearches: [],
      }),
    }),
    {
      name: 'starlog-storage',
      partialize: (state) => ({
        theme: state.theme,
        recentDecks: state.recentDecks,
        recentSearches: state.recentSearches,
        preferences: state.preferences,
        offlineQueue: state.offlineQueue,
        enabledSources: state.enabledSources,
        activeLanguage: state.activeLanguage,
      }),
    }
  )
);

/**
 * Deck-specific store for managing active deck state
 */
export const useDeckStore = create((set) => ({
  currentDeck: null,
  entries: [],
  loading: false,
  filter: 'all', // 'all' | 'new' | 'due' | 'mastered'
  sortBy: 'created', // 'created' | 'alphabetical' | 'mastery'

  setCurrentDeck: (deck) => set({ currentDeck: deck }),
  setEntries: (entries) => set({ entries }),
  setLoading: (loading) => set({ loading }),
  setFilter: (filter) => set({ filter }),
  setSortBy: (sortBy) => set({ sortBy }),

  // Add entry to local state
  addEntry: (entry) => set((state) => ({
    entries: [entry, ...state.entries]
  })),

  // Update entry in local state
  updateEntry: (entryId, updates) => set((state) => ({
    entries: state.entries.map(e =>
      e.id === entryId ? { ...e, ...updates } : e
    )
  })),

  // Remove entry from local state
  removeEntry: (entryId) => set((state) => ({
    entries: state.entries.filter(e => e.id !== entryId)
  })),

  reset: () => set({
    currentDeck: null,
    entries: [],
    loading: false,
    filter: 'all',
    sortBy: 'created',
  }),
}));

/**
 * Review session store
 */
export const useReviewStore = create((set) => ({
  isActive: false,
  currentIndex: 0,
  entries: [],
  results: [],
  startedAt: null,

  startReview: (entries) => set({
    isActive: true,
    currentIndex: 0,
    entries,
    results: [],
    startedAt: new Date(),
  }),

  nextEntry: () => set((state) => ({
    currentIndex: state.currentIndex + 1
  })),

  recordResult: (result) => set((state) => ({
    results: [...state.results, result]
  })),

  endReview: () => set({
    isActive: false,
    currentIndex: 0,
    entries: [],
    results: [],
    startedAt: null,
  }),
}));
