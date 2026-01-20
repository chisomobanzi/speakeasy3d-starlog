import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, HelpCircle, RotateCcw, Volume2 } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { calculateNextReview, QUALITY } from '../../lib/srs';

export default function ReviewMode({
  entries,
  onComplete,
  onUpdateEntry,
  onClose,
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [results, setResults] = useState([]);
  const [isComplete, setIsComplete] = useState(false);

  const currentEntry = entries[currentIndex];
  const progress = ((currentIndex) / entries.length) * 100;

  const handleAnswer = useCallback(async (quality) => {
    if (!currentEntry) return;

    // Calculate new SRS data
    const srsUpdate = calculateNextReview(currentEntry, quality);

    // Record result
    setResults(prev => [...prev, {
      entry: currentEntry,
      quality,
      srsUpdate,
    }]);

    // Update entry in database
    await onUpdateEntry?.(currentEntry.id, srsUpdate);

    // Move to next or complete
    if (currentIndex + 1 >= entries.length) {
      setIsComplete(true);
    } else {
      setCurrentIndex(prev => prev + 1);
      setShowAnswer(false);
    }
  }, [currentEntry, currentIndex, entries.length, onUpdateEntry]);

  const handlePlayAudio = () => {
    if (currentEntry?.audio_url) {
      const audio = new Audio(currentEntry.audio_url);
      audio.play();
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
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
  }, [showAnswer, handleAnswer]);

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
    <div className="fixed inset-0 bg-slate-950 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
        <div className="text-sm text-slate-400">
          {currentIndex + 1} / {entries.length}
        </div>
        <div className="w-10" /> {/* Spacer */}
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-slate-800">
        <motion.div
          className="h-full bg-starlog-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
        />
      </div>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentEntry.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="w-full max-w-lg"
          >
            <Card className="text-center py-12">
              {/* Word */}
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-white mb-2">
                  {currentEntry.word}
                </h2>
                {currentEntry.phonetic && (
                  <p className="text-slate-500">/{currentEntry.phonetic}/</p>
                )}
                {currentEntry.audio_url && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handlePlayAudio}
                    className="mt-2"
                  >
                    <Volume2 className="w-5 h-5" />
                  </Button>
                )}
              </div>

              {/* Answer */}
              <AnimatePresence>
                {showAnswer && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border-t border-slate-800 pt-8"
                  >
                    <p className="text-2xl text-starlog-400 font-semibold">
                      {currentEntry.translation}
                    </p>
                    {currentEntry.notes && (
                      <p className="text-slate-400 mt-4">{currentEntry.notes}</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="p-4 border-t border-slate-800">
        {!showAnswer ? (
          <Button
            variant="primary"
            onClick={() => setShowAnswer(true)}
            className="w-full py-4"
          >
            Show Answer
          </Button>
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
    </div>
  );
}

// Review complete screen
function ReviewComplete({ results, onClose }) {
  const correct = results.filter(r => r.quality >= QUALITY.GOOD).length;
  const total = results.length;
  const percentage = Math.round((correct / total) * 100);

  return (
    <div className="fixed inset-0 bg-slate-950 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <div className="text-6xl mb-4">
          {percentage >= 80 ? '🎉' : percentage >= 50 ? '👍' : '💪'}
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
