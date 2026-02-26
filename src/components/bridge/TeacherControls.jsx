import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass, Map, MessageSquare, Swords,
  Plus, Minus, VolumeX, Volume2, Play, Square,
  Maximize, ChevronRight, X, Mic, MicOff,
} from 'lucide-react';
import { useBridgeStore, SCREENS } from '../../stores/bridgeStore';
import { destinations, encounters } from '../../data/demoCampaign';

/**
 * Floating teacher control panel.
 * Toggle with 'T' key. Provides navigation, fuel controls, and encounter triggers.
 */
export default function TeacherControls() {
  const isOpen = useBridgeStore((s) => s.teacherPanelOpen);
  const togglePanel = useBridgeStore((s) => s.toggleTeacherPanel);
  const currentScreen = useBridgeStore((s) => s.currentScreen);
  const setScreen = useBridgeStore((s) => s.setScreen);
  const sessionActive = useBridgeStore((s) => s.sessionActive);
  const startSession = useBridgeStore((s) => s.startSession);
  const endSession = useBridgeStore((s) => s.endSession);
  const fuelMuted = useBridgeStore((s) => s.fuelMuted);
  const toggleFuelMute = useBridgeStore((s) => s.toggleFuelMute);
  const localMicEnabled = useBridgeStore((s) => s.localMicEnabled);
  const toggleLocalMic = useBridgeStore((s) => s.toggleLocalMic);
  const boostFuel = useBridgeStore((s) => s.boostFuel);
  const fuelLevel = useBridgeStore((s) => s.fuelLevel);
  const advanceBeat = useBridgeStore((s) => s.advanceBeat);
  const startEncounter = useBridgeStore((s) => s.startEncounter);
  const currentDestinationId = useBridgeStore((s) => s.currentDestinationId);

  const destination = destinations[currentDestinationId];
  const availableEncounters = destination?.encounters?.map((id) => encounters[id]).filter(Boolean) || [];

  const navButtons = [
    { key: SCREENS.BRIDGE, icon: Compass, label: 'Bridge', shortcut: '1' },
    { key: SCREENS.STAR_MAP, icon: Map, label: 'Star Map', shortcut: '2' },
    { key: SCREENS.SCENE, icon: MessageSquare, label: 'Scene', shortcut: '3' },
  ];

  const handleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 teacher-panel rounded-2xl p-4"
          style={{ zIndex: 200, minWidth: 500, maxWidth: '90vw' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <span
              className="bridge-display text-sm tracking-wider"
              style={{ color: 'var(--amber)' }}
            >
              Teacher Controls
            </span>
            <button onClick={togglePanel} className="p-1 rounded" style={{ color: 'var(--text-dim)' }}>
              <X size={16} />
            </button>
          </div>

          {/* Navigation row */}
          <div className="flex gap-2 mb-4">
            {navButtons.map((btn) => {
              const Icon = btn.icon;
              const active = currentScreen === btn.key;
              return (
                <button
                  key={btn.key}
                  onClick={() => setScreen(btn.key, btn.key === SCREENS.STAR_MAP ? 'warp' : null)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors"
                  style={{
                    background: active ? 'rgba(245, 158, 11, 0.15)' : 'rgba(30, 41, 59, 0.5)',
                    border: `1px solid ${active ? 'var(--amber)' : 'rgba(148, 163, 184, 0.1)'}`,
                    color: active ? 'var(--amber)' : 'var(--text-secondary)',
                    fontFamily: 'var(--font-display)',
                  }}
                >
                  <Icon size={16} />
                  {btn.label}
                  <span className="bridge-mono text-xs" style={{ color: 'var(--text-dim)' }}>
                    {btn.shortcut}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Actions row */}
          <div className="flex gap-2 flex-wrap">
            {/* Session toggle */}
            <button
              onClick={sessionActive ? endSession : startSession}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm"
              style={{
                background: sessionActive ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                border: `1px solid ${sessionActive ? 'var(--alert)' : 'var(--success)'}`,
                color: sessionActive ? 'var(--alert)' : 'var(--success)',
                fontFamily: 'var(--font-display)',
              }}
            >
              {sessionActive ? <Square size={14} /> : <Play size={14} />}
              {sessionActive ? 'End Session' : 'Start Session'}
              <span className="bridge-mono text-xs" style={{ color: 'var(--text-dim)' }}>S</span>
            </button>

            {/* Advance dialogue */}
            {currentScreen === SCREENS.SCENE && (
              <button
                onClick={advanceBeat}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm"
                style={{
                  background: 'rgba(30, 41, 59, 0.5)',
                  border: '1px solid rgba(148, 163, 184, 0.1)',
                  color: 'var(--text-secondary)',
                  fontFamily: 'var(--font-display)',
                }}
              >
                <ChevronRight size={14} />
                Next
                <span className="bridge-mono text-xs" style={{ color: 'var(--text-dim)' }}>Space</span>
              </button>
            )}

            {/* Fuel boost */}
            <button
              onClick={() => boostFuel(10)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
              style={{
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.2)',
                color: 'var(--amber)',
                fontFamily: 'var(--font-display)',
              }}
            >
              <Plus size={14} />
              Boost
              <span className="bridge-mono text-xs" style={{ color: 'var(--text-dim)' }}>B</span>
            </button>

            {/* Fuel mute */}
            <button
              onClick={toggleFuelMute}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
              style={{
                background: fuelMuted ? 'rgba(239, 68, 68, 0.15)' : 'rgba(30, 41, 59, 0.5)',
                border: `1px solid ${fuelMuted ? 'var(--alert)' : 'rgba(148, 163, 184, 0.1)'}`,
                color: fuelMuted ? 'var(--alert)' : 'var(--text-secondary)',
                fontFamily: 'var(--font-display)',
              }}
            >
              {fuelMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              {fuelMuted ? 'Unmute' : 'Mute'}
              <span className="bridge-mono text-xs" style={{ color: 'var(--text-dim)' }}>M</span>
            </button>

            {/* Local mic toggle */}
            <button
              onClick={toggleLocalMic}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
              style={{
                background: localMicEnabled ? 'rgba(6, 182, 212, 0.15)' : 'rgba(30, 41, 59, 0.5)',
                border: `1px solid ${localMicEnabled ? 'var(--cyan)' : 'rgba(148, 163, 184, 0.1)'}`,
                color: localMicEnabled ? 'var(--cyan)' : 'var(--text-secondary)',
                fontFamily: 'var(--font-display)',
              }}
            >
              {localMicEnabled ? <Mic size={14} /> : <MicOff size={14} />}
              Local Mic
            </button>

            {/* Fullscreen */}
            <button
              onClick={handleFullscreen}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
              style={{
                background: 'rgba(30, 41, 59, 0.5)',
                border: '1px solid rgba(148, 163, 184, 0.1)',
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-display)',
              }}
            >
              <Maximize size={14} />
              <span className="bridge-mono text-xs" style={{ color: 'var(--text-dim)' }}>F</span>
            </button>

            {/* Encounters */}
            {availableEncounters.map((enc) => (
              <button
                key={enc.id}
                onClick={() => startEncounter(enc.id)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm"
                style={{
                  background: 'rgba(249, 115, 22, 0.1)',
                  border: '1px solid rgba(249, 115, 22, 0.2)',
                  color: 'var(--encounter)',
                  fontFamily: 'var(--font-display)',
                }}
              >
                <Swords size={14} />
                {enc.title}
                <span className="bridge-mono text-xs" style={{ color: 'var(--text-dim)' }}>E</span>
              </button>
            ))}
          </div>

          {/* Fuel indicator */}
          <div className="mt-3 flex items-center gap-3">
            <div className="bridge-mono text-xs" style={{ color: 'var(--text-dim)' }}>
              Fuel: {Math.round(fuelLevel)}%
            </div>
            <div
              className="flex-1 h-1.5 rounded-full overflow-hidden"
              style={{ background: 'rgba(30, 41, 59, 0.8)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${fuelLevel}%`,
                  background: `linear-gradient(to right, var(--fuel-cold), var(--fuel-warm))`,
                }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
