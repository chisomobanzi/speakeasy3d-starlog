import { useState, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { LoadingScreen } from '../components/ui/LoadingSpinner';
import PublicConstellation from '../components/starlog/PublicConstellation';
import ConstellationHero from '../components/starlog/ConstellationHero';
import SuggestWordModal from '../components/starlog/SuggestWordModal';
import ConstellationQR from '../components/starlog/ConstellationQR';
import { adaptSeedData, SOURCE_STYLES } from '../lib/constellation-adapter';
import { useConstellation } from '../hooks/useConstellation';
import seedData from '../data/shona-seed-data.json';

const SEED_DATA_MAP = { sn: seedData };

export default function ConstellationPage() {
  const { languageCode } = useParams();

  const [selectedDomain, setSelectedDomain] = useState(null);
  const [hoveredWord, setHoveredWord] = useState(null);
  const [colorMode, setColorMode] = useState('domain');
  const [showConnections, setShowConnections] = useState(true);

  const [showSuggest, setShowSuggest] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const {
    data: supabaseData,
    loading: supabaseLoading,
    pulseMap,
    recentSignals,
    isLive,
    refetch,
  } = useConstellation(languageCode);

  const staticData = useMemo(() => {
    const raw = SEED_DATA_MAP[languageCode];
    if (!raw) return null;
    return adaptSeedData(raw);
  }, [languageCode]);

  const constellationData = useMemo(() => {
    if (supabaseData?.vocabulary?.length > 0) return supabaseData;
    return staticData;
  }, [supabaseData, staticData]);

  const handleSelectDomain = useCallback((domainId) => {
    setSelectedDomain(domainId);
  }, []);

  if (!languageCode) return <ConstellationHero />;

  if (supabaseLoading && !staticData) {
    return <LoadingScreen message="Loading constellation..." />;
  }

  if (!constellationData) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex items-center justify-center">
        <div className="text-center text-slate-400 p-8">
          <p className="text-xl mb-2">Language not found</p>
          <p className="text-sm">No constellation data for &ldquo;{languageCode}&rdquo;</p>
        </div>
      </div>
    );
  }

  const { language, taxonomy, vocabulary } = constellationData;

  return (
    <div className="fixed inset-0 flex" style={{
      background: 'radial-gradient(ellipse at center, #0a0d1a 0%, #050710 70%, #020308 100%)',
      fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace",
    }}>
      {/* Viz area */}
      <div className="flex-1 relative flex items-center justify-center">
        <PublicConstellation
          language={language}
          taxonomy={taxonomy}
          vocabulary={vocabulary}
          selectedDomain={selectedDomain}
          hoveredWord={hoveredWord}
          pulseMap={pulseMap}
          isLive={isLive}
          recentSignals={recentSignals}
          colorMode={colorMode}
          showConnections={showConnections}
          onHoverWord={setHoveredWord}
          onSelectDomain={handleSelectDomain}
        />

        {/* Title bar with controls */}
        <div className="absolute top-3 right-3 z-10 flex gap-2">
          <button
            className={`px-2.5 py-1 rounded text-[9px] tracking-wider uppercase transition-all ${colorMode === 'domain' ? 'bg-white/[.12] text-white' : 'bg-white/[.04] text-white/40'}`}
            onClick={() => setColorMode('domain')}
          >Color: Domain</button>
          <button
            className={`px-2.5 py-1 rounded text-[9px] tracking-wider uppercase transition-all ${colorMode === 'source' ? 'bg-white/[.12] text-white' : 'bg-white/[.04] text-white/40'}`}
            onClick={() => setColorMode('source')}
          >Color: Source</button>
          <button
            className={`px-2.5 py-1 rounded text-[9px] tracking-wider uppercase transition-all ${showConnections ? 'bg-cyan-500/15 text-cyan-400' : 'bg-white/[.04] text-white/40'}`}
            onClick={() => setShowConnections(v => !v)}
          >Links</button>
        </div>

        {/* Word list popup when domain is selected */}
        {selectedDomain && (
          <WordListPopup
            domain={taxonomy.domains.find(d => d.id === selectedDomain)}
            vocabulary={vocabulary}
            selectedDomain={selectedDomain}
          />
        )}

        {/* Action buttons */}
        <div className="absolute bottom-4 left-4 z-20 flex gap-2">
          <button
            onClick={() => setShowSuggest(true)}
            className="px-4 py-2 bg-cyan-600/90 backdrop-blur-sm text-white text-sm rounded-full hover:bg-cyan-500 transition-colors shadow-lg"
          >+ Suggest Word</button>
          <button
            onClick={() => setShowQR(true)}
            className="px-3 py-2 bg-slate-800/90 backdrop-blur-sm text-slate-300 text-sm rounded-full hover:bg-slate-700 transition-colors shadow-lg"
          >QR</button>
        </div>
      </div>

      {/* Sidebar */}
      <Sidebar
        taxonomy={taxonomy}
        vocabulary={vocabulary}
        selectedDomain={selectedDomain}
        onSelectDomain={handleSelectDomain}
      />

      {/* Modals */}
      <SuggestWordModal
        isOpen={showSuggest}
        onClose={() => setShowSuggest(false)}
        languageCode={languageCode}
        domains={taxonomy.domains}
        onWordAdded={refetch}
      />
      <ConstellationQR
        isOpen={showQR}
        onClose={() => setShowQR(false)}
        url={window.location.href}
      />
    </div>
  );
}

