import { useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useBridgeStore, SCREENS, GAME_PHASES } from '../stores/bridgeStore';
import useMicrophone from '../hooks/useMicrophone';
import useBridgeSocket from '../hooks/useBridgeSocket';
import BridgeView from '../components/bridge/BridgeView';
import StarMap from '../components/bridge/StarMap';
import SceneView from '../components/bridge/SceneView';
import Encounter from '../components/bridge/Encounter';
import GameView from '../components/bridge/GameView';
import TransitionScreen from '../components/bridge/TransitionScreen';
import TeacherControls from '../components/bridge/TeacherControls';
import '../styles/bridge.css';

/**
 * BridgePage — the main entry point for Bridge Mode.
 * Manages screen state, keyboard shortcuts, mic → fuel loop,
 * and broadcasts game events to Echo devices via WebSocket.
 */
export default function BridgePage() {
  const currentScreen = useBridgeStore((s) => s.currentScreen);
  const setScreen = useBridgeStore((s) => s.setScreen);
  const toggleTeacherPanel = useBridgeStore((s) => s.toggleTeacherPanel);
  const startSession = useBridgeStore((s) => s.startSession);
  const endSession = useBridgeStore((s) => s.endSession);
  const sessionActive = useBridgeStore((s) => s.sessionActive);
  const advanceBeat = useBridgeStore((s) => s.advanceBeat);
  const boostFuel = useBridgeStore((s) => s.boostFuel);
  const toggleFuelMute = useBridgeStore((s) => s.toggleFuelMute);
  const setMicConnected = useBridgeStore((s) => s.setMicConnected);
  const encounterActive = useBridgeStore((s) => s.encounterActive);
  const sessionCode = useBridgeStore((s) => s.sessionCode);
  const gamePhase = useBridgeStore((s) => s.gamePhase);
  const teamVersion = useBridgeStore((s) => s.teamVersion);

  // Local microphone (off by default — use Echo devices instead)
  const localMicEnabled = useBridgeStore((s) => s.localMicEnabled);
  const { volume: localVolume, isSpeaking: localSpeaking, isConnected } = useMicrophone({ enabled: localMicEnabled });
  const lastTickRef = useRef(Date.now());

  // WebSocket connection to relay server
  const { connected: wsConnected, send: wsSend } = useBridgeSocket(sessionCode);

  // Sync mic connection status
  useEffect(() => {
    setMicConnected(isConnected);
  }, [isConnected, setMicConnected]);

  // ─── Broadcast game phase changes to Echo devices ───
  useEffect(() => {
    if (!wsSend) return;

    const store = useBridgeStore.getState();

    if (gamePhase === GAME_PHASES.LOBBY) {
      wsSend({
        type: 'game:lobby',
        mode: store.currentGameMode,
        players: store.players,
        teams: store.teams,
      });
    }

    if (gamePhase === GAME_PHASES.COUNTDOWN) {
      wsSend({
        type: 'game:countdown',
        round: store.currentRound,
        duration: store.roundDuration,
        players: store.players,
        teams: store.teams,
      });
    }

    if (gamePhase === GAME_PHASES.PLAYING) {
      wsSend({
        type: 'game:play',
        round: store.currentRound,
        duration: store.roundDuration,
      });
    }

    if (gamePhase === GAME_PHASES.ROUND_END) {
      wsSend({
        type: 'game:round_end',
        winner: store.roundWinner,
        teams: store.teams,
        players: store.players,
        round: store.currentRound,
      });
    }
  }, [gamePhase, wsSend]);

  // ─── Broadcast team/player changes to Echo devices ───
  useEffect(() => {
    if (!wsSend || teamVersion === 0) return;
    const store = useBridgeStore.getState();
    wsSend({
      type: 'game:players_update',
      players: store.players,
      teams: store.teams,
    });
  }, [teamVersion, wsSend]);

  // ─── Fuel loop — combines local mic + remote echo volume ───
  useEffect(() => {
    if (encounterActive) return;
    // Don't run fuel loop during game phases
    if (gamePhase !== GAME_PHASES.IDLE) return;

    const loop = () => {
      const now = Date.now();
      const delta = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;

      const store = useBridgeStore.getState();

      if (store.fuelMuted) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      const hasEcho = store.connectedDevices.length > 0;
      const useLocal = store.localMicEnabled;
      const activeVolume = hasEcho ? store.remoteVolume : useLocal ? localVolume : 0;
      const activeSpeaking = hasEcho ? store.remoteSpeaking : useLocal ? localSpeaking : false;

      if (activeSpeaking) {
        const fillRate = activeVolume * 200 * delta;
        store.addFuel(fillRate);
        store.bankFuel();
      } else {
        store.decayFuel(delta);
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    const rafRef = { current: null };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [localSpeaking, localVolume, encounterActive, gamePhase]);

  // ─── Keyboard shortcuts ───
  const handleKeyDown = useCallback((e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    switch (e.key) {
      case '1':
        setScreen(SCREENS.BRIDGE);
        break;
      case '2':
        setScreen(SCREENS.STAR_MAP, 'warp');
        break;
      case '3':
        setScreen(SCREENS.SCENE);
        break;
      case '4':
        // Quick start game
        useBridgeStore.getState().startGame('spellDuel');
        break;
      case ' ':
        e.preventDefault();
        if (currentScreen === SCREENS.SCENE) advanceBeat();
        break;
      case 'b':
      case 'B':
        boostFuel(10);
        break;
      case 'm':
      case 'M':
        toggleFuelMute();
        break;
      case 's':
      case 'S':
        if (sessionActive) endSession();
        else startSession();
        break;
      case 't':
      case 'T':
        toggleTeacherPanel();
        break;
      case 'f':
      case 'F':
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          document.documentElement.requestFullscreen();
        }
        break;
      case 'Escape':
        setScreen(SCREENS.BRIDGE);
        break;
      default:
        break;
    }
  }, [currentScreen, sessionActive, setScreen, toggleTeacherPanel, startSession, endSession, advanceBeat, boostFuel, toggleFuelMute]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="bridge-mode fixed inset-0">
      {/* Screen content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentScreen}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0"
        >
          {currentScreen === SCREENS.BRIDGE && <BridgeView />}
          {currentScreen === SCREENS.STAR_MAP && <StarMap />}
          {currentScreen === SCREENS.SCENE && <SceneView />}
          {currentScreen === SCREENS.ENCOUNTER && <Encounter />}
          {currentScreen === SCREENS.GAME && <GameView />}
        </motion.div>
      </AnimatePresence>

      {/* Transition overlays */}
      <TransitionScreen />

      {/* Teacher controls */}
      <TeacherControls />

      {/* Keyboard hint */}
      <div
        className="fixed bottom-4 right-4 bridge-mono text-xs"
        style={{ color: 'rgba(100, 116, 139, 0.3)', zIndex: 50 }}
      >
        Press T for controls
      </div>
    </div>
  );
}
