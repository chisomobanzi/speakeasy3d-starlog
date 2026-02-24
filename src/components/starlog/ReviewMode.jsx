import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, HelpCircle, RotateCcw, Volume2, Settings } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { calculateNextReview, QUALITY, sortByPriority } from '../../lib/srs';

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

  const currentEntry = localEntries[currentIndex];
  const progress = ((currentIndex) / localEntries.length) * 100;

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
    if (currentIndex + 1 >= localEntries.length) {
      setIsComplete(true);
    } else {
      setCurrentIndex(prev => prev + 1);
      setShowAnswer(false);
    }
  }, [currentEntry, currentIndex, localEntries.length, onUpdateEntry]);

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

  const handlePlayAudio = () => {
    if (currentEntry?.audio_url) {
      const audio = new Audio(currentEntry.audio_url);
      audio.play();
    }
  };

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
    <div className="fixed inset-0 bg-slate-950 z-50 flex flex-col">
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
                  </>
                ) : (
                  <h2 className="text-3xl font-bold text-white mb-2">
                    {currentEntry.translation}
                  </h2>
                )}
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
                        {currentEntry.audio_url && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={handlePlayAudio}
                            className="mb-2"
                          >
                            <Volume2 className="w-5 h-5" />
                          </Button>
                        )}
                        {currentEntry.notes && (
                          <p className="text-slate-400 mt-4">{currentEntry.notes}</p>
                        )}
                      </>
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

      {/* Settings panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center p-6"
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
                    onClick={() => handleReviewMethodChange('srs')}
                  >
                    SRS
                  </button>
                  <button
                    className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                      reviewMethod === 'random'
                        ? 'bg-starlog-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-300'
                    }`}
                    onClick={() => handleReviewMethodChange('random')}
                  >
                    Random
                  </button>
                </div>
              </div>

              <Button
                variant="primary"
                className="w-full mt-6"
                onClick={() => setShowSettings(false)}
              >
                Done
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
