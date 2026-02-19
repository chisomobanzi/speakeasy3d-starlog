// Pure utility functions for constellation layout
// Extracted from LanguageConstellation.jsx for reuse in public constellation

// Generate background stars for depth effect
export function generateStars(count = 100) {
  const stars = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: (Math.random() - 0.5) * 2.2,
      y: (Math.random() - 0.5) * 2.2,
      size: Math.random() * 0.008 + 0.002,
      opacity: Math.random() * 0.5 + 0.1,
    });
  }
  return stars;
}

// Golden angle spiral layout for words in a domain
export function goldenAngleSpiral(index, total, radius = 0.7) {
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const angle = index * goldenAngle;
  const r = radius * Math.sqrt(index / total);
  return {
    x: Math.cos(angle) * r,
    y: Math.sin(angle) * r,
  };
}

// Calculate sector positions for domains
export function calculateDomainSectors(domains) {
  const anglePerDomain = (2 * Math.PI) / domains.length;
  return domains.map((domain, i) => {
    const startAngle = i * anglePerDomain - Math.PI / 2;
    const midAngle = startAngle + anglePerDomain / 2;
    return {
      ...domain,
      startAngle,
      endAngle: startAngle + anglePerDomain,
      midAngle,
      labelX: Math.cos(midAngle) * 0.75,
      labelY: Math.sin(midAngle) * 0.75,
    };
  });
}
