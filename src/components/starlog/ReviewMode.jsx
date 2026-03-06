import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import { X, Check, HelpCircle, RotateCcw, Volume2, Settings, ChevronDown, ChevronRight, ChevronUp } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { calculateNextReview, QUALITY, sortByPriority } from '../../lib/srs';
import { useAppStore } from '../../stores/appStore';

// Browser TTS helper
function speakWord(text, lang = 'en') {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.85;
  window.speechSynthesis.speak(utterance);
}

// Swipe direction thresholds
const SWIPE_THRESHOLD = 60;

function getSwipeDirection(dx, dy) {
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  if (absDx < SWIPE_THRESHOLD && absDy < SWIPE_THRESHOLD) return null;

  // Primarily vertical
  if (absDy > absDx) {
    return dy < 0 ? 'up' : 'down';
  }
  // Primarily horizontal
  return dx > 0 ? 'right' : null; // only right swipe matters
}

const SWIPE_LABELS = {
  down: { label: 'Again', color: '#ef4444', icon: ChevronDown, quality: QUALITY.AGAIN },
  right: { label: 'Good', color: '#22c55e', icon: ChevronRight, quality: QUALITY.GOOD },
  up: { label: 'Easy', color: '#06b6d4', icon: ChevronUp, quality: QUALITY.EASY },
};

