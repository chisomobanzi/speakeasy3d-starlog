import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Crown } from 'lucide-react';
import { useBridgeStore } from '../../stores/bridgeStore';
import { t, roundN, spellsAndPts, ptsLabel } from '../../data/i18n';

/**
 * Simple canvas confetti burst.
 * Returns a cleanup function.
 */
function fireConfetti(canvas, teamColor) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.parentElement.offsetWidth;
  const H = canvas.height = canvas.parentElement.offsetHeight;

  const colors = [teamColor, '#f59e0b', '#06b6d4', '#22c55e', '#a855f7', '#ef4444', '#3b82f6'];
  const pieces = Array.from({ length: 120 }, () => ({
    x: W * 0.5 + (Math.random() - 0.5) * W * 0.3,
    y: H * 0.35,
    vx: (Math.random() - 0.5) * 14,
    vy: -Math.random() * 16 - 4,
    w: Math.random() * 8 + 4,
    h: Math.random() * 6 + 3,
    color: colors[Math.floor(Math.random() * colors.length)],
    rot: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 0.3,
    opacity: 1,
  }));

  let raf;
  const gravity = 0.35;
  const drag = 0.98;

  const tick = () => {
    ctx.clearRect(0, 0, W, H);
    let alive = false;
    for (const p of pieces) {
      p.vy += gravity;
      p.vx *= drag;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.spin;
      if (p.y > H + 20) p.opacity = Math.max(0, p.opacity - 0.05);
      if (p.opacity <= 0) continue;
      alive = true;
      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    if (alive) raf = requestAnimationFrame(tick);
  };

  // Fire two bursts
  raf = requestAnimationFrame(tick);
  const burst2 = setTimeout(() => {
    for (const p of pieces) {
      p.x = W * 0.5 + (Math.random() - 0.5) * W * 0.5;
      p.y = H * 0.3;
      p.vx = (Math.random() - 0.5) * 16;
      p.vy = -Math.random() * 14 - 6;
      p.opacity = 1;
    }
  }, 700);

  return () => {
    cancelAnimationFrame(raf);
    clearTimeout(burst2);
  };
}

/**
 * RoundResults — shown between rounds.
 * Displays round winner, team scores, MVP, and overall standings.
 */
