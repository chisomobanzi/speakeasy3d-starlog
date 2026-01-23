import { useState, useMemo, useCallback } from 'react';
import { ChevronLeft } from 'lucide-react';
import Button from '../ui/Button';

// Visual encoding for documentation status
const DOC_STATUS_STYLES = {
  verified: { scale: 1, opacity: 1, glow: true, coreColor: 'white' },
  documented: { scale: 0.8, opacity: 0.7, glow: false, coreColor: null },
  placeholder: { scale: 0.6, opacity: 0.5, glow: false, coreColor: null },
  gap: { scale: 0.5, opacity: 0.3, glow: false, coreColor: null },
};

// Generate background stars for depth effect
function generateStars(count = 100) {
  const stars = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: (Math.random() - 0.5) * 2.2,
      y: (Math.random() - 0.5) * 2.2,
      size: Math.random() * 0.008 + 0.002,
      opacity: Math.random() * 0.5 + 0.1,
    });
  }
  return stars;
}

// Golden angle spiral layout for words in a domain
function goldenAngleSpiral(index, total, radius = 0.7) {
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const angle = index * goldenAngle;
  const r = radius * Math.sqrt(index / total);
  return {
    x: Math.cos(angle) * r,
    y: Math.sin(angle) * r,
  };
}

// Calculate sector positions for domains
function calculateDomainSectors(domains) {
  const anglePerDomain = (2 * Math.PI) / domains.length;
  return domains.map((domain, i) => {
    const startAngle = i * anglePerDomain - Math.PI / 2;
    const midAngle = startAngle + anglePerDomain / 2;
    return {
      ...domain,
      startAngle,
      endAngle: startAngle + anglePerDomain,
      midAngle,
      labelX: Math.cos(midAngle) * 0.75,
      labelY: Math.sin(midAngle) * 0.75,
    };
  });
}

