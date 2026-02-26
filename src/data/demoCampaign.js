// ============================================================================
// DEMO CAMPAIGN — "The Luminara Voyage"
// A 6-session semester journey for Tim Yang's Treellege pilot class
// ============================================================================

export const demoCampaign = {
  id: 'demo-luminara',
  title: 'The Luminara Voyage',
  description: 'A crew of young explorers embarks on a journey through the Luminara system, encountering alien civilisations and cosmic mysteries.',
  shipName: 'SS Pathfinder',
  className: 'Treellege Crew',
};

// ============================================================================
// STAR MAP — 6 nodes connected in a branching path
// Positions in 3D space (x, y, z) — scaled for Three.js scene
// ============================================================================

export const starMapNodes = [
  {
    id: 'node-1',
    label: 'The Recruitment',
    subtitle: 'Session 1 — Where it all begins',
    type: 'story',
    position: [-4, 0, 0],
    destinationId: 'dest-recruitment',
  },
  {
    id: 'node-2',
    label: 'First Landing',
    subtitle: 'Session 2 — Planet Kova',
    type: 'story',
    position: [-1.5, 1.5, -1],
    destinationId: 'dest-kova',
  },
  {
    id: 'node-3',
    label: 'The Signal',
    subtitle: 'Session 3 — A mysterious transmission',
    type: 'side_quest',
    position: [-1.5, -1.5, 1],
    destinationId: 'dest-signal',
  },
  {
    id: 'node-4',
    label: 'Nexus Station',
    subtitle: 'Session 4 — The trading outpost',
    type: 'rest',
    position: [1.5, 0, 0.5],
    destinationId: 'dest-nexus',
  },
  {
    id: 'node-5',
    label: 'The Crisis',
    subtitle: 'Session 5 — Engine failure',
    type: 'boss',
    position: [3.5, 1, -0.5],
    destinationId: 'dest-crisis',
  },
  {
    id: 'node-6',
    label: 'Luminara Prime',
    subtitle: 'Session 6 — Journey\'s end',
    type: 'story',
    position: [5.5, 0, 0],
    destinationId: 'dest-luminara',
  },
];

export const starMapEdges = [
  { from: 'node-1', to: 'node-2' },
  { from: 'node-1', to: 'node-3' },
  { from: 'node-2', to: 'node-4' },
  { from: 'node-3', to: 'node-4' },
  { from: 'node-4', to: 'node-5' },
  { from: 'node-5', to: 'node-6' },
];

// ============================================================================
// DESTINATIONS — Locations with scenes and encounters
// ============================================================================

export const destinations = {
  'dest-recruitment': {
    id: 'dest-recruitment',
    title: 'The Recruitment',
    subtitle: 'Earth Orbital Station',
    background: null, // will use CSS gradient fallback
    scenes: [
      {
        id: 'scene-1a',
        beats: [
          {
            type: 'narration',
            text: 'The year is 2347. The SS Pathfinder sits in dry dock at Earth Orbital Station, its engines cold, waiting for a crew.',
          },
          {
            type: 'narration',
            text: 'You have been selected from thousands of applicants. The mission: chart the Luminara system — a cluster of stars where no human has ever travelled.',
          },
          {
            type: 'dialogue',
            npcId: 'echo',
            emotion: 'neutral',
            text: 'Welcome aboard the SS Pathfinder. I am Echo, the ship\'s AI. I will be your guide on this journey.',
          },
          {
            type: 'dialogue',
            npcId: 'echo',
            emotion: 'happy',
            text: 'The ship runs on vocal energy. The more you speak, the further we fly. Are you ready to power up?',
          },
          {
            type: 'choice',
            prompt: 'What does the crew say?',
            options: [
              { text: '"We\'re ready! Let\'s go!"', fuelBonus: 10 },
              { text: '"Tell us more about the mission first."', fuelBonus: 0 },
            ],
          },
          {
            type: 'dialogue',
            npcId: 'echo',
            emotion: 'happy',
            text: 'Excellent. Setting course for the Luminara system. The stars await, crew. Speak up — and the ship will listen.',
          },
        ],
      },
    ],
    encounters: ['encounter-spell-1'],
  },
  'dest-kova': {
    id: 'dest-kova',
    title: 'Planet Kova',
    subtitle: 'The Silent World',
    background: null,
    scenes: [
      {
        id: 'scene-2a',
        beats: [
          {
            type: 'narration',
            text: 'The SS Pathfinder descends through clouds of crystal dust. Below, an alien landscape stretches to the horizon — bioluminescent forests, shimmering lakes, two pale moons hanging in a violet sky.',
          },
          {
            type: 'dialogue',
            npcId: 'alien',
            emotion: 'neutral',
            text: '... ... ...',
          },
          {
            type: 'narration',
            text: 'A figure stands at the edge of the landing zone. It watches you silently. On this world, sound is rare — and precious.',
          },
          {
            type: 'dialogue',
            npcId: 'alien',
            emotion: 'surprised',
            text: 'You... speak? It has been a long time since we heard voices from the sky. I am Koris, keeper of this place.',
          },
          {
            type: 'dialogue',
            npcId: 'alien',
            emotion: 'neutral',
            text: 'On Kova, words have power. Each word you speak lights up the forest. Will you share your language with us?',
          },
          {
            type: 'choice',
            prompt: 'How does the crew respond?',
            options: [
              { text: '"We\'d love to! Teach us about your world."', fuelBonus: 10 },
              { text: '"What happened to the voices here?"', fuelBonus: 5 },
            ],
          },
        ],
      },
    ],
    encounters: ['encounter-spell-2'],
  },
};

// ============================================================================
// NPCs
// ============================================================================

export const npcs = {
  echo: {
    id: 'echo',
    name: 'Echo',
    role: 'Ship AI',
    portrait: null, // CSS gradient placeholder
    color: '#06B6D4', // cyan
  },
  alien: {
    id: 'alien',
    name: 'Koris',
    role: 'Keeper of Kova',
    portrait: null,
    color: '#A78BFA', // violet
  },
};

// ============================================================================
// ENCOUNTERS
// ============================================================================

export const encounters = {
  'encounter-spell-1': {
    id: 'encounter-spell-1',
    type: 'spell_duel',
    title: 'Power Up the Engines',
    description: 'Say each word clearly to charge the ship!',
    words: [
      { word: 'Adventure', phonetic: '/ədˈventʃər/' },
      { word: 'Explorer', phonetic: '/ɪkˈsplɔːrər/' },
      { word: 'Discovery', phonetic: '/dɪˈskʌvəri/' },
      { word: 'Journey', phonetic: '/ˈdʒɜːrni/' },
      { word: 'Universe', phonetic: '/ˈjuːnɪvɜːrs/' },
    ],
    timerSeconds: 45,
    fuelMultiplier: 2,
  },
  'encounter-spell-2': {
    id: 'encounter-spell-2',
    type: 'spell_duel',
    title: 'Light Up the Forest',
    description: 'Speak each word to illuminate Kova!',
    words: [
      { word: 'Crystal', phonetic: '/ˈkrɪstəl/' },
      { word: 'Luminous', phonetic: '/ˈluːmɪnəs/' },
      { word: 'Forest', phonetic: '/ˈfɒrɪst/' },
      { word: 'Ancient', phonetic: '/ˈeɪnʃənt/' },
      { word: 'Mystery', phonetic: '/ˈmɪstəri/' },
    ],
    timerSeconds: 45,
    fuelMultiplier: 2,
  },
};
