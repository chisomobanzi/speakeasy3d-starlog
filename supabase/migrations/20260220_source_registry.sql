-- ============================================
-- Source Registry — Unified source infrastructure
-- Tables: source_registry, import_jobs
-- Alters: language_words (add domain_confidence)
-- RPCs: get_source_registry
-- ============================================

-- Source Registry: single table for all provenance + search + import sources
CREATE TABLE IF NOT EXISTS source_registry (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  description TEXT,
  source_type TEXT NOT NULL DEFAULT 'provenance',
  icon TEXT,
  symbol TEXT NOT NULL DEFAULT '●',
  core_color TEXT NOT NULL DEFAULT '#7BA3E0',
  scale REAL NOT NULL DEFAULT 0.8,
  opacity REAL NOT NULL DEFAULT 0.7,
  glow BOOLEAN NOT NULL DEFAULT false,
  adapter_id TEXT,
  adapter_config JSONB DEFAULT '{}',
  supported_languages TEXT[],
  is_builtin BOOLEAN NOT NULL DEFAULT false,
  enabled_by_default BOOLEAN NOT NULL DEFAULT true,
  is_searchable BOOLEAN NOT NULL DEFAULT false,
  is_importable BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 100,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE source_registry ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read source_registry" ON source_registry FOR SELECT USING (true);
CREATE POLICY "Authenticated insert source_registry" ON source_registry
  FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "Owner update source_registry" ON source_registry
  FOR UPDATE TO authenticated USING (created_by = auth.uid());
CREATE POLICY "Owner delete source_registry" ON source_registry
  FOR DELETE TO authenticated USING (created_by = auth.uid());

-- Seed built-in provenance sources (constellation labels)
INSERT INTO source_registry (id, name, short_name, description, source_type, symbol, core_color, scale, opacity, glow, is_builtin, is_searchable, is_importable, display_order) VALUES
  ('elder',     'Elder-verified',        'Elder',      'Verified by language elders',      'provenance', '◆', '#FFD700', 1.0, 1.0,  true,  true, false, false, 10),
  ('community', 'Community-contributed',  'Community',  'Contributed by community members', 'provenance', '◇', '#00D4FF', 0.9, 0.85, true,  true, false, false, 20),
  ('dictionary','Published dictionary',   'Dictionary', 'From published dictionaries',      'provenance', '●', '#7BA3E0', 0.8, 0.7,  false, true, false, false, 30),
  ('academic',  'Academic/linguistic',    'Academic',   'Academic and linguistic research',  'provenance', '■', '#90CAF9', 0.7, 0.65, false, true, false, false, 40),
  ('ai',        'AI-suggested',           'AI',         'Suggested by AI models',           'provenance', '○', '#9B7FD4', 0.6, 0.35, false, true, false, false, 50)
ON CONFLICT (id) DO NOTHING;

-- Seed built-in search sources
INSERT INTO source_registry (id, name, short_name, description, source_type, icon, symbol, core_color, scale, opacity, glow, adapter_id, is_builtin, is_searchable, is_importable, display_order) VALUES
  ('personal',         'My Decks',        'Mine',       'Search your personal decks',      'search', 'BookOpen',   '●', '#10b981', 0.8, 0.7, false, 'personal',       true, true,  false, 60),
  ('community_search', 'Community',       'Community',  'Search community decks',          'search', 'Users',      '●', '#6366f1', 0.8, 0.7, false, 'community',      true, true,  false, 70),
  ('freeDictionary',   'Free Dictionary', 'Free Dict',  'English-only dictionary API',     'search', 'BookMarked', '●', '#f59e0b', 0.8, 0.7, false, 'freeDictionary', true, true,  false, 80),
  ('wiktionary',       'Wiktionary',      'Wiktionary', 'Multilingual wiki dictionary',    'search', 'Globe',      '●', '#8b5cf6', 0.8, 0.7, false, 'wiktionary',     true, true,  true,  90)
ON CONFLICT (id) DO NOTHING;

-- Set supported_languages for freeDictionary (English only)
UPDATE source_registry SET supported_languages = ARRAY['en'] WHERE id = 'freeDictionary';

-- Add domain_confidence column to language_words
ALTER TABLE language_words ADD COLUMN IF NOT EXISTS domain_confidence REAL;

-- Import Jobs: tracking bulk import progress
CREATE TABLE IF NOT EXISTS import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id TEXT NOT NULL REFERENCES source_registry(id),
  language_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  total_count INTEGER DEFAULT 0,
  processed_count INTEGER DEFAULT 0,
  inserted_count INTEGER DEFAULT 0,
  updated_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  errors JSONB DEFAULT '[]',
  continue_token TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE import_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read own import_jobs" ON import_jobs
  FOR SELECT TO authenticated USING (created_by = auth.uid());
CREATE POLICY "Authenticated insert import_jobs" ON import_jobs
  FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "Authenticated update own import_jobs" ON import_jobs
  FOR UPDATE TO authenticated USING (created_by = auth.uid());

-- Also allow service_role full access for edge functions
CREATE POLICY "Service role full access import_jobs" ON import_jobs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_import_jobs_source ON import_jobs (source_id, language_code);
CREATE INDEX IF NOT EXISTS idx_import_jobs_user ON import_jobs (created_by);

-- ============================================
-- RPC: get_source_registry
-- Returns all sources, optionally filtered by language support.
-- ============================================
CREATE OR REPLACE FUNCTION get_source_registry(p_language_code TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT COALESCE(jsonb_agg(
      jsonb_build_object(
        'id', s.id,
        'name', s.name,
        'short_name', s.short_name,
        'description', s.description,
        'source_type', s.source_type,
        'icon', s.icon,
        'symbol', s.symbol,
        'core_color', s.core_color,
        'scale', s.scale,
        'opacity', s.opacity,
        'glow', s.glow,
        'adapter_id', s.adapter_id,
        'adapter_config', s.adapter_config,
        'supported_languages', s.supported_languages,
        'is_builtin', s.is_builtin,
        'enabled_by_default', s.enabled_by_default,
        'is_searchable', s.is_searchable,
        'is_importable', s.is_importable,
        'display_order', s.display_order
      ) ORDER BY s.display_order, s.id
    ), '[]'::jsonb)
    FROM source_registry s
    WHERE p_language_code IS NULL
       OR s.supported_languages IS NULL
       OR p_language_code = ANY(s.supported_languages)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_source_registry(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_source_registry(TEXT) TO authenticated;
