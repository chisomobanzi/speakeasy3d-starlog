/**
 * Canonical SIL Semantic Domains v4 layout.
 *
 * `expected` = number of distinct sub-domains in SIL's hierarchy.
 * Source: semdom.org (CC BY-SA 4.0), verified via `semantic-domains` npm package.
 * Methodology: Count of distinct sub-domain entries under each top-level domain
 * in SIL International's Semantic Domain hierarchy v4, a cross-linguistic
 * classification system originally developed from Bantu language fieldwork
 * (Kifuliiru, Gikuyu, Lugwere).
 */

export const CANONICAL_SIL_DOMAINS = [
  { id: '1', name: 'Universe & Creation',  nameLocal: 'Universe',   color: '#4ECDC4', icon: '\u{1F30D}', expected: 106, angle: 0 },
  { id: '2', name: 'Person',               nameLocal: 'Person',     color: '#FF6B8A', icon: '\u{1F9D1}', expected: 137, angle: 40 },
  { id: '3', name: 'Language & Thought',    nameLocal: 'Mind',       color: '#CE93D8', icon: '\u{1F4AD}', expected: 236, angle: 80 },
  { id: '4', name: 'Social Behavior',       nameLocal: 'Social',     color: '#FFB347', icon: '\u{1F91D}', expected: 332, angle: 120 },
  { id: '5', name: 'Daily Life',            nameLocal: 'Daily Life', color: '#7ED87E', icon: '\u{1F3E0}', expected: 100, angle: 160 },
  { id: '6', name: 'Work & Occupation',     nameLocal: 'Work',       color: '#A5D6A7', icon: '\u{1F528}', expected: 247, angle: 200 },
  { id: '7', name: 'Physical Actions',      nameLocal: 'Actions',    color: '#82B1FF', icon: '\u{1F3C3}', expected: 176, angle: 240 },
  { id: '8', name: 'States',               nameLocal: 'States',     color: '#FFAB91', icon: '\u{1F522}', expected: 290, angle: 280 },
  { id: '9', name: 'Grammar',              nameLocal: 'Grammar',    color: '#B0BEC5', icon: '\u{1F524}', expected: 168, angle: 320 },
];

export const TOTAL_EXPECTED = 1792;
