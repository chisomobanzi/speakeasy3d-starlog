import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mic, Square, Play, Pause, Trash2, Check } from 'lucide-react';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
import Button from '../ui/Button';

export default function AudioRecorder({
  onSave,
  onCancel,
  existingUrl,
  maxDuration = 30,
  className = '',
}) {
  const {
    isRecording,
    audioBlob,
    audioUrl,
    duration,
    formattedDuration,
    error,
    startRecording,
    stopRecording,
    clearRecording,
    isSupported,
  } = useAudioRecorder();

  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState(null);

  // Auto-stop at max duration
  useEffect(() => {
    if (isRecording && duration >= maxDuration) {
      stopRecording();
    }
  }, [isRecording, duration, maxDuration, stopRecording]);

  // Create audio element for playback
  useEffect(() => {
    const url = audioUrl || existingUrl;
    if (url) {
      const audioElement = new Audio(url);
      audioElement.onended = () => setIsPlaying(false);
      setAudio(audioElement);
      return () => {
        audioElement.pause();
        audioElement.src = '';
      };
    }
  }, [audioUrl, existingUrl]);

  const handlePlayPause = () => {
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSave = () => {
    if (audioBlob) {
      onSave?.(audioBlob, audioUrl);
    }
  };

  const handleCancel = () => {
    clearRecording();
    if (audio) {
      audio.pause();
    }
    setIsPlaying(false);
    onCancel?.();
  };

  if (!isSupported) {
    return (
      <div className={`p-4 bg-red-500/10 border border-red-500/30 rounded-xl ${className}`}>
        <p className="text-red-400 text-sm">
          Audio recording is not supported in your browser.
        </p>
      </div>
    );
  }

  const hasAudio = audioUrl || existingUrl;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Recording visualizer */}
      <div className="relative h-24 bg-slate-900/50 rounded-xl overflow-hidden flex items-center justify-center">
        {isRecording ? (
          <RecordingVisualizer />
        ) : hasAudio ? (
          <WaveformPreview />
        ) : (
          <p className="text-slate-500 text-sm">Tap to record pronunciation</p>
        )}

        {/* Duration display */}
        {(isRecording || hasAudio) && (
          <div className="absolute bottom-2 right-2 text-xs text-slate-400 bg-slate-900/80 px-2 py-1 rounded">
            {formattedDuration || '0:00'} / {maxDuration}s
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="text-red-400 text-sm">{error}</p>
      )}

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        {!hasAudio && !isRecording && (
          <Button
            variant="primary"
            onClick={startRecording}
            className="gap-2"
          >
            <Mic className="w-5 h-5" />
            Record
          </Button>
        )}

        {isRecording && (
          <Button
            variant="danger"
            onClick={stopRecording}
            className="gap-2"
          >
            <Square className="w-5 h-5" />
            Stop ({maxDuration - duration}s)
          </Button>
        )}

        {hasAudio && !isRecording && (
          <>
            <Button
              variant="secondary"
              size="icon"
              onClick={handlePlayPause}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={clearRecording}
            >
              <Trash2 className="w-5 h-5" />
            </Button>

            {audioBlob && (
              <Button
                variant="primary"
                onClick={handleSave}
                className="gap-2"
              >
                <Check className="w-5 h-5" />
                Save
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Animated recording visualizer
function RecordingVisualizer() {
  return (
    <div className="flex items-center justify-center gap-1">
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="w-1 bg-starlog-500 rounded-full"
          animate={{
            height: [8, 32, 8],
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            delay: i * 0.05,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Recording indicator */}
      <motion.div
        className="absolute top-3 left-3 flex items-center gap-2"
        animate={{ opacity: [1, 0.5, 1] }}
        transition={{ duration: 1, repeat: Infinity }}
      >
        <div className="w-2 h-2 bg-red-500 rounded-full" />
        <span className="text-xs text-red-400">Recording</span>
      </motion.div>
    </div>
  );
}

// Static waveform preview
function WaveformPreview() {
  return (
    <div className="flex items-center justify-center gap-0.5 px-4">
      {[...Array(40)].map((_, i) => (
        <div
          key={i}
          className="w-1 bg-starlog-500/60 rounded-full"
          style={{
            height: `${Math.random() * 24 + 8}px`,
          }}
        />
      ))}
    </div>
  );
}
