import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBridgeStore } from '../../stores/bridgeStore';
import useMicrophone from '../../hooks/useMicrophone';

/**
 * Spell Duel encounter — words appear, students pronounce them,
 * mic input fills the fuel gauge. Visual effects on success.
 */
export default function SpellDuel({ encounter, onComplete }) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(encounter.timerSeconds);
  const [wordProgress, setWordProgress] = useState(0);
  const [completedWords, setCompletedWords] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const addFuel = useBridgeStore((s) => s.addFuel);
  const { volume, isSpeaking } = useMicrophone({ enabled: !isFinished });
  const progressRef = useRef(0);

  const currentWord = encounter.words[currentWordIndex];

  // Timer countdown
  useEffect(() => {
    if (isFinished) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setIsFinished(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isFinished]);

  // Speech drives word progress
  useEffect(() => {
    if (isFinished || !isSpeaking) return;

    const interval = setInterval(() => {
      progressRef.current += volume * 15 * encounter.fuelMultiplier;
      setWordProgress(Math.min(progressRef.current, 100));

      // Word completed
      if (progressRef.current >= 100) {
        setCompletedWords((prev) => [...prev, currentWord.word]);
        setShowSuccess(true);
        addFuel(8 * encounter.fuelMultiplier);
        progressRef.current = 0;
        setWordProgress(0);

        setTimeout(() => {
          setShowSuccess(false);
          if (currentWordIndex + 1 >= encounter.words.length) {
            setIsFinished(true);
          } else {
            setCurrentWordIndex((i) => i + 1);
          }
        }, 800);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [isSpeaking, volume, currentWordIndex, isFinished, encounter, currentWord, addFuel]);

  // Also add fuel passively when speaking (even between words)
  useEffect(() => {
    if (!isSpeaking || isFinished) return;
    const interval = setInterval(() => {
      addFuel(volume * 2);
    }, 100);
    return () => clearInterval(interval);
  }, [isSpeaking, volume, addFuel, isFinished]);

  if (isFinished) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 flex items-center justify-center"
        style={{ background: 'var(--bg-deep)', zIndex: 30 }}
      >
        <div className="text-center">
          <div
            className="bridge-display text-5xl tracking-wider mb-8"
            style={{ color: 'var(--amber)', textShadow: '0 0 30px rgba(245, 158, 11, 0.4)' }}
          >
            {completedWords.length === encounter.words.length ? 'All Clear!' : 'Time\'s Up!'}
          </div>
          <div className="bridge-body text-2xl mb-4" style={{ color: 'var(--text-secondary)' }}>
            {completedWords.length} / {encounter.words.length} words powered
          </div>
          <div className="flex gap-3 justify-center flex-wrap mt-6">
            {encounter.words.map((w) => (
              <span
                key={w.word}
                className="px-4 py-2 rounded-lg bridge-body text-lg"
                style={{
                  background: completedWords.includes(w.word) ? 'rgba(34, 197, 94, 0.15)' : 'rgba(100, 116, 139, 0.1)',
                  color: completedWords.includes(w.word) ? 'var(--success)' : 'var(--text-dim)',
                  border: `1px solid ${completedWords.includes(w.word) ? 'rgba(34, 197, 94, 0.3)' : 'rgba(100, 116, 139, 0.15)'}`,
                }}
              >
                {w.word}
              </span>
            ))}
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onComplete}
            className="mt-10 px-8 py-3 rounded-xl bridge-display text-lg tracking-wider"
            style={{
              background: 'var(--amber)',
              color: 'var(--bg-deep)',
            }}
          >
            Continue
          </motion.button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ background: 'var(--bg-deep)' }}>
      {/* Encounter title */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 text-center">
        <div
          className="bridge-display text-xl tracking-[0.3em]"
          style={{ color: 'var(--encounter)' }}
        >
          {encounter.title}
        </div>
        <div className="bridge-body text-sm mt-1" style={{ color: 'var(--text-dim)' }}>
          {encounter.description}
        </div>
      </div>

      {/* Timer */}
      <div className="absolute top-8 right-10">
        <div
          className="bridge-mono text-4xl font-bold"
          style={{
            color: timeLeft <= 10 ? 'var(--alert)' : 'var(--text-primary)',
            textShadow: timeLeft <= 10 ? '0 0 15px var(--alert)' : 'none',
          }}
        >
          {timeLeft}
        </div>
      </div>

      {/* Word count */}
      <div className="absolute top-8 left-10">
        <div className="bridge-mono text-sm" style={{ color: 'var(--text-dim)' }}>
          {currentWordIndex + 1} / {encounter.words.length}
        </div>
      </div>

      {/* Current word */}
      <AnimatePresence mode="wait">
        {currentWord && (
          <motion.div
            key={currentWord.word}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            <div
              className="bridge-display tracking-wider"
              style={{
                fontSize: '5rem',
                color: showSuccess ? 'var(--success)' : 'var(--text-primary)',
                textShadow: showSuccess
                  ? '0 0 40px var(--success)'
                  : isSpeaking
                    ? '0 0 20px var(--amber-glow)'
                    : 'none',
                transition: 'text-shadow 0.2s, color 0.2s',
              }}
            >
              {currentWord.word}
            </div>
            <div
              className="bridge-mono text-xl mt-4"
              style={{ color: 'var(--text-dim)' }}
            >
              {currentWord.phonetic}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress bar under the word */}
      <div
        className="absolute bottom-[35%] left-1/2 -translate-x-1/2 rounded-full overflow-hidden"
        style={{
          width: 300,
          height: 8,
          background: 'rgba(30, 41, 59, 0.8)',
          border: '1px solid rgba(148, 163, 184, 0.1)',
        }}
      >
        <motion.div
          className="h-full rounded-full"
          animate={{ width: `${wordProgress}%` }}
          transition={{ duration: 0.1 }}
          style={{
            background: `linear-gradient(to right, var(--fuel-cold), var(--fuel-warm))`,
            boxShadow: `0 0 10px var(--fuel-warm)`,
          }}
        />
      </div>

      {/* Mic indicator */}
      <div className="absolute bottom-[25%] left-1/2 -translate-x-1/2 flex items-center gap-3">
        <div
          className="w-3 h-3 rounded-full"
          style={{
            backgroundColor: isSpeaking ? 'var(--success)' : 'var(--text-dim)',
            boxShadow: isSpeaking ? '0 0 10px var(--success)' : 'none',
            transition: 'all 0.15s',
          }}
        />
        <span className="bridge-mono text-sm" style={{ color: 'var(--text-dim)' }}>
          {isSpeaking ? 'Listening...' : 'Speak now'}
        </span>
      </div>

      {/* Success flash */}
      {showSuccess && (
        <motion.div
          initial={{ opacity: 0.6 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'rgba(34, 197, 94, 0.1)' }}
        />
      )}
    </div>
  );
}
