import { useState, useMemo, useCallback } from 'react';

// ============================================================================
// SRS STATES & VISUAL ENCODING
// ============================================================================

const SRS_STATES = {
  NEW: 'new',
  LEARNING: 'learning',
  REVIEW_DUE: 'reviewDue',
  MASTERED: 'mastered',
  LAPSED: 'lapsed',
};

const SRS_VISUALS = {
  [SRS_STATES.NEW]: {
    brightness: 0.2,
    size: 0.6,
    glow: false,
    pulse: false,
    color: 'base',
    coreWhite: false,
  },
  [SRS_STATES.LEARNING]: {
    brightness: 0.5,
    size: 0.8,
    glow: false,
    pulse: false,
    color: 'base',
    coreWhite: false,
  },
  [SRS_STATES.REVIEW_DUE]: {
    brightness: 0.9,
    size: 1.0,
    glow: true,
    pulse: true,
    color: 'warm',
    coreWhite: false,
  },
  [SRS_STATES.MASTERED]: {
    brightness: 1.0,
    size: 1.0,
    glow: true,
    pulse: false,
    color: 'base',
    coreWhite: true,
  },
  [SRS_STATES.LAPSED]: {
    brightness: 0.4,
    size: 0.7,
    glow: false,
    pulse: false,
    color: 'cold',
    coreWhite: false,
  },
};

// ============================================================================
// UTILITIES
// ============================================================================

const hashString = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
};

const seededRandom = (seed) => {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
};

// Map entry SRS state to visual state
const getVisualState = (entry) => {
  if (!entry) return SRS_STATES.NEW;

  const { srs_state, mastery_level, next_review_at } = entry;
  const isDue = next_review_at ? new Date() >= new Date(next_review_at) : false;
  const mastery = mastery_level || 0;

  if (srs_state === 'pending' || srs_state === 'new') {
    if (mastery < 0.2) return SRS_STATES.NEW;
    return SRS_STATES.LEARNING;
  }

  if (srs_state === 'learning') {
    if (isDue) return SRS_STATES.REVIEW_DUE;
    if (mastery < 0.4) return SRS_STATES.LAPSED;
    return SRS_STATES.LEARNING;
  }

  if (srs_state === 'mastered') {
    if (isDue) return SRS_STATES.REVIEW_DUE;
    return SRS_STATES.MASTERED;
  }

  // Default logic based on mastery
  if (isDue) return SRS_STATES.REVIEW_DUE;
  if (mastery >= 0.85) return SRS_STATES.MASTERED;
  if (mastery < 0.3) return SRS_STATES.LAPSED;
  if (mastery < 0.5) return SRS_STATES.NEW;
  return SRS_STATES.LEARNING;
};

// ============================================================================
// DATA GENERATION
// ============================================================================

const generateConstellationData = (entries, config = {}) => {
  const {
    rings = 6,
    baseRadius = 0.12,
    ringSpacing = 0.11,
  } = config;

  if (!entries || entries.length === 0) return { points: [] };

  // Sort by mastery (highest mastery = inner rings)
  const sorted = [...entries].sort((a, b) =>
    (b.mastery_level || 0) - (a.mastery_level || 0)
  );

  const wordsPerRing = Math.ceil(sorted.length / rings);
  const points = [];

  // Assign words to rings
  const ringAssignments = Array.from({ length: rings }, () => []);

  sorted.forEach((entry, index) => {
    const ringIndex = Math.min(Math.floor(index / wordsPerRing), rings - 1);
    ringAssignments[ringIndex].push({ ...entry, globalIndex: index });
  });

  // Distribute each ring's words evenly around 360 degrees
  ringAssignments.forEach((ringWords, ringIndex) => {
    const radius = baseRadius + ringIndex * ringSpacing;
    const wordCountInRing = ringWords.length;

    ringWords.forEach((entry, posInRing) => {
      const baseAngle = (posInRing / wordCountInRing) * Math.PI * 2;
      const ringOffset = ringIndex * 0.4;
      const seed = hashString(entry.word || `entry-${entry.id}`);
      const jitterAmount = (Math.PI * 2) / Math.max(wordCountInRing, 8) * 0.3;
      const angleJitter = (seededRandom(seed) - 0.5) * jitterAmount;

      const angle = baseAngle + ringOffset + angleJitter;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      const visualState = getVisualState(entry);
      const srsVisuals = SRS_VISUALS[visualState];

      points.push({
        ...entry,
        x, y,
        radius, angle,
        ring: ringIndex,
        visualState,
        srsVisuals,
      });
    });
  });

  return { points };
};

// ============================================================================
// ORNAMENTAL CONNECTION GENERATOR
// ============================================================================