export default function ReviewMode({
  entries,
  onComplete,
  onUpdateEntry,
  onClose,
}) {
  const [localEntries, setLocalEntries] = useState(entries);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [results, setResults] = useState([]);
  const [isComplete, setIsComplete] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [frontSide, setFrontSide] = useState('word');
  const [reviewMethod, setReviewMethod] = useState('srs');

  // Swipe tracking
  const [activeSwipe, setActiveSwipe] = useState(null); // 'up' | 'down' | 'right' | null
  const touchStartRef = useRef(null);
  const cardX = useMotionValue(0);
  const cardY = useMotionValue(0);
  const cardRotate = useTransform(cardX, [-200, 0, 200], [-8, 0, 8]);
  const cardOpacity = useTransform(
    [cardX, cardY],
    ([x, y]) => {
      const dist = Math.sqrt(x * x + y * y);
      return dist > 150 ? 0.5 : 1;
    }
  );

  // Settings from store
  const autoPlayTTS = useAppStore((s) => s.preferences.autoPlayTTS ?? false);

  const currentEntry = localEntries[currentIndex];
  const progress = ((currentIndex) / localEntries.length) * 100;

  const handleAnswer = useCallback(async (quality) => {
    if (!currentEntry) return;

    const srsUpdate = calculateNextReview(currentEntry, quality);

    setResults(prev => [...prev, {
      entry: currentEntry,
      quality,
      srsUpdate,
    }]);

    await onUpdateEntry?.(currentEntry.id, srsUpdate);

    if (currentIndex + 1 >= localEntries.length) {
      setIsComplete(true);
    } else {
      setCurrentIndex(prev => prev + 1);
      setShowAnswer(false);
      // Reset card position
      cardX.set(0);
      cardY.set(0);
    }
  }, [currentEntry, currentIndex, localEntries.length, onUpdateEntry, cardX, cardY]);

  const handleReviewMethodChange = useCallback((method) => {
    setReviewMethod(method);
    const remaining = localEntries.slice(currentIndex);
    let reordered;
    if (method === 'random') {
      reordered = [...remaining];
      for (let i = reordered.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [reordered[i], reordered[j]] = [reordered[j], reordered[i]];
      }
    } else {
      reordered = sortByPriority(remaining);
    }
    setLocalEntries([...localEntries.slice(0, currentIndex), ...reordered]);
  }, [localEntries, currentIndex]);

  const handlePlayAudio = useCallback(() => {
    if (currentEntry?.audio_url) {
      const audio = new Audio(currentEntry.audio_url);
      audio.play();
    } else if (currentEntry?.word) {
      speakWord(currentEntry.word, currentEntry.language || 'en');
    }
  }, [currentEntry]);

  // Auto-play TTS when card changes
  useEffect(() => {
    if (autoPlayTTS && currentEntry && !showAnswer) {
      const timer = setTimeout(() => {
        if (frontSide === 'word') {
          handlePlayAudio();
        }
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, autoPlayTTS, currentEntry, frontSide, handlePlayAudio, showAnswer]);

  // Touch handlers for swipe
  const handleTouchStart = useCallback((e) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!touchStartRef.current || !showAnswer) return;

    const dx = e.touches[0].clientX - touchStartRef.current.x;
    const dy = e.touches[0].clientY - touchStartRef.current.y;

    cardX.set(dx);
    cardY.set(dy);

    const dir = getSwipeDirection(dx, dy);
    setActiveSwipe(dir);
  }, [showAnswer, cardX, cardY]);

  const handleTouchEnd = useCallback(() => {
    if (!touchStartRef.current) return;

    const dx = cardX.get();
    const dy = cardY.get();
    const dir = getSwipeDirection(dx, dy);

    if (showAnswer && dir && SWIPE_LABELS[dir]) {
      // Animate card off-screen then answer
      const targetX = dir === 'right' ? 400 : 0;
      const targetY = dir === 'up' ? -400 : dir === 'down' ? 400 : 0;
      animate(cardX, targetX, { duration: 0.2 });
      animate(cardY, targetY, { duration: 0.2 });
      setTimeout(() => handleAnswer(SWIPE_LABELS[dir].quality), 200);
    } else {
      // Snap back
      animate(cardX, 0, { type: 'spring', stiffness: 300, damping: 30 });
      animate(cardY, 0, { type: 'spring', stiffness: 300, damping: 30 });
    }

    setActiveSwipe(null);
    touchStartRef.current = null;
  }, [showAnswer, handleAnswer, cardX, cardY]);

  // Tap to show answer
  const handleCardTap = useCallback(() => {
    if (!showAnswer) {
      setShowAnswer(true);
    }
  }, [showAnswer]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showSettings) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (!showAnswer) {
          setShowAnswer(true);
        }
      } else if (showAnswer) {
        switch (e.key) {
          case '1':
            handleAnswer(QUALITY.AGAIN);
            break;
          case '2':
            handleAnswer(QUALITY.HARD);
            break;
          case '3':
            handleAnswer(QUALITY.GOOD);
            break;
          case '4':
            handleAnswer(QUALITY.EASY);
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAnswer, showSettings, handleAnswer]);

  if (isComplete) {
    return <ReviewComplete results={results} onClose={onComplete} />;
  }

  if (!currentEntry) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">No entries to review</p>
        <Button variant="ghost" onClick={onClose} className="mt-4">
          Close
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-950 z-[60] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
        <div className="text-sm text-slate-400">
          {currentIndex + 1} / {localEntries.length}
        </div>
        <Button variant="ghost" size="icon" onClick={() => setShowSettings(true)}>
          <Settings className="w-5 h-5" />
        </Button>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-slate-800">
        <motion.div
          className="h-full bg-starlog-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
        />
      </div>

      {/* Card area */}
      <div
        className="flex-1 flex items-center justify-center p-4 relative select-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Swipe direction hints (visible when answer shown) */}
        {showAnswer && (
          <div className="absolute inset-0 pointer-events-none z-0">
            {/* Down = Again */}
            <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center transition-opacity duration-150 ${activeSwipe === 'down' ? 'opacity-100' : 'opacity-30'}`}>
              <ChevronDown className="w-6 h-6 text-red-400" />
              <span className="text-xs text-red-400 font-medium">Again</span>
            </div>
            {/* Right = Good */}
            <div className={`absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-1 transition-opacity duration-150 ${activeSwipe === 'right' ? 'opacity-100' : 'opacity-30'}`}>
              <span className="text-xs text-green-400 font-medium">Good</span>
              <ChevronRight className="w-6 h-6 text-green-400" />
            </div>
            {/* Up = Easy */}
            <div className={`absolute top-20 left-1/2 -translate-x-1/2 flex flex-col items-center transition-opacity duration-150 ${activeSwipe === 'up' ? 'opacity-100' : 'opacity-30'}`}>
              <span className="text-xs text-cyan-400 font-medium">Easy</span>
              <ChevronUp className="w-6 h-6 text-cyan-400" />
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={currentEntry.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-lg z-10"
            style={{
              x: cardX,
              y: cardY,
              rotate: cardRotate,
              opacity: cardOpacity,
            }}
            onClick={handleCardTap}
          >
            <Card className="text-center py-12 cursor-pointer">
              {/* Front */}
              <div className="mb-8">
                {frontSide === 'word' ? (
                  <>
                    <h2 className="text-3xl font-bold text-white mb-2">
                      {currentEntry.word}
                    </h2>
                    {currentEntry.phonetic && (
                      <p className="text-slate-500">/{currentEntry.phonetic}/</p>
                    )}
                  </>
                ) : (
                  <h2 className="text-3xl font-bold text-white mb-2">
                    {currentEntry.translation}
                  </h2>
                )}

                {/* Audio button — always visible */}
                <button
                  onClick={(e) => { e.stopPropagation(); handlePlayAudio(); }}
                  className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800 hover:bg-slate-700 transition-colors text-slate-300 hover:text-white"
                >
                  <Volume2 className="w-5 h-5" />
                  <span className="text-sm">Play</span>
                </button>
              </div>

              {/* Back */}
              <AnimatePresence>
                {showAnswer && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border-t border-slate-800 pt-8"
                  >
                    {frontSide === 'word' ? (
                      <>
                        <p className="text-2xl text-starlog-400 font-semibold">
                          {currentEntry.translation}
                        </p>
                        {currentEntry.notes && (
                          <p className="text-slate-400 mt-4">{currentEntry.notes}</p>
                        )}
                      </>
                    ) : (
                      <>
                        <h3 className="text-2xl text-starlog-400 font-semibold mb-2">
                          {currentEntry.word}
                        </h3>
                        {currentEntry.phonetic && (
                          <p className="text-slate-500 mb-2">/{currentEntry.phonetic}/</p>
                        )}
                        {currentEntry.notes && (
                          <p className="text-slate-400 mt-4">{currentEntry.notes}</p>
                        )}
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Tap hint */}
              {!showAnswer && (
                <p className="text-slate-600 text-sm mt-4">Tap to reveal answer</p>
              )}
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controls — desktop fallback buttons, also visible on mobile when answer shown */}
      <div className="p-4 border-t border-slate-800">
        {!showAnswer ? (
          <div className="text-center text-slate-500 text-sm py-3 hidden md:block">
            Press Space or tap the card to reveal the answer
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            <Button
              variant="danger"
              onClick={() => handleAnswer(QUALITY.AGAIN)}
              className="flex-col py-4"
            >
              <RotateCcw className="w-5 h-5 mb-1" />
              <span className="text-xs">Again</span>
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleAnswer(QUALITY.HARD)}
              className="flex-col py-4"
            >
              <HelpCircle className="w-5 h-5 mb-1" />
              <span className="text-xs">Hard</span>
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleAnswer(QUALITY.GOOD)}
              className="flex-col py-4"
            >
              <Check className="w-5 h-5 mb-1" />
              <span className="text-xs">Good</span>
            </Button>
            <Button
              variant="primary"
              onClick={() => handleAnswer(QUALITY.EASY)}
              className="flex-col py-4"
            >
              <Check className="w-5 h-5 mb-1" />
              <span className="text-xs">Easy</span>
            </Button>
          </div>
        )}
      </div>

      {/* Settings panel */}
      <AnimatePresence>
        {showSettings && (
          <ReviewSettings
            frontSide={frontSide}
            setFrontSide={setFrontSide}
            reviewMethod={reviewMethod}
            onReviewMethodChange={handleReviewMethodChange}
            onClose={() => setShowSettings(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Settings panel extracted for clarity
function ReviewSettings({ frontSide, setFrontSide, reviewMethod, onReviewMethodChange, onClose }) {
  const autoPlayTTS = useAppStore((s) => s.preferences.autoPlayTTS ?? false);
  const updatePreferences = useAppStore((s) => s.updatePreferences);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 z-20"
    >
      <div className="w-full max-w-sm space-y-8">
        <h2 className="text-xl font-bold text-white text-center">Settings</h2>

        {/* Card Front toggle */}
        <div>
          <label className="block text-sm text-slate-400 mb-2">Card Front</label>
          <div className="flex rounded-lg overflow-hidden border border-slate-700">
            <button
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                frontSide === 'word'
                  ? 'bg-starlog-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-300'
              }`}
              onClick={() => setFrontSide('word')}
            >
              Word
            </button>
            <button
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                frontSide === 'translation'
                  ? 'bg-starlog-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-300'
              }`}
              onClick={() => setFrontSide('translation')}
            >
              Translation
            </button>
          </div>
        </div>

        {/* Review Method toggle */}
        <div>
          <label className="block text-sm text-slate-400 mb-2">Review Method</label>
          <div className="flex rounded-lg overflow-hidden border border-slate-700">
            <button
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                reviewMethod === 'srs'
                  ? 'bg-starlog-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-300'
              }`}
              onClick={() => onReviewMethodChange('srs')}
            >
              SRS
            </button>
            <button
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                reviewMethod === 'random'
                  ? 'bg-starlog-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-300'
              }`}
              onClick={() => onReviewMethodChange('random')}
            >
              Random
            </button>
          </div>
        </div>

        {/* Auto-play TTS toggle */}
        <div className="flex items-center justify-between py-3">
          <div>
            <p className="font-medium text-white">Auto-play audio</p>
            <p className="text-sm text-slate-400">Speak the word when each card appears</p>
          </div>
          <button
            onClick={() => updatePreferences({ autoPlayTTS: !autoPlayTTS })}
            className={`relative w-11 h-6 rounded-full transition-colors ${autoPlayTTS ? 'bg-starlog-500' : 'bg-slate-700'}`}
          >
            <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${autoPlayTTS ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>

        <Button
          variant="primary"
          className="w-full mt-6"
          onClick={onClose}
        >
          Done
        </Button>
      </div>
    </motion.div>
  );
}

// Review complete screen
function ReviewComplete({ results, onClose }) {
  const correct = results.filter(r => r.quality >= QUALITY.GOOD).length;
  const total = results.length;
  const percentage = Math.round((correct / total) * 100);

  return (
    <div className="fixed inset-0 bg-slate-950 z-[60] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <div className="text-6xl mb-4">
          {percentage >= 80 ? '\u{1F389}' : percentage >= 50 ? '\u{1F44D}' : '\u{1F4AA}'}
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Review Complete!
        </h2>
        <p className="text-slate-400 mb-8">
          You got {correct} out of {total} correct ({percentage}%)
        </p>

        <Button variant="primary" onClick={onClose}>
          Done
        </Button>
      </motion.div>
    </div>
  );
}
