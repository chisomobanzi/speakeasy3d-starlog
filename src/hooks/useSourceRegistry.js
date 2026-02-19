import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { BUILTIN_SOURCES, BUILTIN_SOURCE_MAP } from '../lib/builtinSources';

/**
 * Hook that provides the unified source registry.
 * Fetches from the get_source_registry RPC, falls back to BUILTIN_SOURCES.
 *
 * @param {string|null} languageCode - Optional language code to filter sources
 * @returns {{
 *   sources: Array,
 *   searchSources: Array,
 *   provenanceSources: Array,
 *   importableSources: Array,
 *   sourceMap: Map<string, object>,
 *   getSourceStyle: (id: string) => object,
 *   loading: boolean,
 * }}
 */
export function useSourceRegistry(languageCode = null) {
  const [dbSources, setDbSources] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchSources() {
      setLoading(true);
      try {
        const { data, error } = await supabase.rpc('get_source_registry', {
          p_language_code: languageCode,
        });

        if (!cancelled && !error && Array.isArray(data) && data.length > 0) {
          setDbSources(data);
        }
      } catch {
        // Silently fall back to builtins
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchSources();
    return () => { cancelled = true; };
  }, [languageCode]);

  // Use DB sources if available, otherwise fall back to builtins
  // Apply language filtering to builtins if no DB data
  const sources = useMemo(() => {
    if (dbSources) return dbSources;

    if (!languageCode) return BUILTIN_SOURCES;

    return BUILTIN_SOURCES.filter(s =>
      !s.supported_languages || s.supported_languages.includes(languageCode)
    );
  }, [dbSources, languageCode]);

  const searchSources = useMemo(
    () => sources.filter(s => s.is_searchable),
    [sources]
  );

  const provenanceSources = useMemo(
    () => sources.filter(s =>
      s.source_type === 'provenance' || s.source_type === 'bulk' || s.is_importable
    ),
    [sources]
  );

  const importableSources = useMemo(
    () => sources.filter(s => s.is_importable),
    [sources]
  );

  const sourceMap = useMemo(() => {
    const map = new Map();
    for (const s of sources) {
      map.set(s.id, s);
    }
    // Ensure all builtins are in the map even if DB returned a subset
    for (const [id, s] of BUILTIN_SOURCE_MAP) {
      if (!map.has(id)) map.set(id, s);
    }
    return map;
  }, [sources]);

  const getSourceStyle = useCallback((id) => {
    const s = sourceMap.get(id) || BUILTIN_SOURCE_MAP.get(id);
    if (!s) {
      return { scale: 0.8, opacity: 0.7, glow: false, coreColor: '#7BA3E0', symbol: '\u25CF', label: id };
    }
    return {
      scale: s.scale,
      opacity: s.opacity,
      glow: s.glow,
      coreColor: s.core_color,
      symbol: s.symbol,
      label: s.name,
    };
  }, [sourceMap]);

  return {
    sources,
    searchSources,
    provenanceSources,
    importableSources,
    sourceMap,
    getSourceStyle,
    loading,
  };
}
