import { useMemo } from 'react';
import { useBridgeStore } from '../../stores/bridgeStore';
import FuelGauge from './FuelGauge';
import BridgeParticles from './BridgeParticles';
import ShipStatus from './ShipStatus';

/**
 * The ambient bridge view — the "home" state.
 * Shows the ship bridge interior with fuel gauge, particles, and status.
 * The entire scene responds to fuel level — dim when low, alive when high.
 */
export default function BridgeView() {
  const fuelLevel = useBridgeStore((s) => s.fuelLevel);

  // Ambient brightness responds to fuel
  const ambientOpacity = useMemo(() => 0.15 + (fuelLevel / 100) * 0.6, [fuelLevel]);
  const viewportGlow = useMemo(() => Math.min(fuelLevel / 100, 1), [fuelLevel]);

  return (
    <div className="absolute inset-0 bridge-scanlines" style={{ background: 'var(--bg-deep)' }}>
      {/* Background — bridge interior gradient */}
      <div
        className="absolute inset-0 transition-opacity duration-1000"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 50% 30%, rgba(20, 27, 45, ${ambientOpacity}) 0%, transparent 70%),
            radial-gradient(ellipse 120% 80% at 50% 50%, rgba(6, 182, 212, ${viewportGlow * 0.05}) 0%, transparent 60%),
            radial-gradient(ellipse 60% 40% at 50% 20%, rgba(245, 158, 11, ${viewportGlow * 0.08}) 0%, transparent 50%),
            var(--bg-deep)
          `,
        }}
      />

      {/* Viewport window — the large "window" showing space */}
      <div
        className="absolute rounded-3xl overflow-hidden"
        style={{
          top: '8%',
          left: '15%',
          right: '15%',
          bottom: '35%',
          background: `radial-gradient(ellipse at center,
            rgba(10, 14, 26, 0.6) 0%,
            rgba(10, 14, 26, 0.95) 100%
          )`,
          border: `1px solid rgba(148, 163, 184, ${0.08 + viewportGlow * 0.12})`,
          boxShadow: `
            inset 0 0 ${30 + viewportGlow * 60}px rgba(6, 182, 212, ${viewportGlow * 0.08}),
            0 0 ${20 + viewportGlow * 40}px rgba(6, 182, 212, ${viewportGlow * 0.05})
          `,
          transition: 'box-shadow 1s, border-color 1s',
        }}
      />

      {/* Particles (inside viewport conceptually, but full-screen canvas) */}
      <BridgeParticles />

      {/* Instrument panel bottom bar */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{
          height: '30%',
          background: `linear-gradient(to top,
            rgba(20, 27, 45, 0.98) 0%,
            rgba(20, 27, 45, 0.7) 60%,
            transparent 100%
          )`,
          zIndex: 2,
        }}
      />

      {/* Instrument panel decorative line */}
      <div
        className="absolute left-0 right-0"
        style={{
          bottom: '30%',
          height: 2,
          background: `linear-gradient(to right,
            transparent 5%,
            rgba(245, 158, 11, ${0.15 + viewportGlow * 0.35}) 20%,
            rgba(245, 158, 11, ${0.15 + viewportGlow * 0.35}) 80%,
            transparent 95%
          )`,
          zIndex: 3,
          boxShadow: `0 0 ${8 + viewportGlow * 15}px rgba(245, 158, 11, ${viewportGlow * 0.3})`,
          transition: 'box-shadow 1s',
        }}
      />

      {/* Side instrument panels */}
      {['left', 'right'].map((side) => (
        <div
          key={side}
          className="absolute top-0 bottom-0"
          style={{
            [side]: 0,
            width: '12%',
            background: `linear-gradient(to ${side === 'left' ? 'right' : 'left'},
              rgba(20, 27, 45, 0.95) 0%,
              transparent 100%
            )`,
            zIndex: 2,
          }}
        >
          {/* Decorative indicator lights */}
          <div className="absolute flex flex-col gap-4" style={{ top: '40%', [side]: '30%' }}>
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-full"
                style={{
                  width: 6,
                  height: 6,
                  backgroundColor:
                    fuelLevel > i * 25
                      ? `rgba(245, 158, 11, ${0.4 + viewportGlow * 0.6})`
                      : 'rgba(100, 116, 139, 0.2)',
                  boxShadow:
                    fuelLevel > i * 25
                      ? `0 0 8px rgba(245, 158, 11, ${viewportGlow * 0.5})`
                      : 'none',
                  transition: 'all 0.5s',
                }}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Ship status — top left */}
      <div className="absolute top-6 left-6" style={{ zIndex: 5 }}>
        <ShipStatus />
      </div>

      {/* Fuel gauge — right side */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2" style={{ zIndex: 5 }}>
        <FuelGauge />
      </div>

      {/* Center label — campaign title */}
      <div
        className="absolute bottom-[12%] left-1/2 -translate-x-1/2 text-center"
        style={{ zIndex: 5 }}
      >
        <div
          className="bridge-display text-3xl tracking-wider bridge-text-glow-amber"
          style={{
            color: `rgba(245, 158, 11, ${0.4 + viewportGlow * 0.6})`,
            transition: 'color 1s',
          }}
        >
          {useBridgeStore.getState().sessionActive ? 'Engines Online' : 'Awaiting Crew'}
        </div>
        <div
          className="bridge-mono text-sm mt-2"
          style={{ color: 'var(--text-dim)' }}
        >
          Speak to power the ship
        </div>
      </div>
    </div>
  );
}
