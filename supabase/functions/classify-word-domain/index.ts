import { corsHeaders } from '../_shared/cors.ts';

/**
 * Edge function: classify a word into one of the 9 SIL semantic domains
 * using the Claude API. Called when a user submits a word suggestion
 * without selecting a domain.
 *
 * POST body: { word, translation, language_code }
 * Returns: { domain_id, domain_name, confidence }
 */

const SIL_DOMAINS = [
  { id: '1', name: 'Universe & Creation', desc: 'sky, earth, water, plants, animals, weather, natural world' },
  { id: '2', name: 'Person', desc: 'body parts, health, sickness, birth, death, life stages' },
  { id: '3', name: 'Language & Thought', desc: 'thinking, knowing, emotions, speaking, writing, learning, education' },
  { id: '4', name: 'Social Behavior', desc: 'family, greetings, religion, ceremonies, governance, war, peace' },
  { id: '5', name: 'Daily Life', desc: 'house, furniture, food, cooking, clothing, fire' },
  { id: '6', name: 'Work & Occupation', desc: 'farming, hunting, crafts, tools, money, trade' },
  { id: '7', name: 'Physical Actions', desc: 'movement, walking, running, holding, throwing, cutting, playing' },
  { id: '8', name: 'States', desc: 'numbers, size, color, time, location, qualities' },
  { id: '9', name: 'Grammar', desc: 'pronouns, conjunctions, question words, particles' },
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { word, translation, language_code } = await req.json();

    if (!word || !translation) {
      return new Response(
        JSON.stringify({ error: 'word and translation are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicKey) {
      // Fallback: simple keyword heuristic if no API key
      return new Response(
        JSON.stringify(classifyByHeuristic(translation)),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const domainList = SIL_DOMAINS.map(d => `${d.id}: ${d.name} (${d.desc})`).join('\n');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 100,
        messages: [{
          role: 'user',
          content: `Classify this ${language_code || ''} word into one SIL semantic domain.

Word: ${word}
Translation: ${translation}

Domains:
${domainList}

Reply with ONLY a JSON object: {"domain_id": "N", "domain_name": "...", "confidence": 0.0-1.0}`,
        }],
      }),
    });

    if (!response.ok) {
      // Fallback to heuristic
      return new Response(
        JSON.stringify(classifyByHeuristic(translation)),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const result = await response.json();
    const text = result.content?.[0]?.text || '';

    // Parse JSON from Claude's response
    const jsonMatch = text.match(/\{[^}]+\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return new Response(
        JSON.stringify(parsed),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Fallback
    return new Response(
      JSON.stringify(classifyByHeuristic(translation)),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Classification failed', details: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});

// Simple keyword-based fallback classification
function classifyByHeuristic(translation: string): { domain_id: string; domain_name: string; confidence: number } {
  const t = translation.toLowerCase();

  const rules: [RegExp, string, string][] = [
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

  for (const [pattern, id, name] of rules) {
    if (pattern.test(t)) {
      return { domain_id: id, domain_name: name, confidence: 0.6 };
    }
  }

  return { domain_id: '9', domain_name: 'Grammar', confidence: 0.3 };
}
