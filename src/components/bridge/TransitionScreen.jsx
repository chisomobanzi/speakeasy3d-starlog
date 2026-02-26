import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBridgeStore } from '../../stores/bridgeStore';

/**
 * Transition screens between states — warp, landing, alert.
 */
export default function TransitionScreen() {
  const transition = useBridgeStore((s) => s.transition);
  const clearTransition = useBridgeStore((s) => s.clearTransition);

  // Auto-clear after animation
  useEffect(() => {
    if (!transition) return;
    const duration = transition === 'warp' ? 2500 : transition === 'landing' ? 3000 : 1500;
    const timer = setTimeout(clearTransition, duration);
    return () => clearTimeout(timer);
  }, [transition, clearTransition]);

  return (
    <AnimatePresence>
      {transition === 'warp' && (
        <motion.div
          key="warp"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 flex items-center justify-center"
          style={{ zIndex: 100, background: 'var(--bg-deep)' }}
        >
          {/* Star streak lines */}
          <div className="absolute inset-0 overflow-hidden">
            {Array.from({ length: 30 }).map((_, i) => {
              const y = Math.random() * 100;
              const delay = Math.random() * 0.5;
              return (
                <motion.div
                  key={i}
                  initial={{ width: 0, x: '50%', opacity: 0 }}
                  animate={{ width: '120%', x: '-10%', opacity: [0, 1, 1, 0] }}
                  transition={{ duration: 1.5, delay, ease: 'easeIn' }}
                  className="absolute h-[1px]"
                  style={{
                    top: `${y}%`,
                    background: `linear-gradient(to right, transparent, rgba(6, 182, 212, 0.6), rgba(254, 243, 199, 0.8), transparent)`,
                  }}
                />
              );
            })}
          </div>

          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="bridge-display text-4xl tracking-[0.5em]"
            style={{ color: 'var(--cyan-glow)', textShadow: '0 0 30px var(--cyan)', zIndex: 1 }}
          >
            WARP
          </motion.div>
        </motion.div>
      )}

      {transition === 'landing' && (
        <motion.div
          key="landing"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 1, 0] }}
          transition={{ duration: 3, times: [0, 0.2, 0.7, 1] }}
          className="fixed inset-0 flex items-center justify-center"
          style={{ zIndex: 100, background: 'var(--bg-deep)' }}
        >
          <motion.div
            initial={{ scale: 3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 2, ease: 'easeOut' }}
            className="bridge-display text-3xl tracking-[0.3em] text-center"
            style={{ color: 'var(--amber-glow)', textShadow: '0 0 20px var(--amber)' }}
          >
            Arriving at Destination
          </motion.div>
        </motion.div>
      )}

      {transition === 'alert' && (
        <motion.div
          key="alert"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0.5, 1, 0] }}
          transition={{ duration: 1.5, times: [0, 0.1, 0.3, 0.5, 1] }}
          className="fixed inset-0 flex items-center justify-center"
          style={{ zIndex: 100 }}
        >
          <div
            className="absolute inset-0"
            style={{ background: 'rgba(239, 68, 68, 0.15)' }}
          />
          <motion.div
            initial={{ scale: 0.5 }}
            animate={{ scale: [0.5, 1.2, 1] }}
            transition={{ duration: 0.5 }}
            className="bridge-display text-5xl tracking-[0.5em]"
            style={{ color: 'var(--encounter)', textShadow: '0 0 40px var(--encounter)', zIndex: 1 }}
          >
            ENCOUNTER
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
