import { create } from 'zustand';

// Screen states for Bridge Mode
export const SCREENS = {
  BRIDGE: 'bridge',
  STAR_MAP: 'starMap',
  SCENE: 'scene',
  ENCOUNTER: 'encounter',
};

export const useBridgeStore = create((set, get) => ({
  // Navigation
  currentScreen: SCREENS.BRIDGE,
  previousScreen: null,
  transition: null, // 'warp' | 'landing' | 'alert' | null

  // Session
  sessionActive: false,
  sessionStartedAt: null,

  // Fuel
  fuelLevel: 0,         // Active fuel 0-100
  bankedFuel: 0,         // Floor that rises over session
  fuelMuted: false,      // Teacher can mute mic input

  // Star map
  currentNodeId: 'node-1',
  visitedNodes: ['node-1'],

  // Scene / dialogue
  currentDestinationId: null,
  currentSceneIndex: 0,
  currentBeatIndex: 0,

  // Encounter
  currentEncounterId: null,
  encounterActive: false,

  // Teacher controls
  teacherPanelOpen: false,

  // Mic
  micConnected: false,

  // --- Actions ---

  // Navigation
  setScreen: (screen, transition = null) => {
    const prev = get().currentScreen;
    set({ previousScreen: prev, transition, currentScreen: screen });
  },
  clearTransition: () => set({ transition: null }),

  // Session
  startSession: () => set({
    sessionActive: true,
    sessionStartedAt: Date.now(),
    fuelLevel: 0,
    bankedFuel: 0,
  }),
  endSession: () => set({
    sessionActive: false,
    sessionStartedAt: null,
  }),

  // Fuel
  setFuelLevel: (level) => {
    const { bankedFuel } = get();
    set({ fuelLevel: Math.max(bankedFuel, Math.min(100, level)) });
  },
  addFuel: (amount) => {
    const { fuelLevel, bankedFuel } = get();
    const newLevel = Math.min(100, fuelLevel + amount);
    set({ fuelLevel: newLevel });
  },
  decayFuel: (delta) => {
    const { fuelLevel, bankedFuel, fuelMuted } = get();
    if (fuelMuted) return;
    const decay = delta * 3; // ~100→0 in ~33s of silence
    set({ fuelLevel: Math.max(bankedFuel, fuelLevel - decay) });
  },
  bankFuel: () => {
    const { fuelLevel, bankedFuel } = get();
    // Slowly raise the floor toward current level
    const newBanked = bankedFuel + (fuelLevel - bankedFuel) * 0.002;
    set({ bankedFuel: Math.min(newBanked, 100) });
  },
  boostFuel: (amount = 10) => {
    const { fuelLevel } = get();
    set({ fuelLevel: Math.min(100, fuelLevel + amount) });
  },
  toggleFuelMute: () => set((s) => ({ fuelMuted: !s.fuelMuted })),

  // Star map
  selectNode: (nodeId) => set((s) => ({
    currentNodeId: nodeId,
    visitedNodes: s.visitedNodes.includes(nodeId)
      ? s.visitedNodes
      : [...s.visitedNodes, nodeId],
  })),

  // Scene
  enterDestination: (destinationId) => set({
    currentDestinationId: destinationId,
    currentSceneIndex: 0,
    currentBeatIndex: 0,
    currentScreen: SCREENS.SCENE,
  }),
  advanceBeat: () => set((s) => ({ currentBeatIndex: s.currentBeatIndex + 1 })),
  setScene: (sceneIndex) => set({ currentSceneIndex: sceneIndex, currentBeatIndex: 0 }),

  // Encounter
  startEncounter: (encounterId) => set({
    currentEncounterId: encounterId,
    encounterActive: true,
    currentScreen: SCREENS.ENCOUNTER,
  }),
  endEncounter: () => set({
    encounterActive: false,
    currentEncounterId: null,
  }),

  // Teacher
  toggleTeacherPanel: () => set((s) => ({ teacherPanelOpen: !s.teacherPanelOpen })),

  // Mic
  setMicConnected: (connected) => set({ micConnected: connected }),

  // Reset
  reset: () => set({
    currentScreen: SCREENS.BRIDGE,
    previousScreen: null,
    transition: null,
    sessionActive: false,
    sessionStartedAt: null,
    fuelLevel: 0,
    bankedFuel: 0,
    fuelMuted: false,
    currentNodeId: 'node-1',
    visitedNodes: ['node-1'],
    currentDestinationId: null,
    currentSceneIndex: 0,
    currentBeatIndex: 0,
    currentEncounterId: null,
    encounterActive: false,
    teacherPanelOpen: false,
  }),
}));
