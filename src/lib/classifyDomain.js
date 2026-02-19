/**
 * Client-side heuristic domain classification.
 * Extracted from supabase/functions/classify-word-domain/index.ts (lines 110-132).
 * Pure function — synchronous, free, ~60% accurate.
 */

const rules = [
  [/\b(sky|earth|water|rain|sun|moon|star|tree|animal|river|mountain|plant|flower|bird|fish|snake|lion|elephant)\b/, '1', 'Universe & Creation'],
  [/\b(head|eye|hand|foot|heart|body|bone|blood|sick|doctor|medicine|birth|die|death|health)\b/, '2', 'Person'],
  [/\b(think|know|remember|forget|speak|say|tell|write|read|learn|teach|song|sing|feel|happy|sad|angry|fear|love|dream)\b/, '3', 'Language & Thought'],
  [/\b(mother|father|family|child|brother|sister|friend|chief|king|god|spirit|ceremony|pray|war|peace|hello|greet)\b/, '4', 'Social Behavior'],
  [/\b(house|home|food|cook|eat|drink|cloth|shirt|shoe|bed|chair|table|fire|door|window)\b/, '5', 'Daily Life'],
  [/\b(work|farm|harvest|plant|hunt|fish|tool|money|buy|sell|price|craft|build)\b/, '6', 'Work & Occupation'],
  [/\b(walk|run|go|come|sit|stand|carry|throw|hold|hit|cut|pull|push|play|dance)\b/, '7', 'Physical Actions'],
  [/\b(one|two|three|big|small|long|short|new|old|red|black|white|today|tomorrow|yesterday|time|here|there|up|down)\b/, '8', 'States'],
  [/\b(yes|no|i|you|he|she|we|they|and|but|if|or|what|who|how|why)\b/, '9', 'Grammar'],
];

/**
 * Classify a word's domain by matching English translation keywords.
 * @param {string} translation - English translation text
 * @returns {{ domain_id: string, domain_name: string, confidence: number }}
 */
export function classifyByHeuristic(translation) {
  if (!translation) return { domain_id: '9', domain_name: 'Grammar', confidence: 0.1 };

  const t = translation.toLowerCase();

  for (const [pattern, id, name] of rules) {
    if (pattern.test(t)) {
      return { domain_id: id, domain_name: name, confidence: 0.6 };
    }
  }

  return { domain_id: '9', domain_name: 'Grammar', confidence: 0.3 };
}
