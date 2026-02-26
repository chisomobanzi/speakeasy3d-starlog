import { useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useBridgeStore, SCREENS } from '../stores/bridgeStore';
import useMicrophone from '../hooks/useMicrophone';
import BridgeView from '../components/bridge/BridgeView';
import StarMap from '../components/bridge/StarMap';
import SceneView from '../components/bridge/SceneView';
import Encounter from '../components/bridge/Encounter';
import TransitionScreen from '../components/bridge/TransitionScreen';
import TeacherControls from '../components/bridge/TeacherControls';
import '../styles/bridge.css';

/**
 * BridgePage — the main entry point for Bridge Mode.
 * Manages screen state, keyboard shortcuts, and the mic → fuel loop.
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
  const fuelMuted = useBridgeStore((s) => s.fuelMuted);
  const setMicConnected = useBridgeStore((s) => s.setMicConnected);
  const encounterActive = useBridgeStore((s) => s.encounterActive);

  // Microphone
  const { volume, isSpeaking, isConnected } = useMicrophone({ enabled: true });
  const lastTickRef = useRef(Date.now());

  // Sync mic connection status
  useEffect(() => {
    setMicConnected(isConnected);
  }, [isConnected, setMicConnected]);

  // Fuel loop — mic drives fuel level
  useEffect(() => {
    if (encounterActive) return; // encounters handle their own fuel

    const loop = () => {
      const now = Date.now();
      const delta = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;

      const store = useBridgeStore.getState();

      if (store.fuelMuted) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      if (isSpeaking) {
        // Fill rate: roughly 0→100 in ~30s of continuous speech
        const fillRate = volume * 200 * delta;
        store.addFuel(fillRate);
        store.bankFuel();
      } else {
        // Decay rate: roughly 100→0 in ~60s of silence
        store.decayFuel(delta);
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    const rafRef = { current: null };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isSpeaking, volume, encounterActive]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e) => {
    // Ignore if typing in an input
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
      case ' ':
        e.preventDefault();
        if (currentScreen === SCREENS.SCENE) advanceBeat();
        break;
      case 'e':
      case 'E':
        // Trigger first available encounter (for quick demo)
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
        </motion.div>
      </AnimatePresence>

      {/* Transition overlays */}
      <TransitionScreen />

      {/* Teacher controls */}
      <TeacherControls />

      {/* Keyboard hint (bottom right, always visible, very subtle) */}
      <div
        className="fixed bottom-4 right-4 bridge-mono text-xs"
        style={{ color: 'rgba(100, 116, 139, 0.3)', zIndex: 50 }}
      >
        Press T for controls
      </div>
    </div>
  );
}