// Word node component
function WordNode({
  word,
  x,
  y,
  domain,
  isHovered,
  isSelected,
  isMultiDomain,
  onHover,
  onClick,
}) {
  const status = DOC_STATUS_STYLES[word.docStatus] || DOC_STATUS_STYLES.documented;
  const baseSize = 0.04;
  const size = baseSize * status.scale * (isSelected ? 1.5 : isHovered ? 1.2 : 1);
  const color = domain?.color || '#8b5cf6';

  return (
    <g
      className="cursor-pointer"
      transform={`translate(${x}, ${y})`}
      onMouseEnter={() => onHover(word.id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onClick(word)}
    >
      {/* Multi-domain indicator (dashed ring) */}
      {isMultiDomain && (
        <circle
          r={size * 1.5}
          fill="none"
          stroke={color}
          strokeWidth={0.003}
          strokeDasharray="0.01 0.005"
          opacity={0.6}
        />
      )}

      {/* Glow effect for verified words */}
      {status.glow && (
        <circle r={size * 1.5} fill={color} opacity={0.3}>
          <animate
            attributeName="opacity"
            values="0.3;0.15;0.3"
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>
      )}

      {/* Main circle */}
      <circle
        r={size}
        fill={color}
        opacity={isHovered || isSelected ? 1 : status.opacity}
        stroke={isSelected ? 'white' : 'none'}
        strokeWidth={0.005}
      />

      {/* White core for verified */}
      {status.coreColor && (
        <circle r={size * 0.3} fill={status.coreColor} opacity={0.9} />
      )}

      {/* Audio indicator */}
      {word.hasAudio && (
        <circle
          cx={size * 0.8}
          cy={-size * 0.8}
          r={0.008}
          fill="#22c55e"
        />
      )}
    </g>
  );
}

// Domain sector component
function DomainSector({ domain, vocabulary, isSelected, onSelect }) {
  const wordCount = vocabulary.filter(w => w.domains[0] === domain.id).length;

  // Create sector path
  const r = 0.95;
  const startX = Math.cos(domain.startAngle) * r;
  const startY = Math.sin(domain.startAngle) * r;
  const endX = Math.cos(domain.endAngle) * r;
  const endY = Math.sin(domain.endAngle) * r;
  const largeArc = domain.endAngle - domain.startAngle > Math.PI ? 1 : 0;

  const sectorPath = `
    M 0 0
    L ${startX} ${startY}
    A ${r} ${r} 0 ${largeArc} 1 ${endX} ${endY}
    Z
  `;

  return (
    <g
      className="cursor-pointer"
      onClick={() => onSelect(domain)}
    >
      {/* Sector fill on hover */}
      <path
        d={sectorPath}
        fill={domain.color}
        opacity={isSelected ? 0.2 : 0}
        className="transition-opacity duration-200 hover:opacity-15"
      />

      {/* Sector divider line */}
      <line
        x1={0}
        y1={0}
        x2={Math.cos(domain.startAngle) * r}
        y2={Math.sin(domain.startAngle) * r}
        stroke="white"
        strokeWidth={0.003}
        opacity={0.1}
      />

      {/* Domain label */}
      <g transform={`translate(${domain.labelX}, ${domain.labelY})`}>
        <text
          className="select-none pointer-events-none"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="white"
          fontSize={0.06}
          fontWeight="600"
          opacity={0.9}
        >
          {domain.icon}
        </text>
        <text
          className="select-none pointer-events-none"
          textAnchor="middle"
          y={0.09}
          fill="white"
          fontSize={0.04}
          fontWeight="500"
          opacity={0.7}
        >
          {domain.nameLocal}
        </text>
        <text
          className="select-none pointer-events-none"
          textAnchor="middle"
          y={0.14}
          fill={domain.color}
          fontSize={0.03}
          opacity={0.9}
        >
          {wordCount} words
        </text>
      </g>
    </g>
  );
}

export default function LanguageConstellation({
  taxonomy,
  vocabulary,
  viewMode = 'overview',
  selectedDomain = null,
  selectedWord = null,
  hoveredWord = null,
  onHoverWord,
  onSelectDomain,
  onSelectWord,
  onBack,
  className = '',
}) {
  const [stars] = useState(() => generateStars(80));

  // Calculate domain sectors
  const domainSectors = useMemo(
    () => calculateDomainSectors(taxonomy.domains),
    [taxonomy.domains]
  );

  // Get domain map for quick lookup
  const domainMap = useMemo(() => {
    const map = {};
    taxonomy.domains.forEach(d => {
      map[d.id] = d;
    });
    return map;
  }, [taxonomy.domains]);

  // Calculate word positions based on view mode
  const wordPositions = useMemo(() => {
    if (viewMode === 'overview') {
      // In overview, words are positioned in their primary domain sector
      const positions = {};
      const domainWordCounts = {};

      // Count words per domain
      vocabulary.forEach(word => {
        const primaryDomain = word.domains[0];
        domainWordCounts[primaryDomain] = (domainWordCounts[primaryDomain] || 0) + 1;
      });

      // Reset counters
      const domainWordIndices = {};

      vocabulary.forEach(word => {
        const primaryDomain = word.domains[0];
        const domain = domainSectors.find(d => d.id === primaryDomain);
        if (!domain) return;

        const index = domainWordIndices[primaryDomain] || 0;
        domainWordIndices[primaryDomain] = index + 1;
        const total = domainWordCounts[primaryDomain];

        // Spiral within the domain sector
        const spiral = goldenAngleSpiral(index + 1, total + 1, 0.5);
        const sectorAngle = domain.midAngle;

        // Rotate spiral position to be within the domain sector
        const cos = Math.cos(sectorAngle);
        const sin = Math.sin(sectorAngle);
        const x = spiral.x * cos - spiral.y * sin;
        const y = spiral.x * sin + spiral.y * cos;

        positions[word.id] = { x: x * 0.6, y: y * 0.6 };
      });

      return positions;
    }

    if (viewMode === 'domain' && selectedDomain) {
      // In domain view, show words in selected domain in spiral
      const positions = {};
      const domainWords = vocabulary.filter(w => w.domains.includes(selectedDomain.id));

      domainWords.forEach((word, index) => {
        const pos = goldenAngleSpiral(index + 1, domainWords.length + 1, 0.75);
        positions[word.id] = pos;
      });

      return positions;
    }

    if (viewMode === 'word' && selectedWord) {
      // In word view, center selected word with connections around it
      const positions = {};
      positions[selectedWord.id] = { x: 0, y: 0 };

      // Find connected words
      const connections = selectedWord.connections || [];
      const connectedWords = vocabulary.filter(
        w => connections.includes(w.word) || connections.includes(w.id)
      );

      connectedWords.forEach((word, index) => {
        const angle = (index / connectedWords.length) * Math.PI * 2 - Math.PI / 2;
        positions[word.id] = {
          x: Math.cos(angle) * 0.5,
          y: Math.sin(angle) * 0.5,
        };
      });

      return positions;
    }

    return {};
  }, [viewMode, selectedDomain, selectedWord, vocabulary, domainSectors]);

  // Get visible words based on view mode
  const visibleWords = useMemo(() => {
    if (viewMode === 'overview') {
      return vocabulary;
    }
    if (viewMode === 'domain' && selectedDomain) {
      return vocabulary.filter(w => w.domains.includes(selectedDomain.id));
    }
    if (viewMode === 'word' && selectedWord) {
      const connections = selectedWord.connections || [];
      const connectedWords = vocabulary.filter(
        w => connections.includes(w.word) || connections.includes(w.id)
      );
      return [selectedWord, ...connectedWords];
    }
    return [];
  }, [viewMode, selectedDomain, selectedWord, vocabulary]);

  // Get connection lines for word view
  const connectionLines = useMemo(() => {
    if (viewMode !== 'word' || !selectedWord) return [];

    const connections = selectedWord.connections || [];
    const lines = [];

    connections.forEach(connId => {
      const connWord = vocabulary.find(w => w.word === connId || w.id === connId);
      if (connWord && wordPositions[connWord.id]) {
        lines.push({
          from: wordPositions[selectedWord.id],
          to: wordPositions[connWord.id],
          color: domainMap[connWord.domains[0]]?.color || '#8b5cf6',
        });
      }
    });

    return lines;
  }, [viewMode, selectedWord, vocabulary, wordPositions, domainMap]);

  // Get hovered word info for tooltip
  const hoveredWordInfo = useMemo(() => {
    if (!hoveredWord) return null;
    return vocabulary.find(w => w.id === hoveredWord);
  }, [hoveredWord, vocabulary]);

  // Build breadcrumb
  const breadcrumb = useMemo(() => {
    const parts = [{ label: taxonomy.name, onClick: onBack }];
    if (selectedDomain) {
      parts.push({ label: selectedDomain.nameLocal, onClick: () => onBack?.() });
    }
    if (selectedWord) {
      parts.push({ label: selectedWord.word });
    }
    return parts;
  }, [taxonomy.name, selectedDomain, selectedWord, onBack]);

  return (
    <div className={`relative bg-slate-950 rounded-xl overflow-hidden ${className}`}>
      {/* Header with breadcrumb and back button */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center gap-2">
        {viewMode !== 'overview' && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
        )}
        <div className="flex items-center gap-1 text-sm text-slate-400 overflow-hidden">
          {breadcrumb.map((part, i) => (
            <span key={i} className="flex items-center">
              {i > 0 && <span className="mx-1 opacity-50">/</span>}
              {part.onClick && i < breadcrumb.length - 1 ? (
                <button
                  onClick={part.onClick}
                  className="hover:text-white transition-colors truncate"
                >
                  {part.label}
                </button>
              ) : (
                <span className="text-white font-medium truncate">{part.label}</span>
              )}
            </span>
          ))}
        </div>
      </div>

      {/* SVG Constellation */}
      <svg
        viewBox="-1.1 -1.1 2.2 2.2"
        className="w-full aspect-square"
        style={{ background: 'radial-gradient(ellipse at center, #1e293b 0%, #0f172a 70%, #020617 100%)' }}
      >
        {/* Background stars */}
        <g className="stars">
          {stars.map((star, i) => (
            <circle
              key={i}
              cx={star.x}
              cy={star.y}
              r={star.size}
              fill="white"
              opacity={star.opacity}
            />
          ))}
        </g>

        {/* Domain sectors (overview mode) */}
        {viewMode === 'overview' && (
          <g className="domain-sectors">
            {domainSectors.map(domain => (
              <DomainSector
                key={domain.id}
                domain={domain}
                vocabulary={vocabulary}
                isSelected={selectedDomain?.id === domain.id}
                onSelect={onSelectDomain}
              />
            ))}
          </g>
        )}

        {/* Domain view: show domain info at center */}
        {viewMode === 'domain' && selectedDomain && (
          <g className="domain-center">
            <text
              textAnchor="middle"
              dominantBaseline="middle"
              fill="white"
              fontSize={0.12}
            >
              {selectedDomain.icon}
            </text>
            <text
              textAnchor="middle"
              y={0.15}
              fill={selectedDomain.color}
              fontSize={0.06}
              fontWeight="600"
            >
              {selectedDomain.nameLocal}
            </text>
          </g>
        )}

        {/* Connection lines (word view) */}
        {connectionLines.map((line, i) => (
          <line
            key={i}
            x1={line.from.x}
            y1={line.from.y}
            x2={line.to.x}
            y2={line.to.y}
            stroke={line.color}
            strokeWidth={0.004}
            opacity={0.4}
            strokeDasharray="0.02 0.01"
          />
        ))}

        {/* Word nodes */}
        <g className="word-nodes">
          {visibleWords.map(word => {
            const pos = wordPositions[word.id];
            if (!pos) return null;

            const primaryDomain = domainMap[word.domains[0]];
            const isHovered = hoveredWord === word.id;
            const isSelected = selectedWord?.id === word.id;
            const isMultiDomain = word.domains.length > 1;

            return (
              <WordNode
                key={word.id}
                word={word}
                x={pos.x}
                y={pos.y}
                domain={primaryDomain}
                isHovered={isHovered}
                isSelected={isSelected}
                isMultiDomain={isMultiDomain}
                onHover={onHoverWord}
                onClick={onSelectWord}
              />
            );
          })}
        </g>
      </svg>

      {/* Hover tooltip */}
      {hoveredWordInfo && (
        <div className="absolute bottom-3 left-3 right-3 bg-slate-900/90 backdrop-blur-sm rounded-lg p-3 border border-slate-700">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-white font-medium">{hoveredWordInfo.word}</p>
              <p className="text-slate-400 text-sm">{hoveredWordInfo.translation}</p>
              {hoveredWordInfo.phonetic && (
                <p className="text-slate-500 text-xs mt-0.5">/{hoveredWordInfo.phonetic}/</p>
              )}
            </div>
            <div className="flex gap-1">
              {hoveredWordInfo.domains.map(domainId => {
                const domain = domainMap[domainId];
                return domain ? (
                  <span
                    key={domainId}
                    className="text-xs px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: domain.color + '30', color: domain.color }}
                  >
                    {domain.icon}
                  </span>
                ) : null;
              })}
            </div>
          </div>
        </div>
      )}

      {/* Legend (overview mode) */}
      {viewMode === 'overview' && (
        <div className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-sm rounded-lg p-2 border border-slate-800">
          <div className="flex gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-white shadow-[0_0_4px_white]" />
              verified
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              documented
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-slate-600" />
              gap
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
