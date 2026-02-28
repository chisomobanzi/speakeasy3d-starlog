import { create } from 'zustand';

function generateSessionCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/0/1 for clarity
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// Screen states for Bridge Mode
export const SCREENS = {
  BRIDGE: 'bridge',
  STAR_MAP: 'starMap',
  SCENE: 'scene',
  ENCOUNTER: 'encounter',
  GAME: 'game',
};

// Game phase state machine (within GAME screen)
export const GAME_PHASES = {
  IDLE: 'idle',
  LOBBY: 'lobby',
  COUNTDOWN: 'countdown',
  PLAYING: 'playing',
  ROUND_END: 'roundEnd',
};

// Extensible game modes
export const GAME_MODES = {
  SPELL_DUEL: 'spellDuel',
};

export const useBridgeStore = create((set, get) => ({
  // ─── Navigation ───
  currentScreen: SCREENS.BRIDGE,
  previousScreen: null,
  transition: null, // 'warp' | 'landing' | 'alert' | null

  // ─── Session ───
  sessionActive: false,
  sessionStartedAt: null,

  // ─── Fuel ───
  fuelLevel: 0,
  bankedFuel: 0,
  fuelMuted: false,

  // ─── Star map ───
  currentNodeId: 'node-1',
  visitedNodes: ['node-1'],

  // ─── Scene / dialogue ───
  currentDestinationId: null,
  currentSceneIndex: 0,
  currentBeatIndex: 0,

  // ─── Encounter ───
  currentEncounterId: null,
  encounterActive: false,

  // ─── Teacher controls ───
  teacherPanelOpen: false,

  // ─── Mic ───
  localMicEnabled: false,
  micConnected: false,

  // ─── WebSocket / Echo devices ───
  sessionCode: generateSessionCode(),
  connectedDevices: [],
  remoteVolume: 0,
  remoteSpeaking: false,

  // ─── Game state (shared infrastructure for all game modes) ───
  gamePhase: GAME_PHASES.IDLE,
  currentGameMode: null,
  players: [], // [{ id, name, language, team, score, wordsCompleted, connected }]
  teams: {
    red: { id: 'red', name: 'Red Dragons 紅龍隊', color: '#EF4444', score: 0, roundScore: 0 },
    blue: { id: 'blue', name: 'Blue Phoenix 藍鳳隊', color: '#3B82F6', score: 0, roundScore: 0 },
  },
  currentRound: 0,
  roundDuration: 60,
  roundTimeLeft: 60,
  scoreFeed: [], // [{ id, playerName, word, points, team, timestamp }]
  roundWinner: null,

  // ═══════════════════════════════════════
  //  ACTIONS
  // ═══════════════════════════════════════

  // ─── Navigation ───
  setScreen: (screen, transition = null) => {
    const prev = get().currentScreen;
    set({ previousScreen: prev, transition, currentScreen: screen });
  },
  clearTransition: () => set({ transition: null }),

  // ─── Session ───
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

  // ─── Fuel ───
  setFuelLevel: (level) => {
    const { bankedFuel } = get();
    set({ fuelLevel: Math.max(bankedFuel, Math.min(100, level)) });
  },
  addFuel: (amount) => {
    const { fuelLevel } = get();
    set({ fuelLevel: Math.min(100, fuelLevel + amount) });
  },
  decayFuel: (delta) => {
    const { fuelLevel, bankedFuel, fuelMuted } = get();
    if (fuelMuted) return;
    const decay = delta * 3;
    set({ fuelLevel: Math.max(bankedFuel, fuelLevel - decay) });
  },
  bankFuel: () => {
    const { fuelLevel, bankedFuel } = get();
    const newBanked = bankedFuel + (fuelLevel - bankedFuel) * 0.002;
    set({ bankedFuel: Math.min(newBanked, 100) });
  },
  boostFuel: (amount = 10) => {
    const { fuelLevel } = get();
    set({ fuelLevel: Math.min(100, fuelLevel + amount) });
  },
  toggleFuelMute: () => set((s) => ({ fuelMuted: !s.fuelMuted })),

  // ─── Star map ───
  selectNode: (nodeId) => set((s) => ({
    currentNodeId: nodeId,
    visitedNodes: s.visitedNodes.includes(nodeId)
      ? s.visitedNodes
      : [...s.visitedNodes, nodeId],
  })),

  // ─── Scene ───
  enterDestination: (destinationId) => set({
    currentDestinationId: destinationId,
    currentSceneIndex: 0,
    currentBeatIndex: 0,
    currentScreen: SCREENS.SCENE,
  }),
  advanceBeat: () => set((s) => ({ currentBeatIndex: s.currentBeatIndex + 1 })),
  setScene: (sceneIndex) => set({ currentSceneIndex: sceneIndex, currentBeatIndex: 0 }),

  // ─── Encounter ───
  startEncounter: (encounterId) => set({
    currentEncounterId: encounterId,
    encounterActive: true,
    currentScreen: SCREENS.ENCOUNTER,
  }),
  endEncounter: () => set({
    encounterActive: false,
    currentEncounterId: null,
  }),

  // ─── Teacher ───
  toggleTeacherPanel: () => set((s) => ({ teacherPanelOpen: !s.teacherPanelOpen })),

  // ─── Mic ───
  toggleLocalMic: () => set((s) => ({ localMicEnabled: !s.localMicEnabled })),
  setMicConnected: (connected) => set({ micConnected: connected }),

  // ─── WebSocket / Echo devices ───
  regenerateSessionCode: () => set({ sessionCode: generateSessionCode() }),
  setConnectedDevices: (devices) => set({ connectedDevices: devices }),
  addConnectedDevice: (device) => set((s) => ({
    connectedDevices: [...s.connectedDevices, device],
  })),
  removeConnectedDevice: (deviceId) => set((s) => ({
    connectedDevices: s.connectedDevices.filter((d) => d.deviceId !== deviceId),
  })),
  setRemoteVolume: (_deviceId, volume, isSpeaking) => {
    set({ remoteVolume: volume, remoteSpeaking: isSpeaking });
  },

  // ─── Game: Team version (increments on team/roster changes, used to trigger broadcasts) ───
  teamVersion: 0,

  // ─── Game: Player management ───
  addPlayer: (playerInfo) => set((s) => {
    const existing = s.players.find((p) => p.id === playerInfo.id);
    if (existing) {
      // Reconnecting player — update info, mark connected
      return {
        players: s.players.map((p) =>
          p.id === playerInfo.id
            ? { ...p, ...playerInfo, connected: true }
            : p
        ),
      };
    }
    // New player — auto-assign team based on current balance
    const redCount = s.players.filter((p) => p.team === 'red').length;
    const blueCount = s.players.filter((p) => p.team === 'blue').length;
    const team = redCount <= blueCount ? 'red' : 'blue';
    return {
      players: [
        ...s.players,
        { ...playerInfo, team, score: 0, wordsCompleted: 0, connected: true },
      ],
      teamVersion: s.teamVersion + 1,
    };
  }),

  removePlayer: (playerId) => set((s) => ({
    players: s.players.map((p) =>
      p.id === playerId ? { ...p, connected: false } : p
    ),
  })),

  // Remove a player completely from the game (teacher action)
  removePlayerFromGame: (playerId) => set((s) => ({
    players: s.players.filter((p) => p.id !== playerId),
    teamVersion: s.teamVersion + 1,
  })),

  // Swap a player to the other team (teacher action)
  swapPlayerTeam: (playerId) => set((s) => ({
    players: s.players.map((p) =>
      p.id === playerId
        ? { ...p, team: p.team === 'red' ? 'blue' : 'red' }
        : p
    ),
    teamVersion: s.teamVersion + 1,
  })),

  // ─── Game: Flow control ───
  startGame: (mode) => set((s) => ({
    gamePhase: GAME_PHASES.LOBBY,
    currentGameMode: mode || GAME_MODES.SPELL_DUEL,
    currentScreen: SCREENS.GAME,
    currentRound: 0,
    scoreFeed: [],
    roundWinner: null,
    players: s.players.map((p) => ({ ...p, score: 0, wordsCompleted: 0 })),
    teams: {
      red: { ...s.teams.red, score: 0, roundScore: 0 },
      blue: { ...s.teams.blue, score: 0, roundScore: 0 },
    },
  })),

  startRound: () => set((s) => ({
    gamePhase: GAME_PHASES.COUNTDOWN,
    currentRound: s.currentRound + 1,
    roundTimeLeft: s.roundDuration,
    scoreFeed: [],
    roundWinner: null,
    teams: {
      red: { ...s.teams.red, roundScore: 0 },
      blue: { ...s.teams.blue, roundScore: 0 },
    },
  })),

  beginPlay: () => set({ gamePhase: GAME_PHASES.PLAYING }),

  tickTimer: () => {
    const { roundTimeLeft } = get();
    if (roundTimeLeft <= 1) {
      set({ roundTimeLeft: 0 });
      get().endRound();
    } else {
      set({ roundTimeLeft: roundTimeLeft - 1 });
    }
  },

  scoreWord: ({ playerId, playerName, word, points, team }) => set((s) => ({
    players: s.players.map((p) =>
      p.id === playerId
        ? { ...p, score: p.score + points, wordsCompleted: p.wordsCompleted + 1 }
        : p
    ),
    teams: {
      ...s.teams,
      [team]: {
        ...s.teams[team],
        score: s.teams[team].score + points,
        roundScore: s.teams[team].roundScore + points,
      },
    },
    scoreFeed: [
      { id: `${Date.now()}-${playerId}`, playerName, word, points, team, timestamp: Date.now() },
      ...s.scoreFeed,
    ].slice(0, 8),
  })),

  endRound: () => set((s) => {
    const redScore = s.teams.red.roundScore;
    const blueScore = s.teams.blue.roundScore;
    return {
      gamePhase: GAME_PHASES.ROUND_END,
      roundWinner: redScore > blueScore ? 'red' : blueScore > redScore ? 'blue' : 'tie',
    };
  }),

  returnToLobby: () => set({
    gamePhase: GAME_PHASES.LOBBY,
    scoreFeed: [],
    roundWinner: null,
  }),

  resetGame: () => set((s) => ({
    gamePhase: GAME_PHASES.IDLE,
    currentGameMode: null,
    currentRound: 0,
    scoreFeed: [],
    roundWinner: null,
    currentScreen: SCREENS.BRIDGE,
    players: s.players.map((p) => ({ ...p, score: 0, wordsCompleted: 0 })),
    teams: {
      red: { ...s.teams.red, score: 0, roundScore: 0 },
      blue: { ...s.teams.blue, score: 0, roundScore: 0 },
    },
  })),

  // ─── Reset all ───
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
    gamePhase: GAME_PHASES.IDLE,
    currentGameMode: null,
    currentRound: 0,
    scoreFeed: [],
    roundWinner: null,
    players: [],
    teams: {
      red: { id: 'red', name: 'Red Dragons 紅龍隊', color: '#EF4444', score: 0, roundScore: 0 },
      blue: { id: 'blue', name: 'Blue Phoenix 藍鳳隊', color: '#3B82F6', score: 0, roundScore: 0 },
    },
  }),
}));