const generateOrnamentalConnections = (points, config = {}) => {
  const { arcDensity = 0.6, spokeDensity = 0.5 } = config;

  const connections = [];
  const usedPairs = new Set();

  points.forEach((p1, i) => {
    points.forEach((p2, j) => {
      if (i >= j) return;

      const pairId = `${i}-${j}`;
      if (usedPairs.has(pairId)) return;

      const dist = Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
      const isSameRing = p1.ring === p2.ring;
      const isAdjacentRing = Math.abs(p1.ring - p2.ring) === 1;

      // Ring arcs
      if (isSameRing && dist < 0.4) {
        const angleDiff = Math.abs(p1.angle - p2.angle);
        const adjustedDiff = Math.min(angleDiff, Math.PI * 2 - angleDiff);

        if (adjustedDiff < Math.PI / 2.5 && seededRandom(i * 100 + j) > (1 - arcDensity)) {
          usedPairs.add(pairId);
          connections.push({
            p1, p2,
            type: 'arc',
            opacity: 0.25 + seededRandom(i * 50 + j) * 0.2,
          });
        }
      }

      // Radial spokes
      if (isAdjacentRing && dist < 0.28) {
        const angleDiff = Math.abs(p1.angle - p2.angle);
        const adjustedDiff = Math.min(angleDiff, Math.PI * 2 - angleDiff);

        if (adjustedDiff < Math.PI / 4 && seededRandom(i * 200 + j) > (1 - spokeDensity)) {
          usedPairs.add(pairId);
          connections.push({
            p1, p2,
            type: 'line',
            opacity: 0.15 + seededRandom(i * 70 + j) * 0.15,
          });
        }
      }
    });
  });

  return connections;
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ConstellationView({
  entries,
  deckName = "My Deck",
  deckColor = "#06b6d4",
  onSelectEntry,
}) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const { points } = useMemo(() => {
    return generateConstellationData(entries);
  }, [entries]);

  const connections = useMemo(() => {
    return generateOrnamentalConnections(points);
  }, [points]);

  // Stats
  const stats = useMemo(() => {
    const byState = {};
    Object.values(SRS_STATES).forEach(s => byState[s] = 0);
    points.forEach(p => byState[p.visualState]++);
    const avgMastery = entries.length > 0
      ? entries.reduce((s, e) => s + (e.mastery_level || 0), 0) / entries.length
      : 0;
    return { byState, avgMastery };
  }, [points, entries]);

  const getNodeColor = useCallback((point) => {
    const { srsVisuals } = point;
    switch (srsVisuals.color) {
      case 'warm': return '#f59e0b';
      case 'cold': return '#64748b';
      default: return deckColor;
    }
  }, [deckColor]);

  const hovered = hoveredPoint !== null ? points.find(p => p.id === hoveredPoint) : null;

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-500">
        <div className="w-24 h-24 rounded-full bg-slate-800/50 flex items-center justify-center mb-4">
          <div className="w-8 h-8 rounded-full bg-slate-700" />
        </div>
        <p>Add words to see your constellation</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Constellation SVG */}
      <div className="relative">
        <svg
          viewBox="-1.1 -1.1 2.2 2.2"
          className="w-full aspect-square rounded-2xl"
          style={{ background: 'radial-gradient(ellipse at center, #0f172a 0%, #020617 100%)' }}
        >
          <defs>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="0.015" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Ambient stars */}
          {[...Array(40)].map((_, i) => (
            <circle
              key={`star-${i}`}
              cx={(seededRandom(i * 37) - 0.5) * 2.2}
              cy={(seededRandom(i * 73) - 0.5) * 2.2}
              r={seededRandom(i * 13) * 0.003 + 0.001}
              fill={`rgba(255, 255, 255, ${seededRandom(i * 91) * 0.2 + 0.05})`}
            />
          ))}

          {/* Outer boundary */}
          <circle
            cx="0" cy="0" r="0.95"
            fill="rgba(15, 23, 42, 0.9)"
            stroke="rgba(100, 120, 180, 0.2)"
            strokeWidth="0.008"
          />

          {/* Ring guides */}
          {[1, 2, 3, 4, 5, 6].map(ring => (
            <circle
              key={`ring-${ring}`}
              cx="0" cy="0"
              r={0.12 + (ring - 1) * 0.11}
              fill="none"
              stroke="rgba(80, 100, 150, 0.08)"
              strokeWidth="0.003"
              strokeDasharray="0.015 0.01"
            />
          ))}

          {/* Ornamental connections */}
          {connections.map((conn, i) => {
            const { p1, p2, type, opacity } = conn;

            if (type === 'arc') {
              const r = p1.radius;
              let angleDiff = p2.angle - p1.angle;
              if (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
              if (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
              if (Math.abs(angleDiff) > 1.5) return null;

              const largeArc = Math.abs(angleDiff) > Math.PI ? 1 : 0;
              const sweep = angleDiff > 0 ? 1 : 0;

              return (
                <path
                  key={`conn-${i}`}
                  d={`M ${p1.x} ${p1.y} A ${r} ${r} 0 ${largeArc} ${sweep} ${p2.x} ${p2.y}`}
                  fill="none"
                  stroke={deckColor}
                  strokeWidth="0.005"
                  strokeLinecap="round"
                  opacity={opacity}
                />
              );
            }

            return (
              <line
                key={`conn-${i}`}
                x1={p1.x} y1={p1.y}
                x2={p2.x} y2={p2.y}
                stroke={deckColor}
                strokeWidth="0.004"
                strokeLinecap="round"
                opacity={opacity}
              />
            );
          })}

          {/* Word nodes */}
          {points.map((point) => {
            const { srsVisuals } = point;
            const isHovered = hoveredPoint === point.id;
            const size = 0.022 * srsVisuals.size;
            const color = getNodeColor(point);

            return (
              <g key={`node-${point.id}`}>
                {/* Outer glow */}
                {srsVisuals.glow && (
                  <circle
                    cx={point.x} cy={point.y}
                    r={size * 2.5}
                    fill={color}
                    opacity={srsVisuals.brightness * 0.2}
                    filter="url(#glow)"
                  />
                )}

                {/* Pulse ring (review due) */}
                {srsVisuals.pulse && (
                  <circle
                    cx={point.x} cy={point.y}
                    r={size * 2}
                    fill="none"
                    stroke={color}
                    strokeWidth="0.004"
                    opacity={srsVisuals.brightness * 0.5}
                  >
                    <animate
                      attributeName="r"
                      values={`${size * 1.5};${size * 2.5};${size * 1.5}`}
                      dur="2s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values={`${srsVisuals.brightness * 0.5};${srsVisuals.brightness * 0.1};${srsVisuals.brightness * 0.5}`}
                      dur="2s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}

                {/* Main node */}
                <circle
                  cx={point.x} cy={point.y}
                  r={isHovered ? size * 1.5 : size}
                  fill={color}
                  opacity={srsVisuals.brightness}
                  className="cursor-pointer transition-all duration-150"
                  onMouseEnter={() => setHoveredPoint(point.id)}
                  onMouseLeave={() => setHoveredPoint(null)}
                  onClick={() => onSelectEntry?.(point)}
                />

                {/* White core (mastered) */}
                {srsVisuals.coreWhite && (
                  <circle
                    cx={point.x} cy={point.y}
                    r={size * 0.4}
                    fill="white"
                    opacity={srsVisuals.brightness * 0.9}
                  />
                )}
              </g>
            );
          })}

          {/* Central orb */}
          <g filter="url(#glow)">
            <circle cx="0" cy="0" r="0.07" fill={deckColor} opacity="0.3" />
            <circle cx="0" cy="0" r="0.045" fill="white" opacity={0.6 + stats.avgMastery * 0.4} />
            <circle cx="0" cy="0" r="0.02" fill="white" opacity="0.95" />
          </g>

          {/* Labels */}
          <text
            x="0" y="0.88"
            textAnchor="middle"
            fill="white"
            fontSize="0.055"
            fontWeight="bold"
            fontFamily="system-ui, sans-serif"
          >
            {deckName}
          </text>
          <text
            x="0" y="0.95"
            textAnchor="middle"
            fill="rgba(150, 150, 180, 0.7)"
            fontSize="0.032"
            fontFamily="system-ui, sans-serif"
          >
            {entries.length} words
          </text>
        </svg>

        {/* Hover tooltip */}
        {hovered && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-md rounded-xl p-4 border border-slate-700/50 shadow-2xl z-10 min-w-[200px]">
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: getNodeColor(hovered) }}
              />
              <span className="text-xl font-bold text-white">{hovered.word}</span>
            </div>
            <p className="text-cyan-400 mb-2">{hovered.translation}</p>
            <div className="flex gap-4 text-sm text-slate-400">
              <span>Mastery: {Math.round((hovered.mastery_level || 0) * 100)}%</span>
              <span className="capitalize">{hovered.visualState.replace(/([A-Z])/g, ' $1')}</span>
            </div>
          </div>
        )}
      </div>

      {/* SRS Legend */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
        <h4 className="text-sm font-medium text-slate-400 mb-3">Star States</h4>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(SRS_STATES).map(([key, value]) => {
            const visual = SRS_VISUALS[value];
            const count = stats.byState[value] || 0;

            return (
              <div key={key} className="flex items-center gap-2 text-sm">
                <div className="relative w-4 h-4 flex items-center justify-center">
                  <div
                    className="rounded-full"
                    style={{
                      width: `${12 * visual.size}px`,
                      height: `${12 * visual.size}px`,
                      backgroundColor: visual.color === 'warm' ? '#f59e0b' : visual.color === 'cold' ? '#64748b' : deckColor,
                      opacity: visual.brightness,
                    }}
                  />
                  {visual.coreWhite && (
                    <div className="absolute w-1.5 h-1.5 bg-white rounded-full" />
                  )}
                </div>
                <span className="text-slate-300 capitalize flex-1">
                  {value.replace(/([A-Z])/g, ' $1')}
                </span>
                <span className="text-slate-500">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
