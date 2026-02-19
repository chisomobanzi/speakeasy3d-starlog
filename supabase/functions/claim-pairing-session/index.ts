import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { code } = await req.json();

    // Validate format: exactly 6 digits
    if (typeof code !== 'string' || !/^\d{6}$/.test(code)) {
      return new Response(
        JSON.stringify({ error: 'Invalid code format. Must be a 6-digit string.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Service-role client for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Atomically claim the code: update only if unclaimed and unexpired
    const { data: claimed, error: claimError } = await supabaseAdmin
      .from('pairing_codes')
      .update({
        claimed_at: new Date().toISOString(),
        claimed_by_ip: req.headers.get('x-forwarded-for') ?? req.headers.get('cf-connecting-ip') ?? 'unknown',
      })
      .eq('code', code)
      .is('claimed_at', null)
      .gt('expires_at', new Date().toISOString())
      .select('user_id')
      .single();

    if (claimError || !claimed) {
      return new Response(
        JSON.stringify({ error: 'Invalid, expired, or already-claimed code.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const userId = claimed.user_id;

    // Look up user email
    const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (userError || !user?.email) {
      return new Response(
        JSON.stringify({ error: 'User not found.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Generate a magic link token (not sent by email — we extract the token)
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: user.email,
    });
    if (linkError || !linkData) {
      return new Response(
        JSON.stringify({ error: 'Failed to generate session link.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Exchange the OTP token hash for a real session
    const { data: session, error: sessionError } = await supabaseAdmin.auth.verifyOtp({
      token_hash: linkData.properties.hashed_token,
      type: 'magiclink',
    });
    if (sessionError || !session.session) {
      return new Response(
        JSON.stringify({ error: 'Failed to create session.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify({
        access_token: session.session.access_token,
        refresh_token: session.session.refresh_token,
        expires_in: session.session.expires_in,
        user: {
          id: session.session.user.id,
          email: session.session.user.email,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Internal server error.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
