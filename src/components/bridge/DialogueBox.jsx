import { motion, AnimatePresence } from 'framer-motion';
import { npcs } from '../../data/demoCampaign';

/**
 * Visual novel-style dialogue box.
 * Supports narration, NPC dialogue, and crew choices.
 */
export default function DialogueBox({ beat, onAdvance, onChoice }) {
  if (!beat) return null;

  // Narration
  if (beat.type === 'narration') {
    return (
      <motion.div
        key={beat.text}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.4 }}
        className="absolute bottom-0 left-0 right-0 dialogue-box p-8 cursor-pointer"
        onClick={onAdvance}
        style={{ zIndex: 20 }}
      >
        <p
          className="bridge-body text-2xl leading-relaxed italic"
          style={{ color: 'var(--text-secondary)' }}
        >
          {beat.text}
        </p>
        <div className="mt-4 text-right">
          <span className="bridge-mono text-xs animate-bridge-pulse" style={{ color: 'var(--text-dim)' }}>
            Click or press Space to continue ▸
          </span>
        </div>
      </motion.div>
    );
  }

  // NPC Dialogue
  if (beat.type === 'dialogue') {
    const npc = npcs[beat.npcId];
    return (
      <motion.div
        key={beat.text}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.4 }}
        className="absolute bottom-0 left-0 right-0 cursor-pointer"
        onClick={onAdvance}
        style={{ zIndex: 20 }}
      >
        {/* NPC portrait area */}
        <div className="flex items-end gap-6 px-8">
          {/* Portrait */}
          <div
            className="npc-portrait w-24 h-24 flex-shrink-0 flex items-center justify-center"
            style={{
              boxShadow: `0 0 20px rgba(${npc?.color === '#06B6D4' ? '6, 182, 212' : '167, 139, 250'}, 0.2)`,
            }}
          >
            <div
              className="w-16 h-16 rounded-full"
              style={{
                background: `radial-gradient(circle, ${npc?.color || '#06B6D4'}40, ${npc?.color || '#06B6D4'}10)`,
                border: `2px solid ${npc?.color || '#06B6D4'}50`,
              }}
            />
          </div>

          {/* Dialogue */}
          <div className="dialogue-box flex-1 p-6 rounded-t-xl">
            <div className="flex items-center gap-3 mb-3">
              <span
                className="bridge-display text-sm tracking-wider"
                style={{ color: npc?.color || 'var(--cyan)' }}
              >
                {npc?.name || 'Unknown'}
              </span>
              <span className="text-xs" style={{ color: 'var(--text-dim)' }}>
                {npc?.role}
              </span>
            </div>
            <p className="bridge-body text-2xl leading-relaxed" style={{ color: 'var(--text-primary)' }}>
              {beat.text}
            </p>
            <div className="mt-4 text-right">
              <span className="bridge-mono text-xs animate-bridge-pulse" style={{ color: 'var(--text-dim)' }}>
                Click or press Space to continue ▸
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Crew Choice
  if (beat.type === 'choice') {
    return (
      <motion.div
        key="choice"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.4 }}
        className="absolute bottom-0 left-0 right-0 dialogue-box p-8"
        style={{ zIndex: 20 }}
      >
        <div
          className="bridge-display text-lg tracking-wider mb-6"
          style={{ color: 'var(--amber)' }}
        >
          {beat.prompt}
        </div>
        <div className="flex flex-col gap-3 max-w-2xl">
          {beat.options.map((option, i) => (
            <motion.button
              key={i}
              whileHover={{ scale: 1.02, x: 8 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onChoice(option, i)}
              className="text-left px-6 py-4 rounded-lg border transition-colors"
              style={{
                background: 'rgba(30, 41, 59, 0.6)',
                borderColor: 'rgba(148, 163, 184, 0.15)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-body)',
                fontSize: '1.25rem',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--amber)';
                e.currentTarget.style.background = 'rgba(245, 158, 11, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.15)';
                e.currentTarget.style.background = 'rgba(30, 41, 59, 0.6)';
              }}
            >
              <span className="bridge-mono text-sm mr-3" style={{ color: 'var(--amber)' }}>
                {i + 1}.
              </span>
              {option.text}
            </motion.button>
          ))}
        </div>
      </motion.div>
    );
  }

  return null;
}
