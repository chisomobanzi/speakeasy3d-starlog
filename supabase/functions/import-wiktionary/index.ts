import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

/**
 * Wiktionary bulk import edge function.
 *
 * Strategy: MediaWiki category crawl -> fetch definitions -> classify -> upsert.
 *
 * POST body: {
 *   language_code: string,     // e.g. "sn"
 *   batch_size?: number,       // default 50
 *   continue_from?: string,    // cmcontinue token for pagination
 *   job_id?: string,           // existing job to update
 * }
 *
 * Returns: { inserted, updated, errors, cmcontinue, total_in_category, job_id }
 */

// Map ISO codes to Wiktionary category names ({Language}_lemmas)
const CATEGORY_MAP: Record<string, string> = {
  en: 'English_lemmas',
  es: 'Spanish_lemmas',
  fr: 'French_lemmas',
  de: 'German_lemmas',
  pt: 'Portuguese_lemmas',
  it: 'Italian_lemmas',
  nl: 'Dutch_lemmas',
  sv: 'Swedish_lemmas',
  ru: 'Russian_lemmas',
  ja: 'Japanese_lemmas',
  zh: 'Chinese_lemmas',
  ko: 'Korean_lemmas',
  ar: 'Arabic_lemmas',
  hi: 'Hindi_lemmas',
  tr: 'Turkish_lemmas',
  pl: 'Polish_lemmas',
  vi: 'Vietnamese_lemmas',
  th: 'Thai_lemmas',
  id: 'Indonesian_lemmas',
  ms: 'Malay_lemmas',
  tl: 'Tagalog_lemmas',
  sw: 'Swahili_lemmas',
  la: 'Latin_lemmas',
  el: 'Greek_lemmas',
  he: 'Hebrew_lemmas',
  fi: 'Finnish_lemmas',
  no: 'Norwegian_lemmas',
  da: 'Danish_lemmas',
  cs: 'Czech_lemmas',
  ro: 'Romanian_lemmas',
  hu: 'Hungarian_lemmas',
  uk: 'Ukrainian_lemmas',
  ca: 'Catalan_lemmas',
  hr: 'Croatian_lemmas',
  sr: 'Serbian_lemmas',
  bg: 'Bulgarian_lemmas',
  sk: 'Slovak_lemmas',
  sl: 'Slovenian_lemmas',
  lt: 'Lithuanian_lemmas',
  lv: 'Latvian_lemmas',
  et: 'Estonian_lemmas',
  ga: 'Irish_lemmas',
  cy: 'Welsh_lemmas',
  sn: 'Shona_lemmas',
  ami: 'Amis_lemmas',
};

// Language name map for Wiktionary definition sections
const LANG_NAME_MAP: Record<string, string> = {
  en: 'English', es: 'Spanish', fr: 'French', de: 'German', pt: 'Portuguese',
  it: 'Italian', nl: 'Dutch', sv: 'Swedish', ru: 'Russian', ja: 'Japanese',
  zh: 'Chinese', ko: 'Korean', ar: 'Arabic', hi: 'Hindi', tr: 'Turkish',
  pl: 'Polish', vi: 'Vietnamese', th: 'Thai', id: 'Indonesian', ms: 'Malay',
  tl: 'Tagalog', sw: 'Swahili', la: 'Latin', el: 'Greek', he: 'Hebrew',
  fi: 'Finnish', no: 'Norwegian', da: 'Danish', cs: 'Czech', ro: 'Romanian',
  hu: 'Hungarian', uk: 'Ukrainian', ca: 'Catalan', hr: 'Croatian', sr: 'Serbian',
  bg: 'Bulgarian', sk: 'Slovak', sl: 'Slovenian', lt: 'Lithuanian', lv: 'Latvian',
  et: 'Estonian', ga: 'Irish', cy: 'Welsh', sn: 'Shona', ami: 'Amis',
};

const WIKI_API = 'https://en.wiktionary.org/w/api.php';
const WIKI_REST = 'https://en.wiktionary.org/api/rest_v1/page/definition';

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

