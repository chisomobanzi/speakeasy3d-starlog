import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { useBridgeStore } from '../../stores/bridgeStore';
import { demoCampaign, starMapNodes } from '../../data/demoCampaign';
import { t, echosConnected } from '../../data/i18n';

/**
 * Ship status display — ship name, destination, session code, connected devices.
 * Positioned in the top-left corner of the bridge.
 */
export default function ShipStatus() {
  const currentNodeId = useBridgeStore((s) => s.currentNodeId);
  const micConnected = useBridgeStore((s) => s.micConnected);
  const sessionActive = useBridgeStore((s) => s.sessionActive);
  const sessionCode = useBridgeStore((s) => s.sessionCode);
  const connectedDevices = useBridgeStore((s) => s.connectedDevices);

  const currentNode = starMapNodes.find((n) => n.id === currentNodeId);
  const echoCount = connectedDevices.length;

  // Generate QR code pointing to /echo on the same host as the current page
  const [qrDataUrl, setQrDataUrl] = useState(null);
  useEffect(() => {
    const echoUrl = `${window.location.origin}/echo`;
    QRCode.toDataURL(echoUrl, {
      width: 96,
      margin: 1,
      color: { dark: '#06B6D4', light: '#00000000' },
    }).then(setQrDataUrl).catch(() => {});
  }, []);

  return (
    <div className="flex flex-col gap-3" style={{ fontFamily: 'var(--font-display)' }}>
      {/* Ship name */}
      <div>
        <div
          className="text-xs tracking-[0.3em] uppercase"
          style={{ color: 'var(--text-dim)' }}
        >
          {t.vessel}
        </div>
        <div
          className="text-lg font-bold tracking-wide bridge-text-glow-amber"
          style={{ color: 'var(--amber)' }}
        >
          {demoCampaign.shipName}
        </div>
      </div>

      {/* Destination */}
      <div>
        <div
          className="text-xs tracking-[0.3em] uppercase"
          style={{ color: 'var(--text-dim)' }}
        >
          {t.destination}
        </div>
        <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          {currentNode?.label || '—'}
        </div>
      </div>

      {/* Session code + QR — for phone pairing */}
      <div className="flex items-start gap-3">
        <div>
          <div
            className="text-xs tracking-[0.3em] uppercase"
            style={{ color: 'var(--text-dim)' }}
          >
            {t.joinCode}
          </div>
          <div
            className="text-2xl font-bold tracking-[0.4em] bridge-text-glow-cyan"
            style={{ color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}
          >
            {sessionCode}
          </div>
        </div>
        {qrDataUrl && (
          <img
            src={qrDataUrl}
            alt="Scan to join"
            className="rounded"
            style={{ width: 64, height: 64 }}
          />
        )}
      </div>

      {/* Crew / Class */}
      <div>
        <div
          className="text-xs tracking-[0.3em] uppercase"
          style={{ color: 'var(--text-dim)' }}
        >
          {t.crew}
        </div>
        <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {demoCampaign.className}
        </div>
      </div>

      {/* Connected sensors */}
      <div className="flex items-center gap-2 mt-1">
        <div
          className="w-2 h-2 rounded-full"
          style={{
            backgroundColor: echoCount > 0 ? 'var(--success)' : micConnected ? 'var(--cyan)' : 'var(--text-dim)',
            boxShadow: echoCount > 0 ? '0 0 6px var(--success)' : 'none',
          }}
        />
        <span className="text-xs" style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
          {echoCount > 0
            ? echosConnected(echoCount)
            : micConnected
              ? t.localMicActive
              : t.noSensor}
        </span>
      </div>

      {/* Session indicator */}
      {sessionActive && (
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full animate-bridge-pulse"
            style={{ backgroundColor: 'var(--amber)' }}
          />
          <span className="text-xs" style={{ color: 'var(--amber)', fontFamily: 'var(--font-mono)' }}>
            {t.sessionActive}
          </span>
        </div>
      )}
    </div>
  );
}
