-- ============================================
-- STARLOG DATABASE SCHEMA
-- Run this in your Supabase SQL Editor
-- ============================================

-- ============================================
-- PROFILES (extends Supabase auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  native_language TEXT DEFAULT 'en',

  -- Verification status
  is_verified BOOLEAN DEFAULT false,
  verified_languages TEXT[] DEFAULT '{}',

  -- Stats
  contribution_count INTEGER DEFAULT 0,
  review_count INTEGER DEFAULT 0,

  -- Settings
  settings JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DECKS (Personal vocabulary collections)
-- ============================================
CREATE TABLE IF NOT EXISTS decks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  description TEXT,
  target_language TEXT NOT NULL,
  native_language TEXT DEFAULT 'en',
  color TEXT DEFAULT '#06b6d4',
  icon TEXT,

  forked_from UUID,

  word_count INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ENTRIES (Words in personal decks)
-- ============================================
CREATE TABLE IF NOT EXISTS entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id UUID REFERENCES decks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  word TEXT NOT NULL,
  phonetic TEXT,
  translation TEXT NOT NULL,
  language TEXT NOT NULL,

  notes TEXT,
  examples TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',

  source_type TEXT,
  source_detail TEXT,
  contributor_name TEXT,
  contributor_location TEXT,

  audio_url TEXT,
  image_url TEXT,

  srs_state TEXT DEFAULT 'pending',
  mastery_level REAL DEFAULT 0,
  streak INTEGER DEFAULT 0,
  next_review_at TIMESTAMPTZ,
  last_reviewed_at TIMESTAMPTZ,
  review_count INTEGER DEFAULT 0,

  community_entry_id UUID,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- COMMUNITY DECKS (Shared collections)
-- ============================================
CREATE TABLE IF NOT EXISTS community_decks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  name TEXT NOT NULL,
  description TEXT,
  language_code TEXT NOT NULL,

  created_by UUID REFERENCES profiles(id),
  maintainers UUID[] DEFAULT '{}',

  word_count INTEGER DEFAULT 0,
  learner_count INTEGER DEFAULT 0,
  fork_count INTEGER DEFAULT 0,
  rating REAL DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  verified_percent REAL DEFAULT 0,

  is_featured BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key for forked_from after community_decks exists
DO $$ BEGIN
  ALTER TABLE decks ADD CONSTRAINT fk_forked_from
    FOREIGN KEY (forked_from) REFERENCES community_decks(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- COMMUNITY ENTRIES (Words in community decks)
-- ============================================
CREATE TABLE IF NOT EXISTS community_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id UUID REFERENCES community_decks(id) ON DELETE CASCADE,

  word TEXT NOT NULL,
  phonetic TEXT,
  translation TEXT NOT NULL,
  language_code TEXT NOT NULL,

  notes TEXT,
  examples TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  dialect TEXT,

  submitted_by UUID REFERENCES profiles(id),
  contributor_name TEXT,
  contributor_location TEXT,
  confidence REAL DEFAULT 0.5,

  status TEXT DEFAULT 'pending',
  verified_by UUID[] DEFAULT '{}',
  verification_count INTEGER DEFAULT 0,
  verifications_needed INTEGER DEFAULT 3,

  audio_recordings JSONB DEFAULT '[]',
  images JSONB DEFAULT '[]',

  revision_count INTEGER DEFAULT 1,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key for community_entry_id after community_entries exists
DO $$ BEGIN
  ALTER TABLE entries ADD CONSTRAINT fk_community_entry
    FOREIGN KEY (community_entry_id) REFERENCES community_entries(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- REVIEWS (Verification actions)
-- ============================================
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID REFERENCES community_entries(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  decision TEXT NOT NULL,
  comment TEXT,
  suggested_edits JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(entry_id, reviewer_id)
);

-- ============================================
-- LANGUAGE COMMUNITIES (Governance)
-- ============================================
CREATE TABLE IF NOT EXISTS language_communities (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  native_name TEXT,

  stewards UUID[] DEFAULT '{}',
  maintainers UUID[] DEFAULT '{}',

  review_threshold INTEGER DEFAULT 3,
  allow_anonymous BOOLEAN DEFAULT false,
  require_audio BOOLEAN DEFAULT false,

  total_entries INTEGER DEFAULT 0,
  total_contributors INTEGER DEFAULT 0,
  total_learners INTEGER DEFAULT 0,
  verified_percent REAL DEFAULT 0,
  pending_reviews INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ACTIVITY LOG (For feeds)
-- ============================================
CREATE TABLE IF NOT EXISTS activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  type TEXT NOT NULL,
  language_code TEXT,

  user_id UUID REFERENCES profiles(id),
  entry_id UUID REFERENCES community_entries(id),
  deck_id UUID REFERENCES community_decks(id),

  data JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_entries_deck ON entries(deck_id);
CREATE INDEX IF NOT EXISTS idx_entries_user ON entries(user_id);
CREATE INDEX IF NOT EXISTS idx_entries_srs ON entries(srs_state, next_review_at);
CREATE INDEX IF NOT EXISTS idx_community_entries_deck ON community_entries(deck_id);
CREATE INDEX IF NOT EXISTS idx_community_entries_status ON community_entries(status);
CREATE INDEX IF NOT EXISTS idx_community_entries_language ON community_entries(language_code);
CREATE INDEX IF NOT EXISTS idx_activity_language ON activity(language_code, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_user ON activity(user_id, created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_entries ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Public profiles for community features
CREATE POLICY "Public profiles are viewable" ON profiles
  FOR SELECT USING (true);

-- Decks policies
CREATE POLICY "Users can view own decks" ON decks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create decks" ON decks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own decks" ON decks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own decks" ON decks
  FOR DELETE USING (auth.uid() = user_id);

-- Entries policies
CREATE POLICY "Users can view own entries" ON entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create entries" ON entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own entries" ON entries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own entries" ON entries
  FOR DELETE USING (auth.uid() = user_id);

-- Community decks policies
CREATE POLICY "Anyone can view published community decks" ON community_decks
  FOR SELECT USING (is_published = true);

CREATE POLICY "Authenticated users can create community decks" ON community_decks
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Community entries policies
CREATE POLICY "Anyone can view approved community entries" ON community_entries
  FOR SELECT USING (status = 'approved');

CREATE POLICY "Authenticated users can submit entries" ON community_entries
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Reviews policies
CREATE POLICY "Users can view own reviews" ON reviews
  FOR SELECT USING (auth.uid() = reviewer_id);

CREATE POLICY "Verified users can create reviews" ON reviews
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_verified = true
    )
  );

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to increment deck word count
CREATE OR REPLACE FUNCTION increment_deck_word_count(target_deck_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE decks
  SET word_count = word_count + 1, updated_at = NOW()
  WHERE id = target_deck_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement deck word count
CREATE OR REPLACE FUNCTION decrement_deck_word_count(target_deck_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE decks
  SET word_count = GREATEST(0, word_count - 1), updated_at = NOW()
  WHERE id = target_deck_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment fork count
CREATE OR REPLACE FUNCTION increment_fork_count(deck_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE community_decks
  SET fork_count = fork_count + 1, updated_at = NOW()
  WHERE id = deck_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment review count
CREATE OR REPLACE FUNCTION increment_review_count(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET review_count = review_count + 1, updated_at = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- CROSS-APP API RPC FUNCTIONS
-- ============================================

-- Atomically insert an entry + increment deck word count.
-- Used by Missions, phone share, Constellations, any external app.
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
  -- Verify deck belongs to the calling user
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

  -- Increment deck word count
  UPDATE decks
  SET word_count = word_count + 1, updated_at = NOW()
  WHERE id = p_deck_id;

  RETURN to_jsonb(v_entry);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Return all user decks + entries for sync.
-- If p_since is NULL, returns full data. Otherwise incremental (updated_at > p_since).
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

-- Push SRS progress from external review sessions back to Starlog.
-- Conflict resolution: last_reviewed_at wins (only updates if incoming is newer).
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

-- ============================================
-- SEED DATA: Sample language communities
-- ============================================
INSERT INTO language_communities (code, name, native_name) VALUES
  ('pt', 'Portuguese', 'Português'),
  ('es', 'Spanish', 'Español'),
  ('sn', 'Shona', 'chiShona'),
  ('zu', 'Zulu', 'isiZulu'),
  ('sw', 'Swahili', 'Kiswahili'),
  ('yo', 'Yoruba', 'Yorùbá'),
  ('ami', 'Amis', 'Pangcah')
ON CONFLICT (code) DO NOTHING;

-- Done!
SELECT 'Schema created successfully!' AS status;
