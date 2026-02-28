import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBridgeStore, GAME_PHASES } from '../../stores/bridgeStore';
import { t } from '../../data/i18n';
import Lobby from './Lobby';
import SpellDuelArena from './SpellDuelArena';
import RoundResults from './RoundResults';

/**
 * GameView — orchestrates game phase rendering on the projector.
 * Routes to Lobby, Countdown, SpellDuelArena, or RoundResults based on gamePhase.
 */
export default function GameView() {
  const gamePhase = useBridgeStore((s) => s.gamePhase);

  return (
    <div className="absolute inset-0">
      <AnimatePresence mode="wait">
        {gamePhase === GAME_PHASES.LOBBY && (
          <motion.div
            key="lobby"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
          >
            <Lobby />
          </motion.div>
        )}

        {gamePhase === GAME_PHASES.COUNTDOWN && (
          <motion.div
            key="countdown"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
          >
            <CountdownOverlay />
          </motion.div>
        )}

        {gamePhase === GAME_PHASES.PLAYING && (
          <motion.div
            key="playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
          >
            <SpellDuelArena />
          </motion.div>
        )}

        {gamePhase === GAME_PHASES.ROUND_END && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
          >
            <RoundResults />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Countdown overlay: 3... 2... 1... GO!
 * Automatically calls beginPlay() after the countdown.
 */
function CountdownOverlay() {
  const beginPlay = useBridgeStore((s) => s.beginPlay);
  const [count, setCount] = useState(3);

  useEffect(() => {
    if (count > 0) {
      const timer = setTimeout(() => setCount(count - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      // Show "GO!" briefly, then begin
      const timer = setTimeout(() => beginPlay(), 600);
      return () => clearTimeout(timer);
    }
  }, [count, beginPlay]);

  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      style={{ background: 'rgba(2, 6, 23, 0.9)' }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={count}
          initial={{ scale: 2.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.3, opacity: 0 }}
          transition={{ duration: 0.35, type: 'spring', stiffness: 200 }}
          className="bridge-display"
          style={{
            fontSize: count === 0 ? '8rem' : '12rem',
            color: count === 0 ? 'var(--amber)' : 'var(--text-primary)',
            textShadow: `0 0 60px ${count === 0 ? 'var(--amber)' : 'rgba(255,255,255,0.3)'}`,
          }}
        >
          {count === 0 ? t.go : count}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
