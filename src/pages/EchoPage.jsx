import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LANGUAGES, getWordQueue, matchesWord } from '../data/wordLists';
import { t } from '../data/i18n';
import '../styles/bridge.css';

// ─── LocalStorage helpers ───
const STORAGE_KEY = 'starlog_echo';

function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveSession(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

function clearSession() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

/**
 * EchoPage — Phone companion for Bridge Mode games.
 *
 * Flow: Enter code → Enter name → Pick language → Lobby → Game rounds
 *
 * Persists session info in localStorage so phones can reconnect after
 * sleeping or accidental page reloads.
 */
export default function EchoPage() {
  // ─── Connection state ───
  const [phase, setPhase] = useState('join'); // join | profile | lobby | playing | roundEnd
  const [sessionCode, setSessionCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [language, setLanguage] = useState(null);
  const [team, setTeam] = useState(null);
  const [teamInfo, setTeamInfo] = useState(null); // { name, color }
  const [wsConnected, setWsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [reconnecting, setReconnecting] = useState(false);

  // ─── Game state ───
  const [currentWord, setCurrentWord] = useState(null);
  const [wordIndex, setWordIndex] = useState(0);
  const [wordsCompleted, setWordsCompleted] = useState(0);
  const [personalScore, setPersonalScore] = useState(0);
  const [roundTimeLeft, setRoundTimeLeft] = useState(60);
  const [lastScored, setLastScored] = useState(null);
  const [useTapMode, setUseTapMode] = useState(false);
  const [roundNumber, setRoundNumber] = useState(0);
  const [roundWinner, setRoundWinner] = useState(null);

  // ─── Audio visualization ───
  const [micVolume, setMicVolume] = useState(0); // 0–1
  const [rewardFlash, setRewardFlash] = useState(false);
  const micStreamRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const micRafRef = useRef(null);

  // ─── Refs ───
  const wsRef = useRef(null);
  const deviceIdRef = useRef(null);
  const wordQueueRef = useRef([]);
  const currentWordRef = useRef(null);
  const phaseRef = useRef('join');
  const recognitionRef = useRef(null);
  const teamRef = useRef(null);
  const roundTimerRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const sessionCodeRef = useRef('');
  const playerNameRef = useRef('');
  const languageRef = useRef(null);
  const isJoinedRef = useRef(false);

  // Keep refs in sync
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { teamRef.current = team; }, [team]);
  useEffect(() => { sessionCodeRef.current = sessionCode; }, [sessionCode]);
  useEffect(() => { playerNameRef.current = playerName; }, [playerName]);
  useEffect(() => { languageRef.current = language; }, [language]);
  const handleMessageRef = useRef(null);
  const startRecognitionRef = useRef(null);

  // ─── Initialize deviceId (stable across sessions) ───
  useEffect(() => {
    const saved = loadSaved();
    if (saved?.deviceId) {
      deviceIdRef.current = saved.deviceId;
    } else {
      deviceIdRef.current = `echo-${Math.random().toString(36).slice(2, 8)}`;
    }

    // Auto-restore saved session
    if (saved?.sessionCode && saved?.playerName && saved?.language) {
      setSessionCode(saved.sessionCode);
      setPlayerName(saved.playerName);
      setLanguage(saved.language);
      if (saved.team) setTeam(saved.team);
      if (saved.teamInfo) setTeamInfo(saved.teamInfo);
      setReconnecting(true);
    }
  }, []);

  // ─── Auto-reconnect on restore ───
  useEffect(() => {
    if (!reconnecting) return;
    if (!sessionCode || !playerName || !language) return;
    const timer = setTimeout(() => {
      connectAndJoin();
      setReconnecting(false);
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reconnecting, sessionCode, playerName, language]);

  // ─── Connect WebSocket + send join ───
  const connectAndJoin = useCallback(() => {
    const code = sessionCodeRef.current.trim().toUpperCase();
    const name = playerNameRef.current.trim();
    const lang = languageRef.current;
    if (!code || code.length < 4) return;

    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (wsRef.current) {
      try { wsRef.current.close(); } catch {}
      wsRef.current = null;
    }

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/ws`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
        setError(null);
        if (name && lang) {
          ws.send(JSON.stringify({
            type: 'join',
            role: 'echo',
            code,
            deviceId: deviceIdRef.current,
            name,
            language: lang,
          }));
          isJoinedRef.current = true;
          if (phaseRef.current === 'join' || phaseRef.current === 'profile') {
            setPhase('lobby');
          }
        } else {
          setPhase('profile');
        }
      };

      ws.onmessage = (event) => {
        let msg;
        try { msg = JSON.parse(event.data); } catch { return; }
        if (handleMessageRef.current) handleMessageRef.current(msg);
      };

      ws.onclose = () => {
        setWsConnected(false);
        isJoinedRef.current = false;
        if (sessionCodeRef.current && playerNameRef.current && languageRef.current) {
          reconnectTimerRef.current = setTimeout(() => {
            connectAndJoin();
          }, 2000);
        }
      };

      ws.onerror = () => {
        setError(t.cannotConnect);
        setWsConnected(false);
      };
    } catch {
      setError(t.connectionFailed);
    }
  }, []);

  // ─── Initial join (from join screen) ───
  const joinSession = useCallback(() => {
    const code = sessionCode.trim().toUpperCase();
    if (code.length < 4) {
      setError(t.enterCode);
      return;
    }
    setError(null);

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/ws`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
        setPhase('profile');
      };

      ws.onmessage = (event) => {
        let msg;
        try { msg = JSON.parse(event.data); } catch { return; }
        if (handleMessageRef.current) handleMessageRef.current(msg);
      };

      ws.onclose = () => {
        setWsConnected(false);
        isJoinedRef.current = false;
        if (sessionCodeRef.current && playerNameRef.current && languageRef.current) {
          reconnectTimerRef.current = setTimeout(() => {
            connectAndJoin();
          }, 2000);
        }
      };

      ws.onerror = () => {
        setError(t.cannotConnect);
        setWsConnected(false);
      };
    } catch {
      setError(t.connectionFailed);
    }
  }, [sessionCode, connectAndJoin]);

  // ─── Handle messages from server ───
  const handleServerMessage = useCallback((msg) => {
    switch (msg.type) {
      case 'joined':
        break;

      case 'game:lobby': {
        const me = msg.players?.find((p) => p.id === deviceIdRef.current);
        if (me) {
          setTeam(me.team);
          const tm = msg.teams?.[me.team];
          if (tm) setTeamInfo({ name: tm.name, color: tm.color });
          saveSession({
            sessionCode: sessionCodeRef.current,
            playerName: playerNameRef.current,
            language: languageRef.current,
            deviceId: deviceIdRef.current,
            team: me.team,
            teamInfo: tm ? { name: tm.name, color: tm.color } : null,
          });
        }
        setPhase('lobby');
        break;
      }

      case 'game:players_update': {
        const me = msg.players?.find((p) => p.id === deviceIdRef.current);
        if (me) {
          setTeam(me.team);
          const tm = msg.teams?.[me.team];
          if (tm) setTeamInfo({ name: tm.name, color: tm.color });
          saveSession({
            sessionCode: sessionCodeRef.current,
            playerName: playerNameRef.current,
            language: languageRef.current,
            deviceId: deviceIdRef.current,
            team: me.team,
            teamInfo: tm ? { name: tm.name, color: tm.color } : null,
          });
        } else {
          clearSession();
          setPhase('join');
          setTeam(null);
          setTeamInfo(null);
        }
        break;
      }

      case 'game:countdown': {
        const me = msg.players?.find((p) => p.id === deviceIdRef.current);
        if (me) {
          setTeam(me.team);
          const tm = msg.teams?.[me.team];
          if (tm) setTeamInfo({ name: tm.name, color: tm.color });
        }
        setRoundNumber(msg.round || 1);
        setRoundTimeLeft(msg.duration || 60);
        setWordsCompleted(0);
        setPersonalScore(0);
        setLastScored(null);
        const lang = languageRef.current || 'en';
        const queue = getWordQueue(lang);
        wordQueueRef.current = queue;
        setWordIndex(0);
        setCurrentWord(queue[0] || null);
        currentWordRef.current = queue[0] || null;
        setPhase('countdown');

        setTimeout(() => {
          if (phaseRef.current === 'countdown') {
            setPhase('playing');
            navigator.vibrate?.([50, 30, 50]); // double pulse — GO!
          }
        }, 3500);
        break;
      }

      case 'game:play':
        if (phaseRef.current !== 'playing') {
          // Late join — missed countdown, so initialize word queue now
          if (!currentWordRef.current) {
            const me = msg.players?.find((p) => p.id === deviceIdRef.current);
            if (me) {
              setTeam(me.team);
              const tm = msg.teams?.[me.team];
              if (tm) setTeamInfo({ name: tm.name, color: tm.color });
            }
            setRoundTimeLeft(msg.duration || 60);
            setWordsCompleted(0);
            setPersonalScore(0);
            const lang = languageRef.current || 'en';
            const queue = getWordQueue(lang);
            wordQueueRef.current = queue;
            setWordIndex(0);
            setCurrentWord(queue[0] || null);
            currentWordRef.current = queue[0] || null;
          }
          setPhase('playing');
        }
        break;

      case 'game:round_end':
        setPhase('roundEnd');
        setRoundWinner(msg.winner);
        navigator.vibrate?.([100, 50, 100, 50, 200]); // round over pattern
        stopRecognition();
        if (roundTimerRef.current) {
          clearInterval(roundTimerRef.current);
          roundTimerRef.current = null;
        }
        break;

      case 'fuel_boost':
        break;
    }
  }, []);

  useEffect(() => { handleMessageRef.current = handleServerMessage; }, [handleServerMessage]);

  // ─── Register as player ───
  const registerPlayer = useCallback(() => {
    if (!playerName.trim() || !language) {
      setError(t.nameAndLang);
      return;
    }
    setError(null);

    const ws = wsRef.current;
    const code = sessionCode.trim().toUpperCase();
    if (ws?.readyState === 1) {
      ws.send(JSON.stringify({
        type: 'join',
        role: 'echo',
        code,
        deviceId: deviceIdRef.current,
        name: playerName.trim(),
        language,
      }));
      isJoinedRef.current = true;
    }

    saveSession({
      sessionCode: code,
      playerName: playerName.trim(),
      language,
      deviceId: deviceIdRef.current,
    });

    setPhase('lobby');
  }, [playerName, language, sessionCode]);

  // ─── Word scoring ───
  const advanceWord = useCallback(() => {
    const word = currentWordRef.current;
    if (!word) return;

    const points = word.points || 1;
    setWordsCompleted((w) => w + 1);
    setPersonalScore((s) => s + points);
    setLastScored({ word: word.word, points });
    setRewardFlash(true);
    setTimeout(() => setRewardFlash(false), 400);
    navigator.vibrate?.(40); // quick buzz on correct word

    const ws = wsRef.current;
    if (ws?.readyState === 1) {
      ws.send(JSON.stringify({
        type: 'player:word_scored',
        playerName: playerNameRef.current,
        word: word.word,
        points,
        team: teamRef.current,
      }));
    }

    const nextIdx = wordQueueRef.current.indexOf(word) + 1;
    if (nextIdx < wordQueueRef.current.length) {
      const next = wordQueueRef.current[nextIdx];
      setCurrentWord(next);
      currentWordRef.current = next;
      setWordIndex(nextIdx);
    } else {
      const queue = getWordQueue(languageRef.current || 'en');
      wordQueueRef.current = queue;
      setCurrentWord(queue[0]);
      currentWordRef.current = queue[0];
      setWordIndex(0);
    }

    setTimeout(() => setLastScored(null), 600);
  }, []);

  // ─── Skip word (no points) ───
  const skipWord = useCallback(() => {
    const word = currentWordRef.current;
    if (!word) return;

    const nextIdx = wordQueueRef.current.indexOf(word) + 1;
    if (nextIdx < wordQueueRef.current.length) {
      const next = wordQueueRef.current[nextIdx];
      setCurrentWord(next);
      currentWordRef.current = next;
      setWordIndex(nextIdx);
    } else {
      const queue = getWordQueue(languageRef.current || 'en');
      wordQueueRef.current = queue;
      setCurrentWord(queue[0]);
      currentWordRef.current = queue[0];
      setWordIndex(0);
    }
  }, []);

  // ─── Speech Recognition ───
  // Create a fresh SpeechRecognition instance. onend always respawns a new one.
  const startRecognition = useCallback(() => {
    // Clean up any existing instance
    if (recognitionRef.current) {
      recognitionRef.current.onresult = null;
      recognitionRef.current.onend = null;
      recognitionRef.current.onerror = null;
      try { recognitionRef.current.abort(); } catch {}
      recognitionRef.current = null;
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setUseTapMode(true); return; }

    try {
      const recognition = new SR();
      const langInfo = LANGUAGES[languageRef.current];
      recognition.lang = langInfo?.recognitionLang || 'en-US';
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 3;

      recognition.onresult = (event) => {
        const target = currentWordRef.current?.word;
        if (!target) return;
        for (let i = event.resultIndex; i < event.results.length; i++) {
          for (let j = 0; j < event.results[i].length; j++) {
            const transcript = event.results[i][j].transcript;
            if (matchesWord(transcript, target, languageRef.current)) {
              advanceWord();
              // Graceful stop — onend will create a fresh instance for next word
              try { recognition.stop(); } catch {}
              return;
            }
          }
        }
      };

      recognition.onerror = (e) => {
        if (e.error === 'not-allowed' || e.error === 'service-not-available') {
          setUseTapMode(true);
        }
        // onend fires after onerror — it handles restart
      };

      recognition.onend = () => {
        recognitionRef.current = null;
        // Respawn a fresh instance after a short delay
        if (phaseRef.current === 'playing') {
          setTimeout(() => {
            if (phaseRef.current === 'playing') {
              startRecognitionRef.current?.();
            }
          }, 150);
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch {
      setUseTapMode(true);
    }
  }, [advanceWord]);

  useEffect(() => { startRecognitionRef.current = startRecognition; }, [startRecognition]);

  const stopRecognition = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.onresult = null;
      recognitionRef.current.onend = null;
      recognitionRef.current.onerror = null;
      try { recognitionRef.current.abort(); } catch {}
      recognitionRef.current = null;
    }
  }, []);

  // Start recognition + timer + mic visualizer when playing phase begins
  useEffect(() => {
    if (phase !== 'playing') return;
    if (!useTapMode) startRecognition();

    roundTimerRef.current = setInterval(() => {
      setRoundTimeLeft((v) => Math.max(0, v - 1));
    }, 1000);

    // ─── Mic amplitude visualization ───
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        micStreamRef.current = stream;
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        audioCtxRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.7;
        source.connect(analyser);
        analyserRef.current = analyser;
        const data = new Uint8Array(analyser.frequencyBinCount);

        const tick = () => {
          if (cancelled) return;
          analyser.getByteFrequencyData(data);
          // Average of lower frequencies (voice range)
          let sum = 0;
          const bins = Math.min(64, data.length);
          for (let i = 0; i < bins; i++) sum += data[i];
          const avg = sum / bins / 255; // 0–1
          setMicVolume(avg);
          micRafRef.current = requestAnimationFrame(tick);
        };
        micRafRef.current = requestAnimationFrame(tick);
      } catch {
        // No mic access — visualization just stays dark
      }
    })();

    return () => {
      cancelled = true;
      stopRecognition();
      if (roundTimerRef.current) {
        clearInterval(roundTimerRef.current);
        roundTimerRef.current = null;
      }
      if (micRafRef.current) cancelAnimationFrame(micRafRef.current);
      if (audioCtxRef.current) { try { audioCtxRef.current.close(); } catch {} audioCtxRef.current = null; }
      if (micStreamRef.current) { micStreamRef.current.getTracks().forEach((t) => t.stop()); micStreamRef.current = null; }
      setMicVolume(0);
    };
  }, [phase, useTapMode, startRecognition, stopRecognition]);

  // ─── Keep screen awake ───
  useEffect(() => {
    let wakeLock = null;
    async function requestWakeLock() {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await navigator.wakeLock.request('screen');
        }
      } catch {}
    }
    requestWakeLock();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') requestWakeLock();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      if (wakeLock) { try { wakeLock.release(); } catch {} }
    };
  }, []);

  // ─── Cleanup ───
  useEffect(() => {
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      stopRecognition();
      if (roundTimerRef.current) clearInterval(roundTimerRef.current);
    };
  }, [stopRecognition]);

  // ─── Forget session (manual) ───
  const forgetSession = useCallback(() => {
    clearSession();
    if (wsRef.current) { try { wsRef.current.close(); } catch {} }
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    setPhase('join');
    setSessionCode('');
    setPlayerName('');
    setLanguage(null);
    setTeam(null);
    setTeamInfo(null);
    setWsConnected(false);
    isJoinedRef.current = false;
  }, []);

  // ─── Render ───
  const teamColor = teamInfo?.color || 'var(--cyan)';
  const teamName = teamInfo?.name || '';

  // ════════════════════════════════════════════
  //  JOIN SCREEN
  // ════════════════════════════════════════════
  if (phase === 'join') {
    return (
      <div className="bridge-mode fixed inset-0 flex flex-col items-center justify-center p-6"
        style={{ background: 'var(--bg-deep)' }}>
        <div className="text-center mb-10">
          <div className="bridge-display text-4xl tracking-wider bridge-text-glow-cyan"
            style={{ color: 'var(--cyan)' }}>
            {t.spellDuel}
          </div>
          <div className="bridge-body text-base mt-2" style={{ color: 'var(--text-secondary)' }}>
            {t.joinBattle}
          </div>
        </div>

        <div className="w-full max-w-xs">
          <label className="bridge-display text-xs tracking-[0.3em] block mb-3 text-center"
            style={{ color: 'var(--text-dim)' }}>
            {t.sessionCode}
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

        {error && (
          <div className="mt-4 text-sm" style={{ color: 'var(--alert)' }}>{error}</div>
        )}

        {reconnecting && (
          <div className="mt-4 text-sm" style={{ color: 'var(--cyan)' }}>{t.reconnecting}</div>
        )}

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={joinSession}
          className="mt-8 px-10 py-4 rounded-xl bridge-display text-xl tracking-wider"
          style={{ background: 'var(--cyan)', color: 'var(--bg-deep)' }}
        >
          {t.connect}
        </motion.button>
      </div>
    );
  }

  // ════════════════════════════════════════════
  //  PROFILE SCREEN
  // ════════════════════════════════════════════
  if (phase === 'profile') {
    return (
      <div className="bridge-mode fixed inset-0 flex flex-col items-center justify-center p-6"
        style={{ background: 'var(--bg-deep)' }}>
        <div className="text-center mb-8">
          <div className="bridge-display text-2xl tracking-wider" style={{ color: 'var(--text-primary)' }}>
            {t.whoAreYou}
          </div>
        </div>

        <div className="w-full max-w-xs mb-8">
          <label className="bridge-display text-xs tracking-[0.3em] block mb-2"
            style={{ color: 'var(--text-dim)' }}>
            {t.yourName}
          </label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value.slice(0, 20))}
            placeholder={t.enterName}
            autoFocus
            className="w-full text-center text-2xl py-3 px-4 rounded-xl border-2 outline-none bridge-body"
            style={{
              background: 'var(--bg-panel)',
              borderColor: 'rgba(148, 163, 184, 0.2)',
              color: 'var(--text-primary)',
              caretColor: 'var(--cyan)',
            }}
            onFocus={(e) => { e.target.style.borderColor = 'var(--cyan)'; }}
            onBlur={(e) => { e.target.style.borderColor = 'rgba(148, 163, 184, 0.2)'; }}
          />
        </div>

        <div className="w-full max-w-xs mb-8">
          <label className="bridge-display text-xs tracking-[0.3em] block mb-3 text-center"
            style={{ color: 'var(--text-dim)' }}>
            {t.imPracticing}
          </label>
          <div className="grid grid-cols-3 gap-3">
            {Object.entries(LANGUAGES).map(([code, lang]) => (
              <motion.button
                key={code}
                whileTap={{ scale: 0.95 }}
                onClick={() => setLanguage(code)}
                className="flex flex-col items-center gap-2 py-4 px-3 rounded-xl border-2 transition-colors"
                style={{
                  background: language === code ? 'rgba(6, 182, 212, 0.15)' : 'var(--bg-panel)',
                  borderColor: language === code ? 'var(--cyan)' : 'rgba(148, 163, 184, 0.1)',
                }}
              >
                <span className="text-3xl">{lang.flag}</span>
                <span
                  className="bridge-display text-xs tracking-wider"
                  style={{ color: language === code ? 'var(--cyan)' : 'var(--text-secondary)' }}
                >
                  {lang.name}
                </span>
              </motion.button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 text-sm" style={{ color: 'var(--alert)' }}>{error}</div>
        )}

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={registerPlayer}
          className="px-10 py-4 rounded-xl bridge-display text-xl tracking-wider"
          style={{
            background: playerName.trim() && language ? 'var(--amber)' : 'rgba(148, 163, 184, 0.2)',
            color: playerName.trim() && language ? 'var(--bg-deep)' : 'var(--text-dim)',
          }}
        >
          {t.joinGame}
        </motion.button>
      </div>
    );
  }

  // ════════════════════════════════════════════
  //  LOBBY
  // ════════════════════════════════════════════
  if (phase === 'lobby') {
    return (
      <div className="bridge-mode fixed inset-0 flex flex-col items-center justify-center p-6"
        style={{ background: 'var(--bg-deep)' }}>
        {team && (
          <div className="absolute top-0 left-0 right-0 h-2" style={{ background: teamColor }} />
        )}

        {/* Connection indicator */}
        <div className="absolute top-4 right-4">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{
              background: wsConnected ? '#22c55e' : '#ef4444',
              boxShadow: wsConnected ? '0 0 6px #22c55e' : '0 0 6px #ef4444',
            }}
          />
        </div>

        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-center"
        >
          <div className="bridge-display text-2xl tracking-wider mb-2"
            style={{ color: 'var(--text-primary)' }}>
            {t.ready}
          </div>
          {teamName && (
            <div className="bridge-display text-lg tracking-wider mb-4" style={{ color: teamColor }}>
              {teamName}
            </div>
          )}
          <div className="bridge-body text-base" style={{ color: 'var(--text-secondary)' }}>
            {t.waitingForGame}
          </div>
        </motion.div>

        <div className="absolute bottom-8 text-center">
          <div className="bridge-mono text-sm" style={{ color: 'var(--text-dim)' }}>
            {playerName}
          </div>
          <div className="bridge-mono text-xs mt-1" style={{ color: 'var(--text-dim)' }}>
            {LANGUAGES[language]?.flag} {LANGUAGES[language]?.name}
          </div>
          <button
            onClick={forgetSession}
            className="bridge-mono text-xs mt-3 px-3 py-1 rounded-lg"
            style={{ color: 'var(--text-dim)', background: 'rgba(148, 163, 184, 0.1)' }}
          >
            {t.changeSession}
          </button>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════
  //  COUNTDOWN
  // ════════════════════════════════════════════
  if (phase === 'countdown') {
    return (
      <div className="bridge-mode fixed inset-0 flex flex-col items-center justify-center p-6"
        style={{ background: 'var(--bg-deep)' }}>
        <div className="absolute top-0 left-0 right-0 h-2" style={{ background: teamColor }} />
        <PhoneCountdown />
        <div className="absolute bottom-8 bridge-display text-sm tracking-wider"
          style={{ color: teamColor }}>
          {teamName}
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════
  //  PLAYING
  // ════════════════════════════════════════════
  if (phase === 'playing') {
    const difficultyLabel = currentWord?.difficulty === 3 ? '★★★' : currentWord?.difficulty === 2 ? '★★' : '★';
    const difficultyColor = currentWord?.difficulty === 3 ? 'var(--amber)' : currentWord?.difficulty === 2 ? 'var(--cyan)' : 'var(--text-dim)';

    // Voice-reactive background intensity
    const glow = Math.min(micVolume * 2.5, 1); // amplify for visibility
    const flashBg = rewardFlash
      ? `rgba(34, 197, 94, ${0.15 + glow * 0.25})`   // green flash on correct
      : `rgba(6, 182, 212, ${0.03 + glow * 0.22})`;   // blue (fuel) pulse with voice

    return (
      <div className="bridge-mode fixed inset-0 flex flex-col p-4"
        style={{
          background: flashBg,
          transition: rewardFlash ? 'background 0.08s' : 'none',
        }}>
        {/* Team bar — pulses blue with voice, green on reward */}
        <div className="absolute top-0 left-0 right-0" style={{
          height: 6 + glow * 10,
          background: rewardFlash ? '#22c55e' : '#06B6D4',
          boxShadow: `0 0 ${glow * 30}px ${rewardFlash ? '#22c55e' : '#06B6D4'}`,
          transition: 'height 0.1s, box-shadow 0.1s, background 0.1s',
        }} />

        {/* Top: timer + score */}
        <div className="flex items-center justify-between pt-2 mb-4">
          <div className="bridge-mono text-lg tabular-nums" style={{
            color: roundTimeLeft <= 10 ? 'var(--alert)' : 'var(--text-secondary)',
          }}>
            0:{String(roundTimeLeft).padStart(2, '0')}
          </div>
          <div className="bridge-mono text-lg" style={{ color: 'var(--amber)' }}>
            {personalScore} pts 分
          </div>
        </div>

        {/* Word display */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <AnimatePresence>
            {lastScored && (
              <motion.div
                initial={{ opacity: 1, y: 0, scale: 1.5 }}
                animate={{ opacity: 0, y: -40 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute bridge-display text-3xl"
                style={{ color: '#22c55e', top: '30%' }}
              >
                +{lastScored.points}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="bridge-mono text-sm mb-2" style={{ color: difficultyColor }}>
            {difficultyLabel}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentWord?.word}
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -20 }}
              transition={{ duration: 0.2 }}
              className="text-center"
            >
              <div
                className="bridge-display tracking-wider mb-3"
                style={{
                  fontSize: (currentWord?.word?.length || 0) > 8 ? '2.5rem' : '3.5rem',
                  color: 'var(--text-primary)',
                  textShadow: '0 0 20px rgba(255,255,255,0.1)',
                }}
              >
                {currentWord?.word}
              </div>
              <div className="bridge-mono text-lg" style={{ color: 'var(--cyan)' }}>
                {currentWord?.hint}
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="mt-6 bridge-mono text-sm" style={{ color: 'var(--text-dim)' }}>
            {wordsCompleted} {t.spellsCast}
          </div>
        </div>

        {/* Cast button */}
        <div className="pb-4">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={useTapMode ? advanceWord : skipWord}
            className="w-full py-5 rounded-2xl bridge-display text-2xl tracking-wider"
            style={{
              background: useTapMode
                ? `linear-gradient(135deg, ${teamColor}, ${teamColor}CC)`
                : 'rgba(148, 163, 184, 0.1)',
              color: useTapMode ? 'var(--bg-deep)' : 'var(--text-secondary)',
              border: useTapMode ? 'none' : '1px solid rgba(148, 163, 184, 0.15)',
            }}
          >
            {useTapMode ? t.cast : t.skip}
          </motion.button>
          {!useTapMode && (
            <div className="text-center bridge-mono text-xs mt-2" style={{ color: 'var(--text-dim)' }}>
              {t.sayOrTap}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════
  //  ROUND END
  // ════════════════════════════════════════════
  if (phase === 'roundEnd') {
    return (
      <div className="bridge-mode fixed inset-0 flex flex-col items-center justify-center p-6"
        style={{ background: 'var(--bg-deep)' }}>
        <div className="absolute top-0 left-0 right-0 h-2" style={{ background: teamColor }} />

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring' }}
          className="text-center mb-6"
        >
          <div className="bridge-display text-4xl tracking-wider mb-2" style={{
            color: roundWinner === team ? 'var(--amber)' : roundWinner === 'tie' ? 'var(--cyan)' : 'var(--text-secondary)',
          }}>
            {roundWinner === team ? t.victory : roundWinner === 'tie' ? t.tie : t.defeated}
          </div>
          <div className="bridge-mono text-sm" style={{ color: 'var(--text-dim)' }}>
            {t.round} {roundNumber} {t.complete}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <div className="bridge-display text-6xl mb-2" style={{ color: 'var(--amber)' }}>
            {personalScore}
          </div>
          <div className="bridge-mono text-sm" style={{ color: 'var(--text-dim)' }}>
            pts 分 · {wordsCompleted} {t.spellsCast}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="absolute bottom-8 bridge-body text-sm"
          style={{ color: 'var(--text-dim)' }}
        >
          {t.waitingNextRound}
        </motion.div>
      </div>
    );
  }

  return null;
}

/**
 * Simple phone-side countdown display
 */
function PhoneCountdown() {
  const [count, setCount] = useState(3);

  useEffect(() => {
    if (count <= 0) return;
    const timer = setTimeout(() => setCount(count - 1), 1000);
    return () => clearTimeout(timer);
  }, [count]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={count}
        initial={{ scale: 2.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.3, opacity: 0 }}
        transition={{ duration: 0.3, type: 'spring' }}
        className="bridge-display"
        style={{
          fontSize: count === 0 ? '5rem' : '8rem',
          color: count === 0 ? 'var(--amber)' : 'var(--text-primary)',
          textShadow: `0 0 40px ${count === 0 ? 'var(--amber)' : 'rgba(255,255,255,0.3)'}`,
        }}
      >
        {count === 0 ? t.go : count}
      </motion.div>
    </AnimatePresence>
  );
}
