-- ============================================
-- DICTIONARY SEARCH RPC
-- Enables cross-app dictionary lookup (Missions, Constellations)
-- by searching personal + community entries via a single RPC call.
-- ============================================

-- Enable trigram extension for fuzzy ILIKE performance
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- GIN trigram indexes for ILIKE searches
CREATE INDEX IF NOT EXISTS idx_entries_word_trgm
  ON entries USING gin (word gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_entries_translation_trgm
  ON entries USING gin (translation gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_community_entries_word_trgm
  ON community_entries USING gin (word gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_community_entries_translation_trgm
  ON community_entries USING gin (translation gin_trgm_ops);

-- Search personal + community dictionary entries.
-- Returns results grouped by source_type.
CREATE OR REPLACE FUNCTION search_dictionary(
  p_query TEXT,
  p_language TEXT DEFAULT NULL,
  p_deck_id UUID DEFAULT NULL,
  p_sources TEXT[] DEFAULT '{personal,community}',
  p_limit INTEGER DEFAULT 25
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_personal JSONB := '[]'::jsonb;
  v_community JSONB := '[]'::jsonb;
BEGIN
  -- Guard: minimum query length
  IF length(trim(p_query)) < 2 THEN
    RAISE EXCEPTION 'Query must be at least 2 characters';
  END IF;

  -- Personal entries (requires auth)
  IF 'personal' = ANY(p_sources) AND v_user_id IS NOT NULL THEN
    SELECT COALESCE(jsonb_agg(row_to_json(t)::jsonb), '[]'::jsonb)
    INTO v_personal
    FROM (
      SELECT
        e.id,
        e.word,
        e.phonetic,
        e.translation,
        e.language,
        e.notes,
        e.tags,
        e.examples,
        e.audio_url,
        'personal' AS source_type,
        NULL AS contributor_name,
        e.deck_id
      FROM entries e
      WHERE e.user_id = v_user_id
        AND (p_deck_id IS NULL OR e.deck_id = p_deck_id)
        AND (p_language IS NULL OR e.language = p_language)
        AND (e.word ILIKE '%' || p_query || '%' OR e.translation ILIKE '%' || p_query || '%')
      ORDER BY
        (e.word ILIKE p_query) DESC,
        (e.word ILIKE p_query || '%') DESC,
        e.updated_at DESC
      LIMIT p_limit
    ) t;
  END IF;

  -- Community entries (approved only)
  IF 'community' = ANY(p_sources) THEN
    SELECT COALESCE(jsonb_agg(row_to_json(t)::jsonb), '[]'::jsonb)
    INTO v_community
    FROM (
      SELECT
        ce.id,
        ce.word,
        ce.phonetic,
        ce.translation,
        ce.language_code AS language,
        ce.notes,
        ce.tags,
        ce.examples,
        NULL AS audio_url,
        'community' AS source_type,
        ce.contributor_name,
        ce.deck_id
      FROM community_entries ce
      WHERE ce.status = 'approved'
        AND (p_language IS NULL OR ce.language_code = p_language)
        AND (ce.word ILIKE '%' || p_query || '%' OR ce.translation ILIKE '%' || p_query || '%')
      ORDER BY
        (ce.word ILIKE p_query) DESC,
        (ce.word ILIKE p_query || '%') DESC,
        ce.verification_count DESC
      LIMIT p_limit
    ) t;
  END IF;

  RETURN jsonb_build_object(
    'personal', v_personal,
    'community', v_community
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
