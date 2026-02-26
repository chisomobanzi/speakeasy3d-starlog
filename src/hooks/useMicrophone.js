import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Web Audio API hook for microphone input.
 * Returns real-time volume (RMS amplitude 0-1) and speech detection.
 */
export default function useMicrophone({ enabled = true, smoothing = 0.8 } = {}) {
  const [volume, setVolume] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const smoothedRef = useRef(0);

  // Speech detection threshold (adjusted for typical classroom)
  const speechThreshold = 0.04;
  const silenceDelay = 300; // ms of silence before "not speaking"
  const lastSpeechRef = useRef(0);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = smoothing;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      streamRef.current = stream;
      setIsConnected(true);
      setError(null);

      // Start the analysis loop
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        analyser.getByteTimeDomainData(dataArray);

        // Calculate RMS (root mean square) for volume
        let sumSquares = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const normalized = (dataArray[i] - 128) / 128;
          sumSquares += normalized * normalized;
        }
        const rms = Math.sqrt(sumSquares / dataArray.length);

        // Smooth the value
        smoothedRef.current = smoothedRef.current * 0.7 + rms * 0.3;
        setVolume(smoothedRef.current);

        // Speech detection
        const now = Date.now();
        if (smoothedRef.current > speechThreshold) {
          lastSpeechRef.current = now;
          setIsSpeaking(true);
        } else if (now - lastSpeechRef.current > silenceDelay) {
          setIsSpeaking(false);
        }

        rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);
    } catch (err) {
      setError(err.message || 'Microphone access denied');
      setIsConnected(false);
    }
  }, [smoothing]);

  const stop = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    smoothedRef.current = 0;
    setVolume(0);
    setIsSpeaking(false);
    setIsConnected(false);
  }, []);

  useEffect(() => {
    if (enabled) {
      start();
    }
    return () => stop();
  }, [enabled, start, stop]);

  return { volume, isSpeaking, isConnected, error, start, stop };
}
