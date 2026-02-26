import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import useMicrophone from '../hooks/useMicrophone';
import '../styles/bridge.css';

/**
 * Echo Page — Phone companion app.
 * Captures mic audio and sends volume data to Bridge via WebSocket.
 * Designed for mobile — simple, clear, big UI.
 */
export default function EchoPage() {
  const [sessionCode, setSessionCode] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [fuelLevel, setFuelLevel] = useState(0);
  const [error, setError] = useState(null);

  const wsRef = useRef(null);
  const deviceIdRef = useRef(`echo-${Math.random().toString(36).slice(2, 8)}`);

  // Mic — only enable after joining
  const { volume, isSpeaking, isConnected: micConnected, error: micError } = useMicrophone({
    enabled: isJoined,
  });

  // Connect to WebSocket relay
  const joinSession = useCallback(() => {
    const code = sessionCode.trim().toUpperCase();
    if (code.length < 4) {
      setError('Enter a 4-character session code');
      return;
    }

    setError(null);

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const wsUrl = `${protocol}//${host}:8080`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
        ws.send(JSON.stringify({
          type: 'join',
          role: 'echo',
          code,
          deviceId: deviceIdRef.current,
          name: 'Phone Echo',
        }));
      };

      ws.onmessage = (event) => {
        let msg;
        try {
          msg = JSON.parse(event.data);
        } catch {
          return;
        }
        if (msg.type === 'joined') {
          setIsJoined(true);
        }
        if (msg.type === 'fuel_boost') {
          setFuelLevel((f) => Math.min(100, f + (msg.amount || 10)));
        }
        if (msg.type === 'error') {
          setError(msg.message);
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
        if (isJoined) {
          // Try to reconnect
          setTimeout(() => joinSession(), 2000);
        }
      };

      ws.onerror = () => {
        setError('Cannot connect to server');
        setWsConnected(false);
      };
    } catch (err) {
      setError('Connection failed');
    }
  }, [sessionCode, isJoined]);

  // Send volume data to server at ~20fps
  useEffect(() => {
    if (!isJoined || !wsRef.current) return;

    const interval = setInterval(() => {
      const ws = wsRef.current;
      if (ws?.readyState === 1) {
        ws.send(JSON.stringify({
          type: 'volume',
          volume,
          isSpeaking,
        }));
      }
    }, 50); // 20fps

    return () => clearInterval(interval);
  }, [isJoined, volume, isSpeaking]);

  // Local fuel visualization (mirrors what Bridge sees roughly)
  useEffect(() => {
    if (!isJoined) return;
    const interval = setInterval(() => {
      setFuelLevel((f) => {
        if (isSpeaking) return Math.min(100, f + volume * 8);
        return Math.max(0, f - 0.5);
      });
    }, 50);
    return () => clearInterval(interval);
  }, [isJoined, isSpeaking, volume]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  // Fuel color
  const fuelColor = fuelLevel < 25 ? '#3B82F6' : fuelLevel < 50 ? '#F59E0B' : fuelLevel < 75 ? '#FBBF24' : '#FEF3C7';

  // --- JOIN SCREEN ---
  if (!isJoined) {
    return (
      <div className="bridge-mode fixed inset-0 flex flex-col items-center justify-center p-6"
        style={{ background: 'var(--bg-deep)' }}
      >
        {/* Logo / Title */}
        <div className="text-center mb-12">
          <div
            className="bridge-display text-4xl tracking-wider bridge-text-glow-cyan"
            style={{ color: 'var(--cyan)' }}
          >
            Echo
          </div>
          <div className="bridge-body text-lg mt-2" style={{ color: 'var(--text-secondary)' }}>
            Voice sensor for Starlog Bridge
          </div>
        </div>

        {/* Session code input */}
        <div className="w-full max-w-xs">
          <label
            className="bridge-display text-xs tracking-[0.3em] block mb-3 text-center"
            style={{ color: 'var(--text-dim)' }}
          >
            Session Code
          </label>
          <input
            type="text"
            value={sessionCode}
            onChange={(e) => setSessionCode(e.target.value.toUpperCase().slice(0, 6))}
            placeholder="ABCD"
            maxLength={6}
            autoFocus
            className="w-full text-center text-4xl py-4 px-6 rounded-xl border-2 outline-none bridge-display tracking-[0.5em]"
            style={{
              background: 'var(--bg-panel)',
              borderColor: 'rgba(148, 163, 184, 0.2)',
              color: 'var(--text-primary)',
              caretColor: 'var(--cyan)',
            }}
            onFocus={(e) => { e.target.style.borderColor = 'var(--cyan)'; }}
            onBlur={(e) => { e.target.style.borderColor = 'rgba(148, 163, 184, 0.2)'; }}
            onKeyDown={(e) => { if (e.key === 'Enter') joinSession(); }}
          />
        </div>

        {/* Error */}
        {(error || micError) && (
          <div className="mt-4 text-sm" style={{ color: 'var(--alert)' }}>
            {error || micError}
          </div>
        )}

        {/* Connect button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={joinSession}
          className="mt-8 px-10 py-4 rounded-xl bridge-display text-xl tracking-wider"
          style={{
            background: 'var(--cyan)',
            color: 'var(--bg-deep)',
          }}
        >
          Connect
        </motion.button>

        <div className="mt-6 text-center bridge-mono text-xs" style={{ color: 'var(--text-dim)' }}>
          Enter the code shown on the Bridge display
        </div>
      </div>
    );
  }

  // --- CONNECTED / ACTIVE SCREEN ---
  return (
    <div
      className="bridge-mode fixed inset-0 flex flex-col items-center justify-center p-6"
      style={{ background: 'var(--bg-deep)' }}
    >
      {/* Status bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: wsConnected ? 'var(--success)' : 'var(--alert)',
              boxShadow: wsConnected ? '0 0 6px var(--success)' : 'none',
            }}
          />
          <span className="bridge-mono text-xs" style={{ color: 'var(--text-dim)' }}>
            {wsConnected ? `Connected · ${sessionCode}` : 'Reconnecting...'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: micConnected ? 'var(--success)' : 'var(--text-dim)',
              boxShadow: micConnected ? '0 0 6px var(--success)' : 'none',
            }}
          />
          <span className="bridge-mono text-xs" style={{ color: 'var(--text-dim)' }}>
            {micConnected ? 'Mic active' : 'Mic off'}
          </span>
        </div>
      </div>

      {/* Fuel ring — big circular gauge */}
      <div className="relative flex items-center justify-center" style={{ width: 240, height: 240 }}>
        <svg width="240" height="240" viewBox="0 0 240 240">
          {/* Background ring */}
          <circle
            cx="120" cy="120" r="100"
            fill="none"
            stroke="rgba(30, 41, 59, 0.8)"
            strokeWidth="12"
          />
          {/* Fuel ring */}
          <circle
            cx="120" cy="120" r="100"
            fill="none"
            stroke={fuelColor}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 100}`}
            strokeDashoffset={`${2 * Math.PI * 100 * (1 - fuelLevel / 100)}`}
            transform="rotate(-90 120 120)"
            style={{
              transition: 'stroke-dashoffset 0.2s, stroke 0.5s',
              filter: `drop-shadow(0 0 ${6 + fuelLevel * 0.15}px ${fuelColor})`,
            }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute text-center">
          <div
            className="bridge-display text-5xl"
            style={{ color: fuelColor, textShadow: `0 0 15px ${fuelColor}40` }}
          >
            {Math.round(fuelLevel)}
          </div>
          <div className="bridge-mono text-xs mt-1" style={{ color: 'var(--text-dim)' }}>
            FUEL
          </div>
        </div>
      </div>

      {/* Speaking indicator */}
      <motion.div
        animate={{
          scale: isSpeaking ? [1, 1.1, 1] : 1,
          opacity: isSpeaking ? 1 : 0.4,
        }}
        transition={{ duration: 0.3, repeat: isSpeaking ? Infinity : 0, repeatType: 'loop' }}
        className="mt-8 flex items-center gap-3"
      >
        <div
          className="w-4 h-4 rounded-full"
          style={{
            backgroundColor: isSpeaking ? 'var(--success)' : 'var(--text-dim)',
            boxShadow: isSpeaking ? '0 0 12px var(--success)' : 'none',
            transition: 'all 0.15s',
          }}
        />
        <span
          className="bridge-display text-lg tracking-wider"
          style={{ color: isSpeaking ? 'var(--text-primary)' : 'var(--text-dim)' }}
        >
          {isSpeaking ? 'Speaking' : 'Listening...'}
        </span>
      </motion.div>

      {/* Volume meter */}
      <div
        className="mt-6 rounded-full overflow-hidden"
        style={{
          width: 200,
          height: 6,
          background: 'rgba(30, 41, 59, 0.8)',
        }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.min(volume * 300, 100)}%`,
            background: `linear-gradient(to right, var(--fuel-cold), ${fuelColor})`,
            transition: 'width 0.05s',
          }}
        />
      </div>

      {/* Hint */}
      <div className="absolute bottom-8 text-center bridge-body text-sm" style={{ color: 'var(--text-dim)' }}>
        Speak to power the ship!
      </div>
    </div>
  );
}