// Simple heuristic domain classifier (same as classify-word-domain fallback)
function classifyByHeuristic(translation: string): { domain_id: string; confidence: number } {
  const t = translation.toLowerCase();
  const rules: [RegExp, string][] = [
    [/\b(sky|earth|water|rain|sun|moon|star|tree|animal|river|mountain|plant|flower|bird|fish|snake|lion|elephant)\b/, '1'],
    [/\b(head|eye|hand|foot|heart|body|bone|blood|sick|doctor|medicine|birth|die|death|health)\b/, '2'],
    [/\b(think|know|remember|forget|speak|say|tell|write|read|learn|teach|song|sing|feel|happy|sad|angry|fear|love|dream)\b/, '3'],
    [/\b(mother|father|family|child|brother|sister|friend|chief|king|god|spirit|ceremony|pray|war|peace|hello|greet)\b/, '4'],
    [/\b(house|home|food|cook|eat|drink|cloth|shirt|shoe|bed|chair|table|fire|door|window)\b/, '5'],
    [/\b(work|farm|harvest|plant|hunt|fish|tool|money|buy|sell|price|craft|build)\b/, '6'],
    [/\b(walk|run|go|come|sit|stand|carry|throw|hold|hit|cut|pull|push|play|dance)\b/, '7'],
    [/\b(one|two|three|big|small|long|short|new|old|red|black|white|today|tomorrow|yesterday|time|here|there|up|down)\b/, '8'],
    [/\b(yes|no|i|you|he|she|we|they|and|but|if|or|what|who|how|why)\b/, '9'],
  ];
  for (const [pattern, id] of rules) {
    if (pattern.test(t)) return { domain_id: id, confidence: 0.6 };
  }
  return { domain_id: '9', confidence: 0.3 };
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchCategoryMembers(
  categoryName: string,
  batchSize: number,
  continueToken: string | null,
): Promise<{ titles: string[]; cmcontinue: string | null; total: number }> {
  const params = new URLSearchParams({
    action: 'query',
    list: 'categorymembers',
    cmtitle: `Category:${categoryName}`,
    cmlimit: String(batchSize),
    cmtype: 'page',
    cmprop: 'title',
    format: 'json',
    origin: '*',
  });
  if (continueToken) params.set('cmcontinue', continueToken);

  // Also get category info for total count
  params.set('prop', 'categoryinfo');
  params.set('titles', `Category:${categoryName}`);

  const res = await fetch(`${WIKI_API}?${params.toString()}`);
  if (!res.ok) throw new Error(`Category API error: ${res.status}`);

  const data = await res.json();
  const members = data.query?.categorymembers || [];
  const titles = members.map((m: { title: string }) => m.title);
  const cmcontinue = data.continue?.cmcontinue || null;

  // Extract total from categoryinfo
  let total = 0;
  const pages = data.query?.pages;
  if (pages) {
    const pageInfo = Object.values(pages)[0] as { categoryinfo?: { pages?: number } };
    total = pageInfo?.categoryinfo?.pages || 0;
  }

  return { titles, cmcontinue, total };
}

async function fetchDefinition(
  word: string,
  languageCode: string,
): Promise<string | null> {
  try {
    const res = await fetch(`${WIKI_REST}/${encodeURIComponent(word)}`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;

    const data = await res.json();
    // REST API keys sections by language code (e.g. 'es'), not name (e.g. 'Spanish')
    const sections = data[languageCode];
    if (!sections || !Array.isArray(sections)) return null;

    // Get first non-form-of definition
    for (const section of sections) {
      for (const def of section.definitions || []) {
        const raw = def.definition || '';
        if (raw.includes('form-of-definition')) continue;
        const text = stripHtml(raw);
        if (text && text.length > 2) return text;
      }
    }

    return null;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { language_code, batch_size = 50, continue_from = null, job_id = null } = await req.json();

    if (!language_code) {
      return new Response(
        JSON.stringify({ error: 'language_code is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const categoryName = CATEGORY_MAP[language_code];
    if (!categoryName) {
      return new Response(
        JSON.stringify({ error: `No Wiktionary category mapping for language: ${language_code}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const langName = LANG_NAME_MAP[language_code] || language_code;

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Get auth user for job tracking
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    if (authHeader) {
      const { data: { user } } = await supabaseAdmin.auth.getUser(
        authHeader.replace('Bearer ', '')
      );
      userId = user?.id || null;
    }

    // Create or update import job
    let currentJobId = job_id;
    if (!currentJobId) {
      const { data: job, error: jobError } = await supabaseAdmin
        .from('import_jobs')
        .insert({
          source_id: 'wiktionary',
          language_code,
          status: 'running',
          started_at: new Date().toISOString(),
          created_by: userId,
        })
        .select('id')
        .single();

      if (jobError) {
        console.error('Failed to create job:', jobError);
      } else {
        currentJobId = job.id;
      }
    } else {
      await supabaseAdmin
        .from('import_jobs')
        .update({ status: 'running', updated_at: new Date().toISOString() })
        .eq('id', currentJobId);
    }

    // 1. Fetch category members
    const { titles, cmcontinue, total } = await fetchCategoryMembers(
      categoryName,
      Math.min(batch_size, 50),
      continue_from,
    );

    // 2. For each word, fetch definition and upsert
    let inserted = 0;
    let updated = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const title of titles) {
      // Skip titles with namespaces (e.g., "Category:", "Appendix:")
      if (title.includes(':')) continue;

      try {
        // Rate limit: ~1 req/sec
        await sleep(1000);

        const translation = await fetchDefinition(title, language_code);
        if (!translation) continue;

        // Classify domain
        const { domain_id, confidence } = classifyByHeuristic(translation);

        // Upsert into language_words
        const { data, error: upsertError } = await supabaseAdmin
          .from('language_words')
          .upsert(
            {
              language_code,
              word: title,
              translation,
              primary_domain: domain_id,
              source: 'wiktionary',
              domain_confidence: confidence,
            },
            { onConflict: 'language_code,word' }
          )
          .select('id');

        if (upsertError) {
          errorCount++;
          errors.push(`${title}: ${upsertError.message}`);
        } else if (data && data.length > 0) {
          // Can't easily distinguish insert vs update with upsert,
          // count all as inserted for simplicity
          inserted++;
        }
      } catch (err) {
        errorCount++;
        errors.push(`${title}: ${String(err)}`);
      }
    }

    // Update job progress
    if (currentJobId) {
      const jobUpdate: Record<string, unknown> = {
        processed_count: titles.length,
        inserted_count: inserted,
        error_count: errorCount,
        total_count: total,
        continue_token: cmcontinue,
        updated_at: new Date().toISOString(),
      };

      if (!cmcontinue) {
        jobUpdate.status = 'completed';
        jobUpdate.completed_at = new Date().toISOString();
      }

      if (errors.length > 0) {
        jobUpdate.errors = JSON.stringify(errors.slice(0, 20));
      }

      await supabaseAdmin
        .from('import_jobs')
        .update(jobUpdate)
        .eq('id', currentJobId);
    }

    return new Response(
      JSON.stringify({
        inserted,
        updated,
        errors: errorCount,
        error_details: errors.slice(0, 5),
        cmcontinue,
        total_in_category: total,
        job_id: currentJobId,
        processed: titles.length,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Import failed', details: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
