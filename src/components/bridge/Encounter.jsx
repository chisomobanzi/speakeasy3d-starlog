import { useBridgeStore, SCREENS } from '../../stores/bridgeStore';
import { encounters } from '../../data/demoCampaign';
import SpellDuel from './SpellDuel';

/**
 * Encounter dispatcher — routes to the correct encounter component
 * based on encounter type.
 */
export default function Encounter() {
  const encounterId = useBridgeStore((s) => s.currentEncounterId);
  const endEncounter = useBridgeStore((s) => s.endEncounter);
  const setScreen = useBridgeStore((s) => s.setScreen);

  const encounter = encounters[encounterId];

  const handleComplete = () => {
    endEncounter();
    setScreen(SCREENS.BRIDGE);
  };

  if (!encounter) return null;

  switch (encounter.type) {
    case 'spell_duel':
      return <SpellDuel encounter={encounter} onComplete={handleComplete} />;
    default:
      return (
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'var(--bg-deep)' }}>
          <div className="text-center">
            <div className="bridge-display text-2xl" style={{ color: 'var(--text-secondary)' }}>
              Encounter type "{encounter.type}" coming soon
            </div>
            <button onClick={handleComplete} className="mt-6 bridge-display text-lg" style={{ color: 'var(--amber)' }}>
              Return to Bridge
            </button>
          </div>
        </div>
      );
  }
}
