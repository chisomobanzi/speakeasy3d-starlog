import { useState, useMemo, useCallback } from 'react';
import { BUILTIN_SOURCE_MAP } from '../../lib/builtinSources';

// Seeded PRNG matching the mockup
function seededRandom(seed) {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
}

// SVG viewBox: 0 0 800 800
const CX = 400, CY = 400, DOMAIN_RADIUS = 280, SECTOR_SPREAD = 36;

export default function PublicConstellation({
  language,
  taxonomy,
  vocabulary,
  selectedDomain = null,
  hoveredWord = null,
  pulseMap = {},
  isLive = false,
  recentSignals = [],
  colorMode = 'domain',
  showConnections = true,
  onHoverWord,
  onSelectDomain,
  // Search integration props
  highlightedIds = null,
  searchActive = false,
  onStarClick,
  // Source registry map (falls back to BUILTIN_SOURCE_MAP)
  sourceMap,
}) {
  const resolvedSourceMap = sourceMap || BUILTIN_SOURCE_MAP;
  // Compute star positions using angular layout (matches mockup)
  const stars = useMemo(() => {
    return vocabulary.map((w, i) => {
      const domain = taxonomy.domains.find(d => d.id === w.domains[0]);
      if (!domain) return null;

      const isExternal = w._isSearchResult;
      const lowConfidence = isExternal && (w._confidence || 0) < 0.5;

      const rng = seededRandom(i * 7919 + (w.word.charCodeAt(0) || 0) * 31);
      const baseAngle = domain.angle ?? 0;
      const jitter = (rng() - 0.5) * SECTOR_SPREAD * 2;
      const angle = ((baseAngle + jitter) * Math.PI) / 180;

      // Low-confidence external stars go to inner ring
      let dist;
      if (lowConfidence) {
        dist = 60 + rng() * 60; // radius 60-120
      } else {
        dist = 60 + rng() * (DOMAIN_RADIUS - 90);
      }

      const px = CX + Math.cos(angle) * dist;
      const py = CY + Math.sin(angle) * dist;
      const srcEntry = resolvedSourceMap.get(w.source) || resolvedSourceMap.get('dictionary');
      const srcStyle = {
        scale: srcEntry?.scale ?? 0.8,
        opacity: srcEntry?.opacity ?? 0.7,
        glow: srcEntry?.glow ?? false,
        coreColor: srcEntry?.core_color ?? '#7BA3E0',
        symbol: srcEntry?.symbol ?? '\u25CF',
        label: srcEntry?.name ?? w.source,
      };

      let size = w.source === 'elder' ? 6 : w.source === 'community' ? 5 : w.source === 'dictionary' ? 4 : 3;
      if (isExternal) size = size * 0.7;

      return { ...w, px, py, size, idx: i, srcStyle, domainColor: domain.color, _isExternal: isExternal };
    }).filter(Boolean);
  }, [vocabulary, taxonomy.domains, resolvedSourceMap]);

  const crossLinks = useMemo(() => stars.filter(s => s.domains.length > 1).length, [stars]);

  // Connection lines for hovered word
  const connectionPaths = useMemo(() => {
    if (!showConnections || !hoveredWord) return [];
    const hw = stars.find(s => s.id === hoveredWord);
    if (!hw || hw.domains.length <= 1) return [];
    const paths = [];
    hw.domains.slice(1).forEach(tid => {
      const td = taxonomy.domains.find(d => d.id === tid);
      if (!td) return;
      const angle = ((td.angle ?? 0) * Math.PI) / 180;
      const tx = CX + Math.cos(angle) * (DOMAIN_RADIUS + 10);
      const ty = CY + Math.sin(angle) * (DOMAIN_RADIUS + 10);
      const rng = seededRandom(hw.idx * 100 + (tid.charCodeAt?.(0) || 0));
      const mx = (hw.px + tx) / 2 + (rng() - 0.5) * 30;
      const my = (hw.py + ty) / 2 + (rng() - 0.5) * 30;
      paths.push({
        d: `M ${hw.px} ${hw.py} Q ${mx} ${my} ${tx} ${ty}`,
        color: td.color,
      });
    });
    return paths;
  }, [hoveredWord, stars, showConnections, taxonomy.domains]);

  const hoveredWordInfo = useMemo(() => {
    if (!hoveredWord) return null;
    return stars.find(s => s.id === hoveredWord);
  }, [hoveredWord, stars]);

  return (
    <div className="relative w-full h-full" style={{ fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace" }}>
      {/* Title bar */}
      <div className="absolute top-3 left-3 right-3 z-10 flex justify-between items-start">
        <div>
          <h1 className="text-sm font-extrabold tracking-wider text-white">
            {language?.name || 'chiShona'} Language Constellation
          </h1>
          <div className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {stars.length} words &times; 9 SIL semantic domains &times; {crossLinks} cross-domain links
            {isLive && (
              <span className="ml-2 text-emerald-400">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1" />
                LIVE
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Recent signal ticker */}
      {recentSignals.length > 0 && (
        <div className="absolute top-10 left-3 z-10">
          <div className="text-[10px] px-2 py-1 rounded" style={{ background: 'rgba(10,12,20,0.8)', color: 'rgba(255,255,255,0.4)' }}>
            {recentSignals[0].word} <span style={{ color: 'rgba(255,255,255,0.25)' }}>appeared in Wikipedia edit</span>
          </div>
        </div>
      )}

      {/* SVG */}
      <svg
        viewBox="0 0 800 800"
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full block"
        style={{ background: 'transparent' }}
      >
        {/* Defs */}
        <defs>
          <radialGradient id="coreGlow">
            <stop offset="0%" stopColor="rgba(255,255,255,0.08)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
        </defs>

        {/* Central glow */}
        <circle cx={CX} cy={CY} r={80} fill="url(#coreGlow)" />
        <circle cx={CX} cy={CY} r={4} fill="rgba(255,255,255,0.2)" />

        {/* Orbit guides */}
        {[100, 180, 260].map(r => (
          <circle key={r} cx={CX} cy={CY} r={r} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth={0.5} />
        ))}

        {/* Sector lines */}
        {taxonomy.domains.map(d => {
          const angle = ((d.angle ?? 0) * Math.PI) / 180;
          const x2 = CX + Math.cos(angle) * (DOMAIN_RADIUS + 5);
          const y2 = CY + Math.sin(angle) * (DOMAIN_RADIUS + 5);
          const isSel = selectedDomain === d.id;
          return (
            <line key={d.id} x1={CX} y1={CY} x2={x2} y2={y2}
              stroke={d.color} strokeWidth={isSel ? 0.6 : 0.15} opacity={isSel ? 0.5 : 0.2} />
          );
        })}

        {/* Connection lines for hovered word */}
        {connectionPaths.map((p, i) => (
          <path key={i} d={p.d} fill="none" stroke={p.color}
            strokeWidth={1.2} opacity={0.5} strokeDasharray="4,3" />
        ))}

        {/* Stars */}
        {stars.map(star => {
          const isSel = selectedDomain;
          const isInSelected = isSel ? star.domains[0] === isSel : true;
          const isSecondary = isSel ? star.domains.includes(isSel) && star.domains[0] !== isSel : false;
          const isHovered = hoveredWord === star.id;
          const isDimmed = isSel && !isInSelected && !isSecondary;
          const fillColor = colorMode === 'source' ? star.srcStyle.coreColor || '#7BA3E0' : star.domainColor;

          // Search highlighting
          const isHighlighted = highlightedIds?.has(star.id);
          const isExternal = star._isExternal;

          // Opacity: search mode dims non-highlighted/non-external stars
          let opacity;
          if (searchActive && highlightedIds) {
            if (isHighlighted) opacity = 1;
            else if (isExternal) opacity = 0.6;
            else opacity = 0.15;
          } else {
            opacity = isDimmed ? 0.12 : isSecondary ? 0.7 : 1;
          }

          const glowSize = isHighlighted ? star.size * 6 : isHovered ? star.size * 5 : star.size * 2.5;

          // Pulse from Wikipedia signals
          const pulse = pulseMap[star.id];
          const pulseIntensity = pulse ? Math.min(1, pulse.count / 10) : 0;

          return (
            <g key={star.id} opacity={opacity} style={{ transition: 'opacity 0.3s ease' }}>
              {/* Glow */}
              <circle cx={star.px} cy={star.py} r={glowSize} fill={fillColor}
                opacity={isHighlighted ? 0.4 : isHovered ? 0.35 : 0.12} />

              {/* Highlighted pulse ring */}
              {isHighlighted && (
                <circle cx={star.px} cy={star.py} r={star.size * 2.5} fill="none"
                  stroke={fillColor} strokeWidth={1} opacity={0.7}>
                  <animate attributeName="r" values={`${star.size * 2};${star.size * 4};${star.size * 2}`}
                    dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.7;0.15;0.7"
                    dur="2s" repeatCount="indefinite" />
                </circle>
              )}

              {/* Wikipedia pulse ring */}
              {pulseIntensity > 0.05 && !isHighlighted && (
                <circle cx={star.px} cy={star.py} r={star.size * 2} fill="none"
                  stroke={fillColor} strokeWidth={0.8} opacity={pulseIntensity * 0.6}>
                  <animate attributeName="r" values={`${star.size * 1.5};${star.size * 3};${star.size * 1.5}`}
                    dur={`${2.5 - pulseIntensity * 2}s`} repeatCount="indefinite" />
                  <animate attributeName="opacity" values={`${pulseIntensity * 0.6};${pulseIntensity * 0.1};${pulseIntensity * 0.6}`}
                    dur={`${2.5 - pulseIntensity * 2}s`} repeatCount="indefinite" />
                </circle>
              )}

              {/* Core */}
              <circle cx={star.px} cy={star.py} r={star.size}
                fill={star.source === 'elder' ? '#FFFFFF' : fillColor}
                stroke={isSecondary ? '#FFFFFF' : fillColor}
                strokeWidth={isHighlighted ? 2 : isHovered ? 1.5 : 0.5}
                opacity={star.srcStyle.opacity} />

              {/* Elder white center */}
              {star.source === 'elder' && (
                <circle cx={star.px} cy={star.py} r={star.size * 0.45} fill="#FFFFFF" opacity={0.95} />
              )}

              {/* External search result: dashed ring */}
              {isExternal && (
                <circle cx={star.px} cy={star.py} r={star.size + 3}
                  fill="none" stroke={fillColor} strokeWidth={0.7} strokeDasharray="2,2" opacity={0.5} />
              )}

              {/* Secondary dashed ring (cross-domain) */}
              {isSecondary && !isExternal && (
                <circle cx={star.px} cy={star.py} r={star.size + 3}
                  fill="none" stroke="#FFFFFF" strokeWidth={0.7} strokeDasharray="2,2" opacity={0.6} />
              )}

              {/* Hit area */}
              <circle cx={star.px} cy={star.py} r={Math.max(star.size * 3, 10)}
                fill="transparent" className="cursor-pointer"
                onMouseEnter={() => onHoverWord(star.id)}
                onMouseLeave={() => onHoverWord(null)}
                onClick={() => {
                  if (onStarClick) {
                    onStarClick(star);
                  } else {
                    onSelectDomain(star.domains[0] === selectedDomain ? null : star.domains[0]);
                  }
                }}
              />
            </g>
          );
        })}

        {/* Domain arcs and labels */}
        {taxonomy.domains.map(d => {
          const count = stars.filter(s => s.domains[0] === d.id).length;
          const angle = ((d.angle ?? 0) * Math.PI) / 180;
          const coverage = d.expected ? count / d.expected : 0;
          const labelR = DOMAIN_RADIUS + 28;
          const lx = CX + Math.cos(angle) * labelR;
          const ly = CY + Math.sin(angle) * labelR;
          const arcR = DOMAIN_RADIUS + 8;
          const arcSpread = (SECTOR_SPREAD * Math.PI) / 180;
          const sa = angle - arcSpread;
          const eaFull = angle + arcSpread;
          const eaCov = sa + (eaFull - sa) * coverage;
          const isSel = selectedDomain === d.id;
          const pct = Math.round(coverage * 100);
          const isCritical = pct < 15;

          const arcPath = (r, a1, a2) => {
            const x1 = CX + Math.cos(a1) * r, y1 = CY + Math.sin(a1) * r;
            const x2 = CX + Math.cos(a2) * r, y2 = CY + Math.sin(a2) * r;
            const large = a2 - a1 > Math.PI ? 1 : 0;
            return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
          };

          return (
            <g key={d.id}>
              {/* Expected arc (dashed) */}
              <path d={arcPath(arcR, sa, eaFull)} fill="none" stroke={d.color}
                strokeWidth={2} opacity={isSel ? 0.5 : 0.15} strokeDasharray="3,4" />
              {/* Coverage arc */}
              <path d={arcPath(arcR, sa, eaCov)} fill="none" stroke={d.color}
                strokeWidth={isSel ? 4 : 2.5} opacity={isSel ? 1 : 0.7} />
              {/* Label */}
              <g className="cursor-pointer"
                onClick={() => onSelectDomain(selectedDomain === d.id ? null : d.id)}>
                <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
                  fill={d.color} fontSize={isSel ? 12 : 10} fontWeight={isSel ? 700 : 500}
                  fontFamily="'JetBrains Mono', monospace" opacity={isSel ? 1 : 0.75}>
                  {d.nameLocal}
                </text>
                <text x={lx} y={ly + 14} textAnchor="middle"
                  fill={isCritical ? '#FF4444' : d.color}
                  fontSize={9} fontFamily="'JetBrains Mono', monospace" opacity={0.65}>
                  {count}/{d.expected} ({pct}%)
                </text>
              </g>
            </g>
          );
        })}

        {/* Center text */}
        <text x={CX} y={CY - 8} textAnchor="middle" fill="rgba(255,255,255,0.25)"
          fontSize={8} fontFamily="'JetBrains Mono', monospace" letterSpacing="0.2em">
          {language?.name || 'chiShona'}
        </text>
        <text x={CX} y={CY + 6} textAnchor="middle" fill="rgba(255,255,255,0.12)"
          fontSize={7} fontFamily="'JetBrains Mono', monospace">
          {language?.family || 'S.10 Bantu'}
        </text>
      </svg>

      {/* Tooltip */}
      {hoveredWordInfo && (
        <div className="absolute bottom-3 left-3 z-20 rounded-lg p-3 max-w-xs"
          style={{
            background: 'rgba(10,12,20,0.95)',
            backdropFilter: 'blur(10px)',
            borderColor: hoveredWordInfo.domainColor + '40',
            borderWidth: 1,
          }}>
          <div className="text-lg font-bold text-white">{hoveredWordInfo.word}</div>
          <div className="text-[13px] mt-0.5" style={{ color: 'rgba(255,255,255,0.65)' }}>
            {hoveredWordInfo.translation}
          </div>
          <div className="flex gap-2 mt-2 flex-wrap">
            <span className="text-[10px] px-1.5 py-0.5 rounded"
              style={{ background: hoveredWordInfo.domainColor + '25', color: hoveredWordInfo.domainColor }}>
              {taxonomy.domains.find(d => d.id === hoveredWordInfo.domains[0])?.name}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded"
              style={{ background: (hoveredWordInfo.srcStyle.coreColor || '#7BA3E0') + '20', color: hoveredWordInfo.srcStyle.coreColor || '#7BA3E0' }}>
              {hoveredWordInfo.srcStyle.symbol} {hoveredWordInfo.srcStyle.label}
            </span>
            {hoveredWordInfo._isExternal && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-400">
                search result
              </span>
            )}
          </div>
          {hoveredWordInfo.domains.length > 1 && (
            <div className="text-[10px] mt-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Also in: {hoveredWordInfo.domains.slice(1).map(id =>
                taxonomy.domains.find(d => d.id === id)?.nameLocal
              ).filter(Boolean).join(', ')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
