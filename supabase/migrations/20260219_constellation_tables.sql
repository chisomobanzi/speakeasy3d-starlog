-- ============================================
-- Living Language Constellation — Data Layer
-- Tables: sil_domains, language_words, usage_signals, usage_aggregates
-- RPCs: get_constellation_data, record_usage_signal
-- ============================================

-- SIL Semantic Domains (reference table)
CREATE TABLE IF NOT EXISTS sil_domains (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  color TEXT NOT NULL,
  icon TEXT,
  display_angle INTEGER DEFAULT 0,
  expected_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE sil_domains ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read sil_domains" ON sil_domains FOR SELECT USING (true);

-- Language Words (vocabulary for a given language)
CREATE TABLE IF NOT EXISTS language_words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  language_code TEXT NOT NULL REFERENCES language_communities(code),
  word TEXT NOT NULL,
  translation TEXT NOT NULL,
  phonetic TEXT,
  primary_domain TEXT NOT NULL REFERENCES sil_domains(id),
  sub_domain TEXT,
  secondary_domains TEXT[] DEFAULT '{}',
  source TEXT NOT NULL DEFAULT 'dictionary',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(language_code, word)
);

ALTER TABLE language_words ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read language_words" ON language_words FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_language_words_lang ON language_words (language_code);
CREATE INDEX IF NOT EXISTS idx_language_words_domain ON language_words (primary_domain);
CREATE INDEX IF NOT EXISTS idx_language_words_word_trgm ON language_words USING gin (word gin_trgm_ops);

-- Usage Signals (individual Wikipedia/usage events)
CREATE TABLE IF NOT EXISTS usage_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word_id UUID NOT NULL REFERENCES language_words(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL,
  signal_type TEXT NOT NULL DEFAULT 'wikipedia_edit',
  signal_source TEXT,
  source_url TEXT,
  source_title TEXT,
  raw_data JSONB DEFAULT '{}',
  detected_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE usage_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read usage_signals" ON usage_signals FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_usage_signals_word ON usage_signals (word_id);
CREATE INDEX IF NOT EXISTS idx_usage_signals_lang ON usage_signals (language_code);
CREATE INDEX IF NOT EXISTS idx_usage_signals_detected ON usage_signals (detected_at DESC);

-- Enable Realtime for usage_signals
ALTER PUBLICATION supabase_realtime ADD TABLE usage_signals;

-- Usage Aggregates (hourly/daily rollups)
CREATE TABLE IF NOT EXISTS usage_aggregates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word_id UUID NOT NULL REFERENCES language_words(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL,
  period_type TEXT NOT NULL DEFAULT 'hourly',
  period_start TIMESTAMPTZ NOT NULL,
  signal_count INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(word_id, period_type, period_start)
);

ALTER TABLE usage_aggregates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read usage_aggregates" ON usage_aggregates FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_usage_agg_word ON usage_aggregates (word_id);
CREATE INDEX IF NOT EXISTS idx_usage_agg_lang_period ON usage_aggregates (language_code, period_type, period_start DESC);

-- ============================================
-- RPC: get_constellation_data
-- Returns all data needed to render a language constellation.
-- ============================================
CREATE OR REPLACE FUNCTION get_constellation_data(p_language_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_language JSONB;
  v_domains JSONB;
  v_words JSONB;
  v_signals JSONB;
BEGIN
  -- Get language info
  SELECT jsonb_build_object(
    'code', lc.code,
    'name', lc.name,
    'native_name', lc.native_name
  ) INTO v_language
  FROM language_communities lc
  WHERE lc.code = p_language_code;

  IF v_language IS NULL THEN
    RETURN jsonb_build_object('error', 'Language not found');
  END IF;

  -- Get all SIL domains
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', d.id,
      'name', d.name,
      'short_name', d.short_name,
      'color', d.color,
      'icon', d.icon,
      'expected_count', d.expected_count
    ) ORDER BY d.id
  ), '[]'::jsonb) INTO v_domains
  FROM sil_domains d;

  -- Get all words for this language
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', w.id,
      'word', w.word,
      'translation', w.translation,
      'phonetic', w.phonetic,
      'primary_domain', w.primary_domain,
      'sub_domain', w.sub_domain,
      'secondary_domains', w.secondary_domains,
      'source', w.source
    ) ORDER BY w.primary_domain, w.word
  ), '[]'::jsonb) INTO v_words
  FROM language_words w
  WHERE w.language_code = p_language_code;

  -- Get recent signals (last 24 hours)
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', s.id,
      'word_id', s.word_id,
      'word', w.word,
      'signal_type', s.signal_type,
      'source_title', s.source_title,
      'detected_at', s.detected_at
    ) ORDER BY s.detected_at DESC
  ), '[]'::jsonb) INTO v_signals
  FROM usage_signals s
  JOIN language_words w ON w.id = s.word_id
  WHERE s.language_code = p_language_code
    AND s.detected_at > NOW() - INTERVAL '24 hours'
  LIMIT 50;

  RETURN jsonb_build_object(
    'language', v_language,
    'domains', v_domains,
    'words', v_words,
    'recent_signals', v_signals
  );
