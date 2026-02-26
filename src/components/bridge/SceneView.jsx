import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useBridgeStore } from '../../stores/bridgeStore';
import { destinations } from '../../data/demoCampaign';
import DialogueBox from './DialogueBox';
import FuelGauge from './FuelGauge';
import BridgeParticles from './BridgeParticles';

/**
 * Scene view — visual novel-style narrative at a destination.
 * Full-screen background with dialogue overlay and compact fuel gauge.
 */
export default function SceneView() {
  const destinationId = useBridgeStore((s) => s.currentDestinationId);
  const sceneIndex = useBridgeStore((s) => s.currentSceneIndex);
  const beatIndex = useBridgeStore((s) => s.currentBeatIndex);
  const advanceBeat = useBridgeStore((s) => s.advanceBeat);
  const boostFuel = useBridgeStore((s) => s.boostFuel);
  const setScreen = useBridgeStore((s) => s.setScreen);

  const destination = destinations[destinationId];
  const scene = destination?.scenes?.[sceneIndex];
  const beat = scene?.beats?.[beatIndex];
  const isLastBeat = scene && beatIndex >= scene.beats.length;

  // Scene-specific background gradient (since we don't have images yet)
  const bgGradient = useMemo(() => {
    switch (destinationId) {
      case 'dest-kova':
        return 'radial-gradient(ellipse at 50% 60%, #1a0a2e 0%, #0d1117 40%, #0A0E1A 100%)';
      case 'dest-recruitment':
        return 'radial-gradient(ellipse at 50% 40%, #141B2D 0%, #0d1117 50%, #0A0E1A 100%)';
      default:
        return 'radial-gradient(ellipse at center, #141B2D 0%, #0A0E1A 100%)';
    }
  }, [destinationId]);

  if (!destination) return null;

  return (
    <div className="absolute inset-0" style={{ background: bgGradient }}>
      {/* Background particles (subtle in scene mode) */}
      <BridgeParticles />

      {/* Scene title overlay on entry */}
      {beatIndex === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5 }}
          className="absolute top-[20%] left-1/2 -translate-x-1/2 text-center"
          style={{ zIndex: 10 }}
        >
          <div
            className="bridge-display text-5xl tracking-wider bridge-text-glow-amber"
            style={{ color: 'var(--amber)' }}
          >
            {destination.title}
          </div>
          <div
            className="bridge-body text-xl mt-4"
            style={{ color: 'var(--text-secondary)' }}
          >
            {destination.subtitle}
          </div>
        </motion.div>
      )}

      {/* Compact fuel gauge — top right */}
      <div className="absolute top-6 right-6" style={{ zIndex: 15 }}>
        <FuelGauge compact />
      </div>

      {/* Dialogue box */}
      {beat && !isLastBeat && (
        <DialogueBox
          beat={beat}
          onAdvance={() => advanceBeat()}
          onChoice={(option) => {
            if (option.fuelBonus) boostFuel(option.fuelBonus);
            advanceBeat();
          }}
        />
      )}

      {/* Scene complete — no more beats */}
      {isLastBeat && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center"
          style={{ zIndex: 20 }}
        >
          <div className="text-center">
            <div
              className="bridge-display text-3xl tracking-wider mb-6"
              style={{ color: 'var(--text-secondary)' }}
            >
              Scene Complete
            </div>
            <div className="bridge-mono text-sm" style={{ color: 'var(--text-dim)' }}>
              Use teacher controls to continue
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
