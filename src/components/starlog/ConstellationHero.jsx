import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { generateStars } from '../../lib/constellation-utils';
import starlogLogo from '../../logo_starlog.svg';

/**
 * Landing page for /constellation (no language code).
 * Shows an animated preview and links to available constellations.
 */

const AVAILABLE_CONSTELLATIONS = [
  {
    code: 'sn',
    name: 'chiShona',
    nativeName: 'chiShona',
    family: 'S.10 Bantu',
    wordCount: 280,
    color: '#4ECDC4',
  },
];

export default function ConstellationHero() {
  const [stars] = useState(() => generateStars(120));

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
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-12">
        {/* Title */}
        <div className="text-center mb-12">
          <img src={starlogLogo} alt="Starlog" className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3">
            Living Language
            <br />
            <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              Constellation
            </span>
          </h1>
          <p className="text-slate-400 max-w-md mx-auto leading-relaxed">
            Every word is a star. Watch languages come alive as their vocabulary
            pulses with real-world digital usage.
          </p>
        </div>

        {/* Language cards */}
        <div className="w-full max-w-sm space-y-3">
          {AVAILABLE_CONSTELLATIONS.map(lang => (
            <Link
              key={lang.code}
              to={`/constellation/${lang.code}`}
              className="block bg-slate-900/70 border border-slate-800 rounded-xl p-5 hover:border-cyan-500/50 transition-all hover:bg-slate-900/90 group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white group-hover:text-cyan-400 transition-colors">
                    {lang.nativeName}
                  </h2>
                  <p className="text-sm text-slate-500">{lang.family}</p>
                </div>
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ backgroundColor: lang.color + '20', color: lang.color }}
                >
                  {lang.wordCount}
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                  {lang.wordCount} words
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                  9 domains
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Attribution */}
        <p className="mt-12 text-xs text-slate-600 text-center">
          Built with Starlog &middot; SIL Semantic Domains &middot; Wikipedia Signals
        </p>
      </div>
    </div>
  );
}
