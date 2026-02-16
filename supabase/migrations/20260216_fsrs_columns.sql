-- ============================================
-- FSRS COLUMNS MIGRATION
-- Adds FSRS-6 scheduling fields to entries table
-- for bidirectional sync with Constellations (UE5)
-- ============================================

ALTER TABLE entries
  ADD COLUMN IF NOT EXISTS fsrs_stability     REAL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fsrs_difficulty     REAL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fsrs_state          TEXT DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS fsrs_reps           INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fsrs_lapses         INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fsrs_learning_step  INTEGER DEFAULT 0;

-- ============================================
-- UPDATE batch_upsert_srs to accept FSRS fields
-- ============================================

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

    -- Only update if entry belongs to user AND incoming last_reviewed_at is newer
    UPDATE entries SET
      srs_state = COALESCE(v_item->>'srs_state', srs_state),
      mastery_level = COALESCE((v_item->>'mastery_level')::REAL, mastery_level),
      streak = COALESCE((v_item->>'streak')::INTEGER, streak),
      review_count = COALESCE((v_item->>'review_count')::INTEGER, review_count),
      next_review_at = COALESCE((v_item->>'next_review_at')::TIMESTAMPTZ, next_review_at),
      last_reviewed_at = COALESCE((v_item->>'last_reviewed_at')::TIMESTAMPTZ, last_reviewed_at),
      fsrs_stability = COALESCE((v_item->>'fsrs_stability')::REAL, fsrs_stability),
      fsrs_difficulty = COALESCE((v_item->>'fsrs_difficulty')::REAL, fsrs_difficulty),
      fsrs_state = COALESCE(v_item->>'fsrs_state', fsrs_state),
      fsrs_reps = COALESCE((v_item->>'fsrs_reps')::INTEGER, fsrs_reps),
      fsrs_lapses = COALESCE((v_item->>'fsrs_lapses')::INTEGER, fsrs_lapses),
      fsrs_learning_step = COALESCE((v_item->>'fsrs_learning_step')::INTEGER, fsrs_learning_step),
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
