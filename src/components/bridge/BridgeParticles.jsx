import { useRef, useEffect } from 'react';
import { useBridgeStore } from '../../stores/bridgeStore';

/**
 * Full-screen Canvas2D ambient particles — stars and space dust.
 * Speed and density respond to fuel level.
 */
export default function BridgeParticles() {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const fuelRef = useRef(0);

  // Subscribe to fuel without re-rendering
  useEffect(() => {
    return useBridgeStore.subscribe(
      (state) => { fuelRef.current = state.fuelLevel; }
    );
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Initialize particles
    const count = 120;
    particlesRef.current = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      z: Math.random(), // depth 0-1 (0 = far, 1 = near)
      baseSpeed: Math.random() * 0.3 + 0.05,
    }));

    const ctx = canvas.getContext('2d');
    let raf;

    const tick = () => {
      const w = canvas.width;
      const h = canvas.height;
      const fuel = fuelRef.current;
      const speedMult = 1 + (fuel / 100) * 4; // 1x at 0 fuel, 5x at 100
      const streakMult = fuel / 100; // 0 at 0 fuel, 1 at 100

      ctx.clearRect(0, 0, w, h);

      particlesRef.current.forEach((p) => {
        // Move toward camera (right to left creates forward motion feel)
        const speed = p.baseSpeed * speedMult * (0.5 + p.z * 0.5);
        p.x -= speed;

        // Wrap
        if (p.x < -10) {
          p.x = w + 10;
          p.y = Math.random() * h;
          p.z = Math.random();
        }

        // Size based on depth
        const size = 0.5 + p.z * 2;
        const alpha = 0.15 + p.z * 0.5;

        // Color: far stars are blue-white, near stars pick up fuel color
        const warmth = fuel / 100;
        const r = Math.round(180 + warmth * 75);
        const g = Math.round(200 + warmth * 30 - p.z * warmth * 60);
        const b = Math.round(255 - warmth * 80);

        // Draw star
        ctx.beginPath();
        if (streakMult > 0.3 && p.z > 0.3) {
          // Streak effect at high fuel
          const streakLen = speed * streakMult * 8;
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + streakLen, p.y);
          ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.6})`;
          ctx.lineWidth = size * 0.6;
          ctx.stroke();
        }
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        ctx.fill();
      });

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 1 }}
    />
  );
}