END;
$$;

-- Grant anonymous access
GRANT EXECUTE ON FUNCTION get_constellation_data(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_constellation_data(TEXT) TO authenticated;

-- ============================================
-- RPC: record_usage_signal
-- Inserts a signal and upserts hourly + daily aggregates.
-- ============================================
CREATE OR REPLACE FUNCTION record_usage_signal(
  p_word_id UUID,
  p_language_code TEXT,
  p_signal_type TEXT DEFAULT 'wikipedia_edit',
  p_signal_source TEXT DEFAULT NULL,
  p_source_url TEXT DEFAULT NULL,
  p_source_title TEXT DEFAULT NULL,
  p_raw_data JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_signal_id UUID;
  v_now TIMESTAMPTZ := NOW();
  v_hour_start TIMESTAMPTZ;
  v_day_start TIMESTAMPTZ;
BEGIN
  -- Insert the signal
  INSERT INTO usage_signals (word_id, language_code, signal_type, signal_source, source_url, source_title, raw_data, detected_at)
  VALUES (p_word_id, p_language_code, p_signal_type, p_signal_source, p_source_url, p_source_title, p_raw_data, v_now)
  RETURNING id INTO v_signal_id;

  -- Upsert hourly aggregate
  v_hour_start := date_trunc('hour', v_now);
  INSERT INTO usage_aggregates (word_id, language_code, period_type, period_start, signal_count, updated_at)
  VALUES (p_word_id, p_language_code, 'hourly', v_hour_start, 1, v_now)
  ON CONFLICT (word_id, period_type, period_start)
  DO UPDATE SET signal_count = usage_aggregates.signal_count + 1, updated_at = v_now;

  -- Upsert daily aggregate
  v_day_start := date_trunc('day', v_now);
  INSERT INTO usage_aggregates (word_id, language_code, period_type, period_start, signal_count, updated_at)
  VALUES (p_word_id, p_language_code, 'daily', v_day_start, 1, v_now)
  ON CONFLICT (word_id, period_type, period_start)
  DO UPDATE SET signal_count = usage_aggregates.signal_count + 1, updated_at = v_now;

  RETURN v_signal_id;
END;
$$;

-- Grant service-role-only access (called by edge functions)
GRANT EXECUTE ON FUNCTION record_usage_signal(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB) TO service_role;

-- ============================================
-- RPC: suggest_constellation_word (Phase 3)
-- Anonymous word suggestion endpoint.
-- ============================================
CREATE OR REPLACE FUNCTION suggest_constellation_word(
  p_language_code TEXT,
  p_word TEXT,
  p_translation TEXT,
  p_primary_domain TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_word_id UUID;
BEGIN
  INSERT INTO language_words (language_code, word, translation, primary_domain, source)
  VALUES (
    p_language_code,
    p_word,
    p_translation,
    COALESCE(p_primary_domain, '9'),  -- default to Grammar if no domain
    'community'
  )
  ON CONFLICT (language_code, word) DO NOTHING
  RETURNING id INTO v_word_id;

  RETURN v_word_id;
END;
$$;

GRANT EXECUTE ON FUNCTION suggest_constellation_word(TEXT, TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION suggest_constellation_word(TEXT, TEXT, TEXT, TEXT) TO authenticated;