/* ── Sidebar ── */
function Sidebar({ taxonomy, vocabulary, selectedDomain, onSelectDomain }) {
  const totalExpected = taxonomy.domains.reduce((s, d) => s + (d.expected || 0), 0);
  const crossLinks = vocabulary.filter(w => w.domains.length > 1).length;

  // Source counts
  const sourceCounts = useMemo(() => {
    const counts = {};
    vocabulary.forEach(w => { counts[w.source] = (counts[w.source] || 0) + 1; });
    return counts;
  }, [vocabulary]);

  return (
    <div className="w-[250px] shrink-0 overflow-y-auto border-l"
      style={{
        background: 'rgba(8,10,18,0.6)',
        borderColor: 'rgba(255,255,255,0.06)',
        fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace",
      }}>
      <div className="p-4">
        {/* Header */}
        <div className="text-center pb-3 mb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="text-[28px] font-extrabold text-white">{vocabulary.length}</div>
          <div className="text-[10px] tracking-[0.15em] uppercase" style={{ color: 'rgba(255,255,255,0.4)' }}>
            words documented
          </div>
          <div className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
            of ~{totalExpected} estimated ({Math.round(vocabulary.length / totalExpected * 100)}%)
          </div>
          <div className="text-[10px] mt-1 text-cyan-400">
            {crossLinks} cross-domain links
          </div>
        </div>

        {/* Domain rows */}
        {taxonomy.domains.map(d => (
          <DomainRow
            key={d.id}
            domain={d}
            vocabulary={vocabulary}
            isSelected={selectedDomain === d.id}
            onClick={() => onSelectDomain(selectedDomain === d.id ? null : d.id)}
          />
        ))}

        {/* Source legend */}
        <div className="mt-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="text-[9px] tracking-[0.15em] uppercase mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Sources
          </div>
          {Object.entries(SOURCE_STYLES).map(([key, meta]) => {
            const count = sourceCounts[key] || 0;
            if (count === 0) return null;
            return (
              <div key={key} className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[11px] w-3.5 text-center" style={{ color: meta.coreColor }}>{meta.symbol}</span>
                <span className="text-[9px] flex-1" style={{ color: 'rgba(255,255,255,0.45)' }}>{meta.label}</span>
                <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{count}</span>
              </div>
            );
          })}
        </div>

        {/* Attribution */}
        <div className="mt-4 pt-3" style={{
          borderTop: '1px solid rgba(255,255,255,0.08)',
          fontSize: '8px',
          color: 'rgba(255,255,255,0.2)',
          lineHeight: 1.5,
        }}>
          Domain structure: SIL International Semantic Domains v4 (semdom.org). CC BY-SA 4.0.
          Originally developed from Bantu languages (Kifuliiru, Gikuyu, Lugwere).
        </div>
      </div>
    </div>
  );
}

