import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

/**
 * QR code overlay for sharing the constellation page.
 * Uses the lightweight qrcode npm package to render to canvas.
 */
export default function ConstellationQR({ url, isOpen, onClose }) {
  const canvasRef = useRef(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;

    let cancelled = false;

    // Dynamic import so the QR library is only loaded when needed
    import('qrcode').then((QRCode) => {
      if (cancelled) return;
      QRCode.toCanvas(canvasRef.current, url || window.location.href, {
        width: 256,
        margin: 2,
        color: {
          dark: '#ffffff',
          light: '#0f172a',
        },
      }).catch(() => setError(true));
    }).catch(() => setError(true));

    return () => { cancelled = true; };
  }, [isOpen, url]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-white font-semibold text-center mb-4">
          Scan to explore
        </h3>

        {error ? (
          <div className="w-64 h-64 flex items-center justify-center text-slate-500 text-sm">
            QR generation failed. Share the URL directly.
          </div>
        ) : (
          <canvas ref={canvasRef} className="mx-auto rounded-lg" />
        )}

        <p className="text-center text-slate-500 text-xs mt-3 max-w-[256px] break-all">
          {url || window.location.href}
        </p>
      </div>
    </div>
  );
}
