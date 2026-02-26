import { useBridgeStore } from '../../stores/bridgeStore';
import { demoCampaign, starMapNodes } from '../../data/demoCampaign';

/**
 * Ship status display — ship name, destination, session info.
 * Positioned in the top-left corner of the bridge.
 */
export default function ShipStatus() {
  const currentNodeId = useBridgeStore((s) => s.currentNodeId);
  const micConnected = useBridgeStore((s) => s.micConnected);
  const sessionActive = useBridgeStore((s) => s.sessionActive);

  const currentNode = starMapNodes.find((n) => n.id === currentNodeId);

  return (
    <div className="flex flex-col gap-3" style={{ fontFamily: 'var(--font-display)' }}>
      {/* Ship name */}
      <div>
        <div
          className="text-xs tracking-[0.3em] uppercase"
          style={{ color: 'var(--text-dim)' }}
        >
          Vessel
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
          Destination
        </div>
        <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          {currentNode?.label || '—'}
        </div>
      </div>

      {/* Crew / Class */}
      <div>
        <div
          className="text-xs tracking-[0.3em] uppercase"
          style={{ color: 'var(--text-dim)' }}
        >
          Crew
        </div>
        <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {demoCampaign.className}
        </div>
      </div>

      {/* Connection status */}
      <div className="flex items-center gap-2 mt-1">
        <div
          className="w-2 h-2 rounded-full"
          style={{
            backgroundColor: micConnected ? 'var(--success)' : 'var(--text-dim)',
            boxShadow: micConnected ? '0 0 6px var(--success)' : 'none',
          }}
        />
        <span className="text-xs" style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
          {micConnected ? '1 sensor active' : 'No sensor'}
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
            Session active
          </span>
        </div>
      )}
    </div>
  );
}