/* ── Domain Row ── */
function DomainRow({ domain, vocabulary, isSelected, onClick }) {
  const primary = useMemo(() => vocabulary.filter(w => w.domains[0] === domain.id), [vocabulary, domain.id]);
  const secondary = useMemo(() => vocabulary.filter(w => w.domains.includes(domain.id) && w.domains[0] !== domain.id), [vocabulary, domain.id]);
  const pct = domain.expected ? Math.round((primary.length / domain.expected) * 100) : 0;
  const isCritical = pct < 15;

  const bySource = useMemo(() => {
    const counts = {};
    primary.forEach(w => { counts[w.source] = (counts[w.source] || 0) + 1; });
    return counts;
  }, [primary]);

  return (
    <div
      className={`px-2 py-1.5 mb-1 rounded-md cursor-pointer border transition-all hover:bg-white/[.03] ${isSelected ? 'border-white/15' : 'border-transparent'}`}
      style={isSelected ? { background: domain.color + '15', borderColor: domain.color + '30' } : {}}
      onClick={onClick}
    >
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-semibold" style={{ color: domain.color }}>
          {domain.id}. {domain.nameLocal}
        </span>
        <span className={`text-[9px] ${isCritical ? 'text-red-500 font-bold' : ''}`} style={isCritical ? {} : { color: 'rgba(255,255,255,0.45)' }}>
          {primary.length}/{domain.expected}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 rounded-sm mt-0.5 overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div
          className="h-full rounded-sm transition-all duration-500"
          style={{
            width: `${Math.min(pct, 100)}%`,
            background: isCritical
              ? 'linear-gradient(90deg, #FF4444, #FF6644)'
              : `linear-gradient(90deg, ${domain.color}90, ${domain.color})`,
          }}
        />
      </div>

      {/* Source breakdown when selected */}
      {isSelected && (
        <div className="flex gap-1.5 mt-1.5 flex-wrap">
          {Object.entries(bySource).map(([src, count]) => {
            const meta = SOURCE_STYLES[src];
            if (!meta) return null;
            return (
              <span key={src} className="text-[9px]" style={{ color: meta.coreColor, opacity: 0.8 }}>
                {meta.symbol}{count}
              </span>
            );
          })}
          {secondary.length > 0 && (
            <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
              +{secondary.length} cross-refs
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Word List Popup ── */
function WordListPopup({ domain, vocabulary, selectedDomain }) {
  if (!domain) return null;

  const domainWords = useMemo(
    () => vocabulary.filter(w => w.domains[0] === selectedDomain),
    [vocabulary, selectedDomain]
  );
  const crossRefWords = useMemo(
    () => vocabulary.filter(w => w.domains.includes(selectedDomain) && w.domains[0] !== selectedDomain),
    [vocabulary, selectedDomain]
  );

  return (
    <div
      className="absolute left-2.5 top-12 z-[80] rounded-lg p-3 max-w-[280px] max-h-[350px] overflow-y-auto"
      style={{
        background: 'rgba(10,12,20,0.92)',
        backdropFilter: 'blur(10px)',
        borderWidth: 1,
        borderColor: domain.color + '30',
        fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace",
      }}
    >
      <div className="text-[11px] font-bold mb-2" style={{ color: domain.color }}>
        {domain.name} &mdash; {domainWords.length} words
      </div>
      {domainWords.slice(0, 20).map(w => {
        const meta = SOURCE_STYLES[w.source] || SOURCE_STYLES.dictionary;
        return (
          <div key={w.id} className="flex gap-2 mb-0.5 text-[10px]">
            <span className="w-2.5" style={{ color: meta.coreColor }}>{meta.symbol}</span>
            <span className="text-white font-semibold min-w-[70px]">{w.word}</span>
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>{w.translation}</span>
          </div>
        );
      })}
      {domainWords.length > 20 && (
        <div className="text-[9px] mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
          +{domainWords.length - 20} more...
        </div>
      )}
      {crossRefWords.length > 0 && (
        <>
          <div className="text-[10px] mt-2.5 mb-1 pt-1.5"
            style={{ color: 'rgba(255,255,255,0.4)', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            Cross-referenced ({crossRefWords.length}):
          </div>
          {crossRefWords.slice(0, 8).map(w => (
            <div key={w.id} className="flex gap-2 mb-0.5 text-[10px] opacity-60">
              <span className="w-2.5" style={{ color: domain.color }}>&#x2197;</span>
              <span className="text-white font-semibold min-w-[70px]">{w.word}</span>
              <span style={{ color: 'rgba(255,255,255,0.4)' }}>{w.translation}</span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
