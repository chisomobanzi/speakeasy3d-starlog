-- Cross-App API: RPC functions + sync indexes

-- Atomically insert an entry + increment deck word count.
CREATE OR REPLACE FUNCTION quick_add_entry(
  p_deck_id UUID,
  p_word TEXT,
  p_translation TEXT,
  p_language TEXT,
  p_phonetic TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_tags TEXT[] DEFAULT '{}',
  p_source_type TEXT DEFAULT NULL,
  p_source_detail TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_entry entries%ROWTYPE;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM decks WHERE id = p_deck_id AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Deck not found or not owned by user';
  END IF;

  INSERT INTO entries (
    deck_id, user_id, word, translation, language,
    phonetic, notes, tags, source_type, source_detail,
    srs_state, mastery_level, streak, review_count
  ) VALUES (
    p_deck_id, v_user_id, p_word, p_translation, p_language,
    p_phonetic, p_notes, p_tags, p_source_type, p_source_detail,
    'pending', 0, 0, 0
  )
  RETURNING * INTO v_entry;

  UPDATE decks
  SET word_count = word_count + 1, updated_at = NOW()
  WHERE id = p_deck_id;

  RETURN to_jsonb(v_entry);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Return all user decks + entries for sync.
CREATE OR REPLACE FUNCTION get_sync_bundle(
  p_since TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_decks JSONB;
  v_entries JSONB;
BEGIN
  IF p_since IS NULL THEN
    SELECT COALESCE(jsonb_agg(to_jsonb(d)), '[]'::jsonb)
    INTO v_decks
    FROM decks d WHERE d.user_id = v_user_id;

    SELECT COALESCE(jsonb_agg(to_jsonb(e)), '[]'::jsonb)
    INTO v_entries
    FROM entries e WHERE e.user_id = v_user_id;
  ELSE
    SELECT COALESCE(jsonb_agg(to_jsonb(d)), '[]'::jsonb)
    INTO v_decks
    FROM decks d WHERE d.user_id = v_user_id AND d.updated_at > p_since;

    SELECT COALESCE(jsonb_agg(to_jsonb(e)), '[]'::jsonb)
    INTO v_entries
    FROM entries e WHERE e.user_id = v_user_id AND e.updated_at > p_since;
  END IF;

  RETURN jsonb_build_object(
    'decks', v_decks,
    'entries', v_entries,
    'server_time', NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Push SRS progress from external review sessions back.
CREATE OR REPLACE FUNCTION batch_upsert_srs(
  p_updates JSONB
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_item JSONB;
  v_entry_id UUID;
  v_updated_ids UUID[] := '{}';
BEGIN
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_updates)
  LOOP
    v_entry_id := (v_item->>'entry_id')::UUID;

    UPDATE entries SET
      srs_state = COALESCE(v_item->>'srs_state', srs_state),
      mastery_level = COALESCE((v_item->>'mastery_level')::REAL, mastery_level),
      streak = COALESCE((v_item->>'streak')::INTEGER, streak),
      review_count = COALESCE((v_item->>'review_count')::INTEGER, review_count),
      next_review_at = COALESCE((v_item->>'next_review_at')::TIMESTAMPTZ, next_review_at),
      last_reviewed_at = COALESCE((v_item->>'last_reviewed_at')::TIMESTAMPTZ, last_reviewed_at),
      updated_at = NOW()
    WHERE id = v_entry_id
      AND user_id = v_user_id
      AND (
        last_reviewed_at IS NULL
        OR (v_item->>'last_reviewed_at')::TIMESTAMPTZ > last_reviewed_at
      );

    IF FOUND THEN
      v_updated_ids := array_append(v_updated_ids, v_entry_id);
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'updated_ids', to_jsonb(v_updated_ids),
    'updated_count', array_length(v_updated_ids, 1)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Indexes for incremental sync performance
CREATE INDEX IF NOT EXISTS idx_entries_user_updated ON entries(user_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_decks_user_updated ON decks(user_id, updated_at);
