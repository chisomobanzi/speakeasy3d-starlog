import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { adaptSupabaseData } from '../lib/constellation-adapter';
import { fetchQuickSample } from '../lib/wiktionaryQuickSample';

/**
 * Hook to load constellation data from Supabase and subscribe to real-time signals.
 * When the DB returns no words for a language, auto-discovers vocabulary
 * from Wiktionary for an instant constellation.
 *
 * @param {string} languageCode
 * @returns {{ data, loading, error, discovering, discoveryProgress, pulseMap, recentSignals, isLive }}
 */
export function useConstellation(languageCode) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLive, setIsLive] = useState(false);

  // Discovery state (Wiktionary auto-fetch when DB is empty)
  const [discovering, setDiscovering] = useState(false);
  const [discoveryProgress, setDiscoveryProgress] = useState(null);

  // pulseMap: { [wordId]: { count, lastSignal } }
  const [pulseMap, setPulseMap] = useState({});
  const [recentSignals, setRecentSignals] = useState([]);
  const channelRef = useRef(null);
  const discoveryRef = useRef(false);

  // Fetch constellation data via RPC
  const fetchData = useCallback(async () => {
    if (!languageCode) return;
    setLoading(true);
    setError(null);
    discoveryRef.current = false;

    try {
      const { data: rpcResult, error: rpcError } = await supabase
        .rpc('get_constellation_data', { p_language_code: languageCode });

      if (rpcError) throw rpcError;
      if (rpcResult?.error) throw new Error(rpcResult.error);

      const adapted = adaptSupabaseData(rpcResult);

      if (adapted.vocabulary.length > 0) {
        setData(adapted);
        setDiscovering(false);
        setDiscoveryProgress(null);
      } else {
        // DB returned no words — trigger auto-discovery
        setData(null);
        startDiscovery(languageCode);
      }

      // Initialize pulse map from recent signals
      if (adapted.recentSignals?.length > 0) {
        const map = {};
        adapted.recentSignals.forEach(sig => {
          if (!map[sig.word_id]) {
            map[sig.word_id] = { count: 0, lastSignal: sig.detected_at };
          }
          map[sig.word_id].count++;
        });
        setPulseMap(map);
        setRecentSignals(adapted.recentSignals.slice(0, 5));
      }
    } catch (err) {
      console.error('Failed to load constellation data:', err);
      // Even on RPC error (e.g. language not in DB), try discovery
      setData(null);
      startDiscovery(languageCode);
    } finally {
      setLoading(false);
    }
  }, [languageCode]);

  // Auto-discover vocabulary from Wiktionary
  const startDiscovery = useCallback(async (langCode) => {
    // Guard against double-fire
    if (discoveryRef.current) return;
    discoveryRef.current = true;

    setDiscovering(true);
    setDiscoveryProgress({ fetched: 0, total: 0, words: [] });

    try {
      const result = await fetchQuickSample(langCode, (progress) => {
        // Stream partial results into the constellation as they arrive
        if (progress.words.length > 0) {
          setDiscoveryProgress(progress);
        }
      });

      if (result) {
        setData(result);
      }
    } catch (err) {
      console.error('Discovery failed:', err);
    } finally {
      setDiscovering(false);
    }
  }, []);

  // Subscribe to real-time usage signals
  useEffect(() => {
    if (!languageCode) return;

    const channel = supabase
      .channel(`signals:${languageCode}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'usage_signals',
          filter: `language_code=eq.${languageCode}`,
        },
        (payload) => {
          const signal = payload.new;

          // Update pulse map
          setPulseMap(prev => ({
            ...prev,
            [signal.word_id]: {
              count: (prev[signal.word_id]?.count || 0) + 1,
              lastSignal: signal.detected_at,
            },
          }));

          // Add to recent signals (keep last 5)
          setRecentSignals(prev => [
            {
              id: signal.id,
              word_id: signal.word_id,
              word: signal.source_title || 'word',
              signal_type: signal.signal_type,
              source_title: signal.source_title,
              detected_at: signal.detected_at,
            },
            ...prev,
          ].slice(0, 5));
        }
      )
      .subscribe((status) => {
        setIsLive(status === 'SUBSCRIBED');
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        setIsLive(false);
      }
    };
  }, [languageCode]);

  // Fetch on mount / language change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    discovering,
    discoveryProgress,
    pulseMap,
    recentSignals,
    isLive,
    refetch: fetchData,
  };
}
