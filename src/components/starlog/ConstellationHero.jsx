import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Sparkles } from 'lucide-react';
import { generateStars } from '../../lib/constellation-utils';
import { LANGUAGES } from '../../lib/languages';
import starlogLogo from '../../logo_starlog.svg';

/**
 * Landing page for /constellation (no language code).
 * Full language picker with featured constellations and search.
 */

const FEATURED = [
  { code: 'sn', label: 'chiShona', desc: 'Bantu · 280 words seeded', color: '#4ECDC4' },
  { code: 'pwn', label: 'Paiwan', desc: 'Austronesian · Taiwan indigenous', color: '#f59e0b' },
  { code: 'ami', label: 'Amis', desc: 'Austronesian · Taiwan indigenous', color: '#f59e0b' },
  { code: 'tay', label: 'Atayal', desc: 'Austronesian · Taiwan indigenous', color: '#f59e0b' },
  { code: 'en', label: 'English', desc: 'Wiktionary · auto-discovery', color: '#7BA3E0' },
  { code: 'es', label: 'Spanish', desc: 'Wiktionary · auto-discovery', color: '#7BA3E0' },
  { code: 'ja', label: 'Japanese', desc: 'Wiktionary · auto-discovery', color: '#c084fc' },
  { code: 'fr', label: 'French', desc: 'Wiktionary · auto-discovery', color: '#7BA3E0' },
];

export default function ConstellationHero() {
  const [stars] = useState(() => generateStars(120));
  const [query, setQuery] = useState('');

  const filteredLanguages = useMemo(() => {
    if (!query) return null;
    const q = query.toLowerCase();
    return LANGUAGES.filter(l =>
      l.name.toLowerCase().includes(q) || l.code.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <div className="fixed inset-0 bg-slate-950 overflow-auto">
      {/* Background star field */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="-1.1 -1.1 2.2 2.2"
        preserveAspectRatio="xMidYMid slice"
      >
        {stars.map((star, i) => (
          <circle
            key={i}
            cx={star.x}
            cy={star.y}
            r={star.size}
            fill="white"
            opacity={star.opacity}
          >
            {i % 5 === 0 && (
              <animate
                attributeName="opacity"
                values={`${star.opacity};${star.opacity * 0.3};${star.opacity}`}
                dur={`${3 + (i % 4)}s`}
                repeatCount="indefinite"
              />
            )}
          </circle>
        ))}
      </svg>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center min-h-screen px-4 sm:px-6 pt-12 sm:pt-16 pb-24">
        {/* Title */}
        <div className="text-center mb-8">
          <img src={starlogLogo} alt="Starlog" className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3" />
          <h1 className="text-3xl sm:text-5xl font-bold text-white mb-2">
            Language{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              Constellations
            </span>
          </h1>
          <p className="text-slate-400 max-w-sm mx-auto text-sm sm:text-base leading-relaxed">
            Every word is a star. Choose a language to explore its vocabulary mapped across semantic domains.
          </p>
        </div>

        {/* Search */}
        <div className="w-full max-w-md mb-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search languages..."
            className="w-full h-10 pl-10 pr-4 rounded-xl text-sm bg-white/[.06] text-white placeholder:text-slate-500 border border-white/[.1] focus:border-cyan-500/40 focus:outline-none transition-colors"
          />
        </div>

        {/* Search results */}
        {filteredLanguages ? (
          <div className="w-full max-w-md">
            {filteredLanguages.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No languages matching "{query}"</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {filteredLanguages.map(lang => (
                  <Link
                    key={lang.code}
                    to={`/constellation/${lang.code}`}
                    className="p-3 rounded-xl transition-all hover:bg-white/[.08]"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <div className="text-sm font-medium text-white">{lang.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{lang.code.toUpperCase()}</div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Featured */}
            <div className="w-full max-w-md mb-8">
              <h2 className="text-xs tracking-[0.15em] uppercase text-slate-500 mb-3 px-1">Featured</h2>
              <div className="grid grid-cols-2 gap-2">
                {FEATURED.map(lang => (
                  <Link
                    key={lang.code}
                    to={`/constellation/${lang.code}`}
                    className="group p-3.5 rounded-xl transition-all hover:scale-[1.02]"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: lang.color }} />
                      <span className="text-sm font-semibold text-white group-hover:text-cyan-400 transition-colors">{lang.label}</span>
                    </div>
                    <p className="text-[11px] text-slate-500">{lang.desc}</p>
                  </Link>
                ))}
              </div>
            </div>

            {/* All languages */}
            <div className="w-full max-w-md">
              <h2 className="text-xs tracking-[0.15em] uppercase text-slate-500 mb-3 px-1">All languages ({LANGUAGES.length})</h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                {LANGUAGES.map(lang => (
                  <Link
                    key={lang.code}
                    to={`/constellation/${lang.code}`}
                    className="px-2.5 py-2 rounded-lg text-center transition-all hover:bg-white/[.08]"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
                  >
                    <div className="text-[12px] font-medium text-white truncate">{lang.name}</div>
                    <div className="text-[10px] text-slate-600">{lang.code}</div>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Attribution */}
        <p className="mt-10 text-xs text-slate-600 text-center">
          SIL Semantic Domains v4 · Wiktionary · Klokah E-Park
        </p>
      </div>
    </div>
  );
}
