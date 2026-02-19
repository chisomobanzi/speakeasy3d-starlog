import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

/**
 * Cron-based edge function: polls Shona Wikipedia recent changes
 * and records usage signals for matched vocabulary words.
 *
 * Schedule: every 10 minutes (cron)
 *
 * Can also be invoked manually via POST with optional body:
 *   { "language_code": "sn", "limit": 50 }
 */

const WIKI_API_BASE = 'https://{lang}.wikipedia.org/w/api.php';

// Simple tokenizer: split on whitespace/punctuation, lowercase
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse optional params
    let languageCode = 'sn';
    let rcLimit = 50;

    if (req.method === 'POST') {
      try {
        const body = await req.json();
        if (body.language_code) languageCode = body.language_code;
        if (body.limit) rcLimit = Math.min(body.limit, 500);
      } catch {
        // No body is fine for cron invocations
      }
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // 1. Load all language_words into a lookup map
    const { data: words, error: wordsError } = await supabaseAdmin
      .from('language_words')
      .select('id, word')
      .eq('language_code', languageCode);

    if (wordsError || !words?.length) {
      return new Response(
        JSON.stringify({
          error: wordsError?.message || 'No words found',
          language_code: languageCode,
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Build word -> id map (lowercase)
    const wordMap = new Map<string, string>();
    for (const w of words) {
      wordMap.set(w.word.toLowerCase(), w.id);
    }

    // 2. Fetch recent changes from Wikipedia
    const wikiUrl = WIKI_API_BASE.replace('{lang}', languageCode);
    const apiUrl = `${wikiUrl}?action=query&list=recentchanges&rcnamespace=0&rclimit=${rcLimit}&rcprop=title|timestamp|ids&format=json`;

    const wikiRes = await fetch(apiUrl, {
      headers: { 'User-Agent': 'Starlog/1.0 (Language Constellation; contact@speakeasy3d.com)' },
    });

    if (!wikiRes.ok) {
      return new Response(
        JSON.stringify({ error: `Wikipedia API returned ${wikiRes.status}` }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const wikiData = await wikiRes.json();
    const recentChanges = wikiData?.query?.recentchanges || [];

    // 3. Tokenize titles, match against vocabulary
    let editsChecked = 0;
    let signalsFound = 0;
    const matchedWords = new Set<string>();

    for (const rc of recentChanges) {
      editsChecked++;
      const tokens = tokenize(rc.title);

      for (const token of tokens) {
        const wordId = wordMap.get(token);
        if (wordId) {
          // Record the signal via RPC
          const { error: sigError } = await supabaseAdmin.rpc('record_usage_signal', {
            p_word_id: wordId,
            p_language_code: languageCode,
            p_signal_type: 'wikipedia_edit',
            p_signal_source: `${languageCode}.wikipedia.org`,
            p_source_url: `https://${languageCode}.wikipedia.org/wiki/${encodeURIComponent(rc.title)}`,
            p_source_title: rc.title,
            p_raw_data: { rcid: rc.rcid, timestamp: rc.timestamp },
          });

          if (!sigError) {
            signalsFound++;
            matchedWords.add(token);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        language_code: languageCode,
        edits_checked: editsChecked,
        signals_found: signalsFound,
        words_matched: Array.from(matchedWords),
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
