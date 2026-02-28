import { motion, AnimatePresence } from 'framer-motion';
import { Users, Swords, X, ArrowLeftRight } from 'lucide-react';
import { useBridgeStore } from '../../stores/bridgeStore';
import { t, nPlayers } from '../../data/i18n';

/**
 * Game lobby — shows players split into teams, waiting for teacher to start.
 */
export default function Lobby() {
  const players = useBridgeStore((s) => s.players);
  const teams = useBridgeStore((s) => s.teams);
  const sessionCode = useBridgeStore((s) => s.sessionCode);
  const removePlayerFromGame = useBridgeStore((s) => s.removePlayerFromGame);
  const swapPlayerTeam = useBridgeStore((s) => s.swapPlayerTeam);
  const teacherPanelOpen = useBridgeStore((s) => s.teacherPanelOpen);

  const redPlayers = players.filter((p) => p.team === 'red');
  const bluePlayers = players.filter((p) => p.team === 'blue');

  const langFlag = (lang) => {
    const flags = { en: '🇬🇧', zh: '🇹🇼', es: '🇪🇸' };
    return flags[lang] || '🌍';
  };

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="bridge-display text-2xl tracking-wider" style={{ color: 'var(--amber)' }}>
          <Swords className="inline mr-3" size={28} />
          {t.spellDuel}
        </div>
        <div className="bridge-mono text-sm mt-2" style={{ color: 'var(--text-dim)' }}>
          {t.joinCode}: <span style={{ color: 'var(--cyan)', fontSize: '1.2em' }}>{sessionCode}</span>
        </div>
      </motion.div>

      {/* Team panels */}
      <div className="flex gap-8 w-full max-w-4xl">
        {/* Red team */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="flex-1 rounded-2xl p-6"
          style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: teams.red.color }} />
            <span className="bridge-display text-lg tracking-wider" style={{ color: teams.red.color }}>
              {teams.red.name}
            </span>
            <span className="bridge-mono text-xs ml-auto" style={{ color: 'var(--text-dim)' }}>
              {nPlayers(redPlayers.length)}
            </span>
          </div>
          <div className="space-y-2">
            <AnimatePresence>
              {redPlayers.map((p) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-3 px-4 py-2 rounded-lg"
                  style={{ background: 'rgba(239, 68, 68, 0.06)' }}
                >
                  <span className="text-lg">{langFlag(p.language)}</span>
                  <span className="bridge-body text-sm" style={{ color: 'var(--text-primary)' }}>
                    {p.name}
                  </span>
                  {!p.connected && (
                    <span className="bridge-mono text-xs" style={{ color: 'var(--text-dim)' }}>
                      {t.offline}
                    </span>
                  )}
                  {teacherPanelOpen && (
                    <span className="ml-auto flex items-center gap-1">
                      <button
                        onClick={() => swapPlayerTeam(p.id)}
                        className="p-1 rounded hover:bg-white/10 transition-colors"
                        title="Swap team"
                      >
                        <ArrowLeftRight size={14} style={{ color: 'var(--text-dim)' }} />
                      </button>
                      <button
                        onClick={() => removePlayerFromGame(p.id)}
                        className="p-1 rounded hover:bg-white/10 transition-colors"
                        title="Remove player"
                      >
                        <X size={14} style={{ color: 'var(--alert)' }} />
                      </button>
                    </span>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            {redPlayers.length === 0 && (
              <div className="bridge-mono text-xs text-center py-4" style={{ color: 'var(--text-dim)' }}>
                {t.waitingForPlayers}
              </div>
            )}
          </div>
        </motion.div>

        {/* VS */}
        <div className="flex items-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4, type: 'spring' }}
            className="bridge-display text-3xl"
            style={{ color: 'var(--text-dim)' }}
          >
            {t.vs}
          </motion.div>
        </div>

        {/* Blue team */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="flex-1 rounded-2xl p-6"
          style={{
            background: 'rgba(59, 130, 246, 0.08)',
            border: '1px solid rgba(59, 130, 246, 0.25)',
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: teams.blue.color }} />
            <span className="bridge-display text-lg tracking-wider" style={{ color: teams.blue.color }}>
              {teams.blue.name}
            </span>
            <span className="bridge-mono text-xs ml-auto" style={{ color: 'var(--text-dim)' }}>
              {nPlayers(bluePlayers.length)}
            </span>
          </div>
          <div className="space-y-2">
            <AnimatePresence>
              {bluePlayers.map((p) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-3 px-4 py-2 rounded-lg"
                  style={{ background: 'rgba(59, 130, 246, 0.06)' }}
                >
                  <span className="text-lg">{langFlag(p.language)}</span>
                  <span className="bridge-body text-sm" style={{ color: 'var(--text-primary)' }}>
                    {p.name}
                  </span>
                  {!p.connected && (
                    <span className="bridge-mono text-xs" style={{ color: 'var(--text-dim)' }}>
                      {t.offline}
                    </span>
                  )}
                  {teacherPanelOpen && (
                    <span className="ml-auto flex items-center gap-1">
                      <button
                        onClick={() => swapPlayerTeam(p.id)}
                        className="p-1 rounded hover:bg-white/10 transition-colors"
                        title="Swap team"
                      >
                        <ArrowLeftRight size={14} style={{ color: 'var(--text-dim)' }} />
                      </button>
                      <button
                        onClick={() => removePlayerFromGame(p.id)}
                        className="p-1 rounded hover:bg-white/10 transition-colors"
                        title="Remove player"
                      >
                        <X size={14} style={{ color: 'var(--alert)' }} />
                      </button>
                    </span>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            {bluePlayers.length === 0 && (
              <div className="bridge-mono text-xs text-center py-4" style={{ color: 'var(--text-dim)' }}>
                {t.waitingForPlayers}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Player count */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-8 flex items-center gap-3"
      >
        <Users size={18} style={{ color: 'var(--text-dim)' }} />
        <span className="bridge-mono text-sm" style={{ color: 'var(--text-dim)' }}>
          {players.filter((p) => p.connected).length} connected 已連線
        </span>
      </motion.div>

      {/* Hint */}
      <div
        className="absolute bottom-6 bridge-mono text-xs"
        style={{ color: 'rgba(100, 116, 139, 0.3)' }}
      >
        Press T for teacher controls
      </div>
    </div>
  );
}
