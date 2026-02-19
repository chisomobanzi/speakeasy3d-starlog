import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const DOMAIN_ICONS: Record<string, string> = {
  '1': '\u{1F30D}',
  '2': '\u{1F9D1}',
  '3': '\u{1F4AD}',
  '4': '\u{1F91D}',
  '5': '\u{1F3E0}',
  '6': '\u{1F528}',
  '7': '\u{1F3C3}',
  '8': '\u{1F522}',
  '9': '\u{1F524}',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const seedData = await req.json();
    const { language, sil_domains, words } = seedData;

    if (!language?.code || !sil_domains || !words) {
      return new Response(
        JSON.stringify({ error: 'Invalid seed data. Requires language, sil_domains, and words.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Upsert SIL domains
    const domainRows = sil_domains.map((d: any) => ({
      id: d.id,
      name: d.name,
      short_name: d.short,
      color: d.color,
      icon: DOMAIN_ICONS[d.id] || '\u{2B50}',
      display_angle: d.angle || 0,
      expected_count: d.expected || 0,
    }));

    const { error: domainError } = await supabaseAdmin
      .from('sil_domains')
      .upsert(domainRows, { onConflict: 'id' });

    if (domainError) {
      return new Response(
        JSON.stringify({ error: 'Failed to upsert domains', details: domainError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Upsert words in batches of 50
    const wordRows = words.map((w: any) => ({
      language_code: language.code,
      word: w.shona,
      translation: w.english,
      primary_domain: w.primary_domain,
      sub_domain: w.sub_domain || null,
      secondary_domains: w.secondary_domains || [],
      source: w.source || 'dictionary',
    }));

    let inserted = 0;
    let errors: string[] = [];

    for (let i = 0; i < wordRows.length; i += 50) {
      const batch = wordRows.slice(i, i + 50);
      const { error: wordError } = await supabaseAdmin
        .from('language_words')
        .upsert(batch, { onConflict: 'language_code,word' });

      if (wordError) {
        errors.push(`Batch ${i / 50}: ${wordError.message}`);
      } else {
        inserted += batch.length;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        domains_upserted: domainRows.length,
        words_upserted: inserted,
        errors: errors.length > 0 ? errors : undefined,
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
