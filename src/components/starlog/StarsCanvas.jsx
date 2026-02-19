import { useRef, useEffect, useMemo } from 'react';

/**
 * Lightweight Canvas2D star field — a zero-dependency port of the Three.js
 * Stars effect (rotating points in a sphere with perspective + size attenuation).
 */

// Generate N random points uniformly distributed inside a sphere of given radius.
// Equivalent to maath/random inSphere.
function randomInSphere(count, radius) {
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    // Rejection sampling for uniform distribution inside a sphere
    let x, y, z;
    do {
      x = Math.random() * 2 - 1;
      y = Math.random() * 2 - 1;
      z = Math.random() * 2 - 1;
    } while (x * x + y * y + z * z > 1);
    out[i * 3] = x * radius;
    out[i * 3 + 1] = y * radius;
    out[i * 3 + 2] = z * radius;
  }
  return out;
}

// Rotation matrix helpers (applied in XYZ order to match Three.js Euler default)
function rotatePoint(x, y, z, rx, ry, rz) {
  // Rotate Z
  let cosA = Math.cos(rz), sinA = Math.sin(rz);
  let x1 = x * cosA - y * sinA;
  let y1 = x * sinA + y * cosA;
  // Rotate Y
  let cosB = Math.cos(ry), sinB = Math.sin(ry);
  let x2 = x1 * cosB + z * sinB;
  let z1 = -x1 * sinB + z * cosB;
  // Rotate X
  let cosC = Math.cos(rx), sinC = Math.sin(rx);
  let y2 = y1 * cosC - z1 * sinC;
  let z2 = y1 * sinC + z1 * cosC;
  return [x2, y2, z2];
}

const STAR_COUNT = 5000;
const SPHERE_RADIUS = 1.2;
const CAMERA_Z = 1;           // matches camera={{ position: [0,0,1] }}
const BASE_SIZE = 1.4;        // base pixel radius at z=0
const COLOR = [242, 114, 200]; // #f272c8
const GROUP_RZ = Math.PI / 4; // initial group rotation on Z

export default function StarsCanvas() {
  const canvasRef = useRef(null);
  const rotRef = useRef({ x: 0, y: 0, z: 0 });
  const rafRef = useRef(null);
  const lastTimeRef = useRef(null);

  const points = useMemo(() => randomInSphere(STAR_COUNT, SPHERE_RADIUS), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Handle DPR for crisp rendering
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = (timestamp) => {
      rafRef.current = requestAnimationFrame(draw);

      if (lastTimeRef.current === null) {
        lastTimeRef.current = timestamp;
        return;
      }
      const delta = (timestamp - lastTimeRef.current) / 1000; // seconds
      lastTimeRef.current = timestamp;

      // Accumulate rotation at same rates as original
      const rot = rotRef.current;
      rot.x -= delta / 60;
      rot.y -= delta / 90;
      rot.z -= delta / 100;

      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      const cx = w / 2;
      const cy = h / 2;

      // Field of view scaling — maps clip-space [-1,1] to pixels.
      // Three.js default FOV is 75°; fov factor ≈ 1/tan(75/2) ≈ 1.3
      const fov = 1.3;
      const scale = Math.min(w, h) * fov;

      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < STAR_COUNT; i++) {
        const ox = points[i * 3];
        const oy = points[i * 3 + 1];
        const oz = points[i * 3 + 2];

        // Apply group rotation (static Z), then animated rotation
        const [gx, gy, gz] = rotatePoint(ox, oy, oz, 0, 0, GROUP_RZ);
        const [rx, ry, rz] = rotatePoint(gx, gy, gz, rot.x, rot.y, rot.z);

        // Perspective projection (camera at z = CAMERA_Z looking toward origin)
        const viewZ = CAMERA_Z - rz;
        if (viewZ <= 0.01) continue; // behind camera

        const px = cx + (rx / viewZ) * scale;
        const py = cy - (ry / viewZ) * scale; // flip Y

        // Cull off-screen
        if (px < -4 || px > w + 4 || py < -4 || py > h + 4) continue;

        // Size attenuation: closer = bigger
        const size = BASE_SIZE / viewZ;
        if (size < 0.15) continue; // too small to see

        // Depth-based alpha: closer = brighter, overall subdued
        const alpha = Math.min(0.55, 0.15 + 0.4 * (1 / (viewZ * 0.8)));

        ctx.globalAlpha = alpha;
        ctx.fillStyle = `rgb(${COLOR[0]},${COLOR[1]},${COLOR[2]})`;
        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [points]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ pointerEvents: 'none' }}
    />
  );
}
