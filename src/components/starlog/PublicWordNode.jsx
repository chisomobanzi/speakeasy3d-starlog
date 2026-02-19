import { SOURCE_STYLES } from '../../lib/constellation-adapter';

/**
 * Word node for the public constellation, styled by source attribution.
 * Accepts an optional `pulseIntensity` (0-1) for Wikipedia signal animation.
 */
export default function PublicWordNode({
  word,
  x,
  y,
  domain,
  isHovered,
  isSelected,
  isMultiDomain,
  pulseIntensity = 0,
  onHover,
  onClick,
}) {
  const style = SOURCE_STYLES[word.source] || SOURCE_STYLES.dictionary;
  const baseSize = 0.04;
  const size = baseSize * style.scale * (isSelected ? 1.5 : isHovered ? 1.2 : 1);
  const color = domain?.color || '#8b5cf6';

  // Pulse animation timing: higher intensity = faster pulse
  const pulseDur = pulseIntensity > 0 ? (2.5 - pulseIntensity * 2) + 's' : '2s';
  const showPulse = pulseIntensity > 0.05;

  return (
    <g
      className="cursor-pointer"
      transform={`translate(${x}, ${y})`}
      onMouseEnter={() => onHover(word.id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onClick(word)}
    >
      {/* Multi-domain indicator (dashed ring) */}
      {isMultiDomain && (
        <circle
          r={size * 1.5}
          fill="none"
          stroke={color}
          strokeWidth={0.003}
          strokeDasharray="0.01 0.005"
          opacity={0.6}
        />
      )}

      {/* Wikipedia pulse ring */}
      {showPulse && (
        <circle
          r={size * 2}
          fill="none"
          stroke={color}
          strokeWidth={0.004}
          opacity={pulseIntensity * 0.6}
        >
          <animate
            attributeName="r"
            values={`${size * 1.5};${size * 3};${size * 1.5}`}
            dur={pulseDur}
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values={`${pulseIntensity * 0.6};${pulseIntensity * 0.1};${pulseIntensity * 0.6}`}
            dur={pulseDur}
            repeatCount="indefinite"
          />
        </circle>
      )}

      {/* Source glow effect (elder & community words) */}
      {style.glow && (
        <circle r={size * 1.5} fill={color} opacity={0.3}>
          <animate
            attributeName="opacity"
            values="0.3;0.15;0.3"
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>
      )}

      {/* Main circle */}
      <circle
        r={size}
        fill={color}
        opacity={isHovered || isSelected ? 1 : style.opacity}
        stroke={isSelected ? 'white' : 'none'}
        strokeWidth={0.005}
      />

      {/* Core color for elder/community sources */}
      {style.coreColor && (
        <circle r={size * 0.3} fill={style.coreColor} opacity={0.9} />
      )}
    </g>
  );
}