export default function RoundResults() {
  const teams = useBridgeStore((s) => s.teams);
  const players = useBridgeStore((s) => s.players);
  const currentRound = useBridgeStore((s) => s.currentRound);
  const roundWinner = useBridgeStore((s) => s.roundWinner);
  const canvasRef = useRef(null);

  // Fire confetti on mount
  useEffect(() => {
    if (!canvasRef.current) return;
    const winnerTeam = roundWinner === 'tie' ? null : teams[roundWinner];
    const color = winnerTeam?.color || '#f59e0b';
    return fireConfetti(canvasRef.current, color);
  }, [roundWinner, teams]);

  const winnerTeam = roundWinner === 'tie' ? null : teams[roundWinner];
  const winnerColor = winnerTeam?.color || 'var(--amber)';

  // MVP: player with most words completed
  const allPlayers = [...players].sort((a, b) => b.wordsCompleted - a.wordsCompleted);
  const mvp = allPlayers[0];

  // Overall standings
  const redPlayers = players.filter((p) => p.team === 'red').sort((a, b) => b.score - a.score);
  const bluePlayers = players.filter((p) => p.team === 'blue').sort((a, b) => b.score - a.score);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
      {/* Confetti canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 10 }}
      />
      {/* Round winner */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', delay: 0.2 }}
        className="text-center mb-8"
      >
        <Trophy size={48} style={{ color: winnerColor, margin: '0 auto 16px' }} />
        <div
          className="bridge-display text-4xl tracking-wider"
          style={{ color: winnerColor, textShadow: `0 0 30px ${winnerColor}40` }}
        >
          {roundWinner === 'tie' ? t.tie : `${winnerTeam?.name || ''} ${t.wins}`}
        </div>
        <div className="bridge-mono text-sm mt-2" style={{ color: 'var(--text-dim)' }}>
          {roundN(currentRound)} {t.complete}
        </div>
      </motion.div>

      {/* Round score comparison */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex items-center gap-12 mb-8"
      >
        <div className="text-center">
          <div className="bridge-display text-6xl tabular-nums" style={{ color: teams.red.color }}>
            {teams.red.roundScore}
          </div>
          <div className="bridge-display text-sm tracking-wider mt-1" style={{ color: teams.red.color }}>
            {teams.red.name}
          </div>
          <div className="bridge-mono text-xs mt-1" style={{ color: 'var(--text-dim)' }}>
            {t.total}: {teams.red.score}
          </div>
        </div>

        <div className="bridge-display text-2xl" style={{ color: 'var(--text-dim)' }}>—</div>

        <div className="text-center">
          <div className="bridge-display text-6xl tabular-nums" style={{ color: teams.blue.color }}>
            {teams.blue.roundScore}
          </div>
          <div className="bridge-display text-sm tracking-wider mt-1" style={{ color: teams.blue.color }}>
            {teams.blue.name}
          </div>
          <div className="bridge-mono text-xs mt-1" style={{ color: 'var(--text-dim)' }}>
            {t.total}: {teams.blue.score}
          </div>
        </div>
      </motion.div>

      {/* MVP */}
      {mvp && mvp.wordsCompleted > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex items-center gap-3 px-6 py-3 rounded-xl mb-8"
          style={{
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
          }}
        >
          <Crown size={20} style={{ color: 'var(--amber)' }} />
          <span className="bridge-display text-sm tracking-wider" style={{ color: 'var(--amber)' }}>
            MVP
          </span>
          <span className="bridge-body text-lg" style={{ color: 'var(--text-primary)' }}>
            {mvp.name}
          </span>
          <span className="bridge-mono text-sm" style={{ color: 'var(--text-dim)' }}>
            {spellsAndPts(mvp.wordsCompleted, mvp.score)}
          </span>
        </motion.div>
      )}

      {/* Player standings */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="flex gap-8 w-full max-w-3xl"
      >
        {/* Red team */}
        <div className="flex-1">
          <div className="bridge-mono text-xs mb-2" style={{ color: teams.red.color }}>
            {teams.red.name.toUpperCase()}
          </div>
          <div className="space-y-1">
            {redPlayers.map((p, i) => (
              <div
                key={p.id}
                className="flex items-center gap-2 px-3 py-1.5 rounded"
                style={{ background: 'rgba(239, 68, 68, 0.06)' }}
              >
                <span className="bridge-mono text-xs w-4" style={{ color: 'var(--text-dim)' }}>
                  {i + 1}
                </span>
                <span className="bridge-body text-sm" style={{ color: 'var(--text-primary)' }}>
                  {p.name}
                </span>
                <span className="ml-auto bridge-mono text-xs" style={{ color: 'var(--amber)' }}>
                  {ptsLabel(p.score)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Blue team */}
        <div className="flex-1">
          <div className="bridge-mono text-xs mb-2" style={{ color: teams.blue.color }}>
            {teams.blue.name.toUpperCase()}
          </div>
          <div className="space-y-1">
            {bluePlayers.map((p, i) => (
              <div
                key={p.id}
                className="flex items-center gap-2 px-3 py-1.5 rounded"
                style={{ background: 'rgba(59, 130, 246, 0.06)' }}
              >
                <span className="bridge-mono text-xs w-4" style={{ color: 'var(--text-dim)' }}>
                  {i + 1}
                </span>
                <span className="bridge-body text-sm" style={{ color: 'var(--text-primary)' }}>
                  {p.name}
                </span>
                <span className="ml-auto bridge-mono text-xs" style={{ color: 'var(--amber)' }}>
                  {ptsLabel(p.score)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="mt-8 bridge-mono text-xs"
        style={{ color: 'rgba(100, 116, 139, 0.4)' }}
      >
        Press T for controls
      </motion.div>
    </div>
  );
}
