import { useState, useEffect, useRef } from 'react';
import { Play, Pause, AlertTriangle, Plus } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { Skeleton } from '../ui/LoadingSpinner';
import { fetchFullEntry } from '../../lib/adapters/fetchFullEntry';
import { BUILTIN_SOURCE_MAP } from '../../lib/builtinSources';
import { translateExamples } from '../../lib/translate';

export default function WordDetailModal({ isOpen, onClose, entry, onSaveToDeck }) {
  const [fullData, setFullData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [translations, setTranslations] = useState(new Map());
  const audioRef = useRef(null);

  const sourceId = entry?._sourceId || entry?.source_type;
  const source = BUILTIN_SOURCE_MAP.get(sourceId);
  const isExternal = source && !source.is_builtin;

  // Fetch full data when modal opens for external sources
  useEffect(() => {
    if (!isOpen || !entry) {
      setFullData(null);
      setFetchError(false);
      return;
    }

    if (!isExternal) return;

    let cancelled = false;
    setLoading(true);
    setFetchError(false);

    fetchFullEntry(sourceId, entry.word, entry.language || 'en')
      .then(data => {
        if (cancelled) return;
        if (data) {
          setFullData(data);
        } else {
          setFetchError(true);
        }
      })
      .catch(() => {
        if (!cancelled) setFetchError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [isOpen, entry, isExternal, sourceId]);

  // Translate example sentences when data loads (non-English only)
  useEffect(() => {
    if (!isOpen || !entry) {
      setTranslations(new Map());
      return;
    }

    const lang = entry.language || 'en';
    if (lang === 'en') return;

    // Collect all example strings from fullData or entry
    const examples = [];
    if (fullData?.meanings) {
      for (const m of fullData.meanings) {
        for (const d of m.definitions) {
          if (d.example) {
            // Split on " | " in case multiple examples are joined
            for (const ex of d.example.split(' | ')) {
              examples.push(ex.trim());
            }
          }
        }
      }
    }
    if (entry.examples) {
      for (const ex of entry.examples) {
        for (const part of ex.split(' | ')) {
          if (!examples.includes(part.trim())) {
            examples.push(part.trim());
          }
        }
      }
    }

    if (examples.length === 0) return;

    let cancelled = false;
    translateExamples(examples, lang).then(map => {
      if (!cancelled) setTranslations(map);
    });

    return () => { cancelled = true; };
  }, [isOpen, entry, fullData]);

  if (!entry) return null;

  const handlePlay = () => {
    const url = fullData?.audio_url || entry.audio_url;
    if (!url) return;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const audio = new Audio(url);
    audioRef.current = audio;
    setIsPlaying(true);
    audio.play().catch(() => {});
    audio.onended = () => setIsPlaying(false);
    audio.onerror = () => setIsPlaying(false);
  };

  const handleSave = () => {
    if (!onSaveToDeck) return;

    // Enrich entry with full data before saving
    let enriched = { ...entry };

    if (fullData?.meanings?.length) {
      // Collect all POS tags
      const allTags = [...new Set(fullData.meanings.map(m => m.partOfSpeech).filter(Boolean))];
      // Collect examples from all definitions
      const allExamples = fullData.meanings.flatMap(m =>
        m.definitions.map(d => d.example).filter(Boolean)
      ).slice(0, 5);
      // Collect synonyms as notes
      const allSynonyms = [...new Set(
        fullData.meanings.flatMap(m =>
          m.definitions.flatMap(d => d.synonyms || [])
        )
      )].slice(0, 10);

      enriched = {
        ...enriched,
        tags: allTags.length > 0 ? allTags : enriched.tags,
        examples: allExamples.length > 0 ? allExamples : enriched.examples,
        phonetic: fullData.phonetic || enriched.phonetic,
        audio_url: fullData.audio_url || enriched.audio_url,
        notes: allSynonyms.length > 0
          ? `Synonyms: ${allSynonyms.join(', ')}`
          : enriched.notes,
      };
    }

    onSaveToDeck(enriched);
  };

  const handleSaveExample = (exampleText, translationText) => {
    if (!onSaveToDeck) return;
    onSaveToDeck({
      word: exampleText,
      translation: translationText || '',
      language: entry.language,
      source_type: entry._sourceId || entry.source_type,
      contributor_name: entry.contributor_name,
    });
  };

  const audioUrl = fullData?.audio_url || entry.audio_url;
  const phonetic = fullData?.phonetic || entry.phonetic;

  const renderSourceBadge = () => {
    if (!source) return null;
    return (
      <span
        className="px-2 py-0.5 text-xs rounded-full font-medium"
        style={{ backgroundColor: `${source.core_color}20`, color: source.core_color }}
      >
        {source.short_name}
      </span>
    );
  };

  const renderHeader = () => (
    <div className="flex items-center gap-3 flex-wrap">
      <h2 className="text-2xl font-bold text-white">{entry.word}</h2>
      {phonetic && (
        <span className="text-slate-400 text-lg">/{phonetic}/</span>
      )}
      {audioUrl && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePlay}
          className="text-slate-400 hover:text-starlog-400"
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </Button>
      )}
      {renderSourceBadge()}
    </div>
  );

  const renderExternalBody = () => {
    if (loading) {
      return (
        <div className="space-y-4">
          <Skeleton className="w-20 h-5" />
          <Skeleton className="w-full h-4" />
          <Skeleton className="w-3/4 h-4" />
          <Skeleton className="w-20 h-5 mt-4" />
          <Skeleton className="w-full h-4" />
          <Skeleton className="w-2/3 h-4" />
        </div>
      );
    }

    if (fetchError && !fullData) {
      return (
        <>
          <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-400 text-sm">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            Could not load full details. Showing summary.
          </div>
          {renderFallbackBody()}
        </>
      );
    }

    if (!fullData) return renderFallbackBody();

    return (
      <div className="space-y-5">
        {fullData.inflectionNote && (
          <div className="px-3 py-2 bg-slate-800/60 border border-slate-700/50 rounded-lg text-sm text-slate-400">
            <span className="text-slate-500">Form:</span>{' '}
            {fullData.inflectionNote}
            {fullData.rootWord && (
              <span className="text-slate-500"> — showing definitions for <span className="text-slate-300 font-medium">{fullData.rootWord}</span></span>
            )}
          </div>
        )}
        {fullData.meanings.map((meaning, mIdx) => (
          <div key={mIdx}>
            <h4 className="text-sm font-semibold text-starlog-400 uppercase tracking-wide mb-2">
              {meaning.partOfSpeech}
            </h4>
            <ol className="space-y-3 list-decimal list-inside">
              {meaning.definitions.map((def, dIdx) => (
                <li key={dIdx} className="text-slate-300 text-sm">
                  <span>{def.definition}</span>
                  {def.example && def.example.split(' | ').map((ex, exIdx) => {
                    const trimmed = ex.trim();
                    const trans = translations.get(trimmed);
                    return (
                      <div key={exIdx} className="mt-1 ml-5 flex items-start gap-1.5 group">
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-500 italic text-xs">
                            &ldquo;{trimmed}&rdquo;
                          </p>
                          {trans && (
                            <p className="text-slate-600 text-xs mt-0.5">
                              {trans}
                            </p>
                          )}
                        </div>
                        {onSaveToDeck && (
                          <button
                            onClick={() => handleSaveExample(trimmed, trans)}
                            className="flex-shrink-0 mt-0.5 p-0.5 rounded text-slate-600 hover:text-starlog-400 hover:bg-starlog-400/10 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Save example to deck"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {def.synonyms?.length > 0 && (
                    <p className="mt-1 ml-5 text-xs text-slate-500">
                      <span className="text-slate-400">Synonyms:</span>{' '}
                      {def.synonyms.slice(0, 6).join(', ')}
                    </p>
                  )}
                  {def.antonyms?.length > 0 && (
                    <p className="mt-1 ml-5 text-xs text-slate-500">
                      <span className="text-slate-400">Antonyms:</span>{' '}
                      {def.antonyms.slice(0, 6).join(', ')}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    );
  };

  const renderFallbackBody = () => (
    <div className="space-y-3">
      {entry.tags?.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {entry.tags.map(tag => (
            <Badge key={tag} size="sm">{tag}</Badge>
          ))}
        </div>
      )}
      {entry.translation && (
        <p className="text-slate-300">{entry.translation}</p>
      )}
      {entry.examples?.length > 0 && (
        <div className="space-y-1">
          {entry.examples.flatMap((ex, i) =>
            ex.split(' | ').map((part, j) => {
              const trimmed = part.trim();
              const trans = translations.get(trimmed);
              return (
                <div key={`${i}-${j}`} className="flex items-start gap-1.5 group">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-500 italic">&ldquo;{trimmed}&rdquo;</p>
                    {trans && (
                      <p className="text-slate-600 text-xs mt-0.5">{trans}</p>
                    )}
                  </div>
                  {onSaveToDeck && (
                    <button
                      onClick={() => handleSaveExample(trimmed, trans)}
                      className="flex-shrink-0 mt-0.5 p-0.5 rounded text-slate-600 hover:text-starlog-400 hover:bg-starlog-400/10 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Save example to deck"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
      {entry.notes && (
        <p className="text-sm text-slate-400">{entry.notes}</p>
      )}
    </div>
  );

  const renderBuiltInBody = () => (
    <div className="space-y-4">
      {entry.translation && (
        <div>
          <span className="text-xs text-slate-500 uppercase tracking-wide">Translation</span>
          <p className="text-starlog-400 font-medium mt-1">{entry.translation}</p>
        </div>
      )}

      {entry.tags?.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {entry.tags.map(tag => (
            <Badge key={tag} size="sm">{tag}</Badge>
          ))}
        </div>
      )}

      {entry.examples?.length > 0 && (
        <div>
          <span className="text-xs text-slate-500 uppercase tracking-wide">Examples</span>
          <div className="mt-1 space-y-1">
            {entry.examples.flatMap((ex, i) =>
              ex.split(' | ').map((part, j) => {
                const trimmed = part.trim();
                const trans = translations.get(trimmed);
                return (
                  <div key={`${i}-${j}`} className="flex items-start gap-1.5 group">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-400 italic">&ldquo;{trimmed}&rdquo;</p>
                      {trans && (
                        <p className="text-slate-600 text-xs mt-0.5">{trans}</p>
                      )}
                    </div>
                    {onSaveToDeck && (
                      <button
                        onClick={() => handleSaveExample(trimmed, trans)}
                        className="flex-shrink-0 mt-0.5 p-0.5 rounded text-slate-600 hover:text-starlog-400 hover:bg-starlog-400/10 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Save example to deck"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {entry.notes && (
        <div>
          <span className="text-xs text-slate-500 uppercase tracking-wide">Notes</span>
          <p className="text-sm text-slate-300 mt-1">{entry.notes}</p>
        </div>
      )}

      {/* Mastery bar */}
      {entry.srs_state === 'active' && (
        <div>
          <span className="text-xs text-slate-500 uppercase tracking-wide">Mastery</span>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.round((entry.mastery_level || 0) * 100)}%`,
                  backgroundColor: entry.mastery_level >= 0.8 ? '#10b981'
                    : entry.mastery_level >= 0.5 ? '#eab308'
                    : entry.mastery_level >= 0.25 ? '#f97316'
                    : '#64748b',
                }}
              />
            </div>
            <span className="text-sm text-slate-400">
              {Math.round((entry.mastery_level || 0) * 100)}%
            </span>
          </div>
        </div>
      )}

      {/* Deck name */}
      {entry.decks?.name && (
        <div>
          <span className="text-xs text-slate-500 uppercase tracking-wide">Deck</span>
          <p className="mt-1">
            <Badge variant="primary" size="sm">{entry.decks.name}</Badge>
          </p>
        </div>
      )}

      {/* Attribution */}
      {entry.contributor_name && (
        <div className="pt-3 border-t border-white/10 text-xs text-slate-500">
          Learned from {entry.contributor_name}
          {entry.contributor_location && ` (${entry.contributor_location})`}
        </div>
      )}
    </div>
  );

  const footer = (
    <>
      {isExternal && onSaveToDeck && (
        <Button variant="primary" onClick={handleSave} icon={Plus}>
          Save to Deck
        </Button>
      )}
      <Button variant="ghost" onClick={onClose}>
        Close
      </Button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" footer={footer}>
      <div className="space-y-4">
        {renderHeader()}
        {isExternal ? renderExternalBody() : renderBuiltInBody()}
      </div>
    </Modal>
  );
}
