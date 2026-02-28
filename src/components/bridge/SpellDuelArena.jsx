import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Zap } from 'lucide-react';
import { useBridgeStore, GAME_PHASES } from '../../stores/bridgeStore';
import { t, roundN } from '../../data/i18n';

/**
 * SpellDuelArena — projector visualization for the Spell Duel game mode.
 * Shows tug-of-war bar, team scores, timer, live score feed, and player stats.
 */
export default function SpellDuelArena() {
  const teams = useBridgeStore((s) => s.teams);
  const players = useBridgeStore((s) => s.players);
  const currentRound = useBridgeStore((s) => s.currentRound);
  const roundTimeLeft = useBridgeStore((s) => s.roundTimeLeft);
  const scoreFeed = useBridgeStore((s) => s.scoreFeed);
  const gamePhase = useBridgeStore((s) => s.gamePhase);

  const redPlayers = players.filter((p) => p.team === 'red').sort((a, b) => b.wordsCompleted - a.wordsCompleted);
  const bluePlayers = players.filter((p) => p.team === 'blue').sort((a, b) => b.wordsCompleted - a.wordsCompleted);

  // Timer tick
  useEffect(() => {
    if (gamePhase !== GAME_PHASES.PLAYING) return;
    const interval = setInterval(() => {
      useBridgeStore.getState().tickTimer();
    }, 1000);
    return () => clearInterval(interval);
  }, [gamePhase]);

  // Tug-of-war position: 50 = tied, <50 = red winning, >50 = blue winning
  const totalRoundScore = teams.red.roundScore + teams.blue.roundScore;
  const tugRaw = totalRoundScore === 0
    ? 50
    : (teams.blue.roundScore / totalRoundScore) * 100;
  const tugPosition = Math.max(8, Math.min(92, tugRaw));

  const isUrgent = roundTimeLeft <= 10;

  return (
    <div className="absolute inset-0 flex flex-col p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Swords size={24} style={{ color: 'var(--amber)' }} />
          <span className="bridge-display text-xl tracking-wider" style={{ color: 'var(--amber)' }}>
            {t.spellDuel}
          </span>
          <span className="bridge-mono text-sm" style={{ color: 'var(--text-dim)' }}>
            {roundN(currentRound)}
          </span>
        </div>

        <motion.div
          animate={isUrgent ? { scale: [1, 1.15, 1] } : {}}
          transition={{ duration: 0.5, repeat: isUrgent ? Infinity : 0 }}
          className="bridge-display text-5xl tabular-nums"
          style={{
            color: isUrgent ? 'var(--alert)' : 'var(--text-primary)',
            textShadow: isUrgent ? '0 0 20px var(--alert)' : 'none',
          }}
        >
          0:{String(roundTimeLeft).padStart(2, '0')}
        </motion.div>
      </div>

      {/* Team scores */}
      <div className="flex items-end justify-between mb-3">
        <div className="text-center">
          <motion.div
            key={teams.red.roundScore}
            initial={{ scale: 1.3 }}
            animate={{ scale: 1 }}
            className="bridge-display text-7xl tabular-nums"
            style={{ color: teams.red.color, textShadow: `0 0 30px ${teams.red.color}40` }}
          >
            {teams.red.roundScore}
          </motion.div>
          <div className="bridge-display text-base tracking-wider mt-1" style={{ color: teams.red.color }}>
            {teams.red.name}
          </div>
        </div>

        <div className="bridge-display text-3xl" style={{ color: 'var(--text-dim)' }}>{t.vs}</div>

        <div className="text-center">
          <motion.div
            key={teams.blue.roundScore}
            initial={{ scale: 1.3 }}
            animate={{ scale: 1 }}
            className="bridge-display text-7xl tabular-nums"
            style={{ color: teams.blue.color, textShadow: `0 0 30px ${teams.blue.color}40` }}
          >
            {teams.blue.roundScore}
          </motion.div>
          <div className="bridge-display text-base tracking-wider mt-1" style={{ color: teams.blue.color }}>
            {teams.blue.name}
          </div>
        </div>
      </div>

      {/* Tug-of-war bar */}
      <div
        className="relative h-8 rounded-full overflow-hidden mb-6"
        style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(148, 163, 184, 0.1)' }}
      >
        <motion.div
          className="absolute top-0 left-0 h-full rounded-l-full"
          animate={{ width: `${100 - tugPosition}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          style={{
            background: `linear-gradient(to right, ${teams.red.color}, ${teams.red.color}88)`,
            boxShadow: `0 0 20px ${teams.red.color}40`,
          }}
        />
        <motion.div
          className="absolute top-0 right-0 h-full rounded-r-full"
          animate={{ width: `${tugPosition}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          style={{
            background: `linear-gradient(to left, ${teams.blue.color}, ${teams.blue.color}88)`,
            boxShadow: `0 0 20px ${teams.blue.color}40`,
          }}
        />
        <motion.div
          className="absolute top-0 h-full w-1.5"
          animate={{ left: `${tugPosition}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          style={{
            background: 'white',
            boxShadow: '0 0 10px rgba(255,255,255,0.8)',
            transform: 'translateX(-50%)',
          }}
        />
      </div>

      {/* Score feed + Player rosters */}
      <div className="flex gap-6 flex-1 min-h-0 overflow-hidden">
        {/* Red roster */}
        <div className="w-52 shrink-0">
          <div className="bridge-mono text-xs mb-2" style={{ color: teams.red.color }}>
            {teams.red.name.toUpperCase()}
          </div>
          <div className="space-y-1">
            {redPlayers.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-2 px-3 py-1.5 rounded"
                style={{ background: 'rgba(239, 68, 68, 0.06)' }}
              >
                <span className="bridge-body text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                  {p.name}
                </span>
                <span className="ml-auto bridge-mono text-xs" style={{ color: 'var(--amber)' }}>
                  {p.wordsCompleted > 0 && `★${p.wordsCompleted}`}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Score feed (center) */}
        <div className="flex-1 flex flex-col items-center overflow-hidden">
          <div className="bridge-mono text-xs mb-3" style={{ color: 'var(--text-dim)' }}>
            {t.live}
          </div>
          <div className="w-full max-w-lg space-y-1.5 overflow-hidden">
            <AnimatePresence initial={false}>
              {scoreFeed.map((event) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: -30, scale: 1.1 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-lg"
                  style={{
                    background: event.team === 'red'
                      ? 'rgba(239, 68, 68, 0.1)'
                      : 'rgba(59, 130, 246, 0.1)',
                    borderLeft: `3px solid ${event.team === 'red' ? teams.red.color : teams.blue.color}`,
                  }}
                >
                  <Zap size={16} style={{ color: 'var(--amber)' }} />
                  <span className="bridge-body text-base" style={{ color: 'var(--text-primary)' }}>
                    <strong>{event.playerName}</strong>
                    {` ${t.castWord} `}
                    <span style={{ color: 'var(--cyan)' }}>"{event.word}"</span>
                  </span>
                  <span
                    className="bridge-display text-lg ml-auto"
                    style={{ color: event.team === 'red' ? teams.red.color : teams.blue.color }}
                  >
                    +{event.points}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
            {scoreFeed.length === 0 && (
              <div className="text-center bridge-body text-lg py-12" style={{ color: 'var(--text-dim)' }}>
                {t.castYourSpells}
              </div>
            )}
          </div>
        </div>

        {/* Blue roster */}
        <div className="w-52 shrink-0">
          <div className="bridge-mono text-xs mb-2 text-right" style={{ color: teams.blue.color }}>
            {teams.blue.name.toUpperCase()}
          </div>
          <div className="space-y-1">
            {bluePlayers.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-2 px-3 py-1.5 rounded"
                style={{ background: 'rgba(59, 130, 246, 0.06)' }}
              >
                <span className="bridge-body text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                  {p.name}
                </span>
                <span className="ml-auto bridge-mono text-xs" style={{ color: 'var(--amber)' }}>
                  {p.wordsCompleted > 0 && `★${p.wordsCompleted}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
