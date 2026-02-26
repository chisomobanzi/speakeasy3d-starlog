import { useRef, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useBridgeStore } from '../../stores/bridgeStore';

/**
 * The hero component — a vertical fuel gauge with glow, particles, and color shift.
 * Responds to real-time fuel level from the bridge store.
 */
export default function FuelGauge({ compact = false }) {
  const fuelLevel = useBridgeStore((s) => s.fuelLevel);
  const fuelMuted = useBridgeStore((s) => s.fuelMuted);
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);

  // Interpolate gauge color based on fuel level
  const gaugeColor = useMemo(() => {
    if (fuelLevel < 25) return { r: 59, g: 130, b: 246 };   // blue
    if (fuelLevel < 50) return { r: 245, g: 158, b: 11 };    // amber
    if (fuelLevel < 75) return { r: 251, g: 191, b: 36 };    // gold
    return { r: 254, g: 243, b: 199 };                        // white-gold
  }, [fuelLevel]);

  const colorStr = `rgb(${gaugeColor.r}, ${gaugeColor.g}, ${gaugeColor.b})`;
  const glowStr = `rgba(${gaugeColor.r}, ${gaugeColor.g}, ${gaugeColor.b}, 0.4)`;
  const glowStrBright = `rgba(${gaugeColor.r}, ${gaugeColor.g}, ${gaugeColor.b}, 0.8)`;

  // Particle animation on the gauge
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    let raf;

    const tick = () => {
      ctx.clearRect(0, 0, w, h);

      // Spawn particles when fuel is actively rising
      if (fuelLevel > 5 && Math.random() < fuelLevel / 80) {
        const fillY = h * (1 - fuelLevel / 100);
        particlesRef.current.push({
          x: Math.random() * w,
          y: fillY + Math.random() * 10,
          vx: (Math.random() - 0.5) * 0.5,
          vy: -Math.random() * 1.5 - 0.5,
          life: 1,
          size: Math.random() * 3 + 1,
        });
      }

      // Update & draw particles
      particlesRef.current = particlesRef.current.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;
        if (p.life <= 0) return false;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${gaugeColor.r}, ${gaugeColor.g}, ${gaugeColor.b}, ${p.life * 0.8})`;
        ctx.fill();
        return true;
      });

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [fuelLevel, gaugeColor]);

  const height = compact ? 120 : 280;
  const width = compact ? 32 : 48;

  return (
    <div className="flex flex-col items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
      {/* Gauge container */}
      <div
        className="relative rounded-full overflow-hidden"
        style={{
          width,
          height,
          background: 'rgba(20, 27, 45, 0.8)',
          border: `2px solid rgba(${gaugeColor.r}, ${gaugeColor.g}, ${gaugeColor.b}, 0.3)`,
          boxShadow: `0 0 ${10 + fuelLevel * 0.4}px ${glowStr}, inset 0 0 ${5 + fuelLevel * 0.2}px rgba(0,0,0,0.5)`,
          transition: 'box-shadow 0.3s, border-color 0.3s',
        }}
      >
        {/* Fill */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 rounded-full"
          animate={{ height: `${fuelLevel}%` }}
          transition={{ type: 'spring', stiffness: 60, damping: 15 }}
          style={{
            background: `linear-gradient(to top, ${colorStr}, ${glowStrBright})`,
            boxShadow: `0 -4px ${15 + fuelLevel * 0.3}px ${glowStr}`,
          }}
        />

        {/* Inner highlight */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%)',
            pointerEvents: 'none',
          }}
        />

        {/* Particle canvas */}
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="absolute inset-0"
          style={{ pointerEvents: 'none' }}
        />

        {/* Segment marks */}
        {[25, 50, 75].map((mark) => (
          <div
            key={mark}
            className="absolute left-0 right-0"
            style={{
              bottom: `${mark}%`,
              height: 1,
              background: `rgba(255, 255, 255, ${fuelLevel > mark ? 0.3 : 0.08})`,
            }}
          />
        ))}
      </div>

      {/* Label */}
      <div className="text-center">
        <div
          className="bridge-display text-sm tracking-wider"
          style={{ color: colorStr, textShadow: `0 0 8px ${glowStr}` }}
        >
          {Math.round(fuelLevel)}
        </div>
        {!compact && (
          <div className="text-[10px] tracking-widest uppercase" style={{ color: 'var(--text-dim)' }}>
            {fuelMuted ? 'Muted' : 'Fuel'}
          </div>
        )}
      </div>
    </div>
  );
}
