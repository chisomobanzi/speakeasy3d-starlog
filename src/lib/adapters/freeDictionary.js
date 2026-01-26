/**
 * Free Dictionary API adapter
 * https://dictionaryapi.dev/
 * English only, CORS-friendly, no API key needed.
 */

const API_BASE = 'https://api.dictionaryapi.dev/api/v2/entries';

export async function searchFreeDictionary(query, language = 'en') {
  // Only supports English
  if (language !== 'en') return [];

  try {
    const res = await fetch(`${API_BASE}/${language}/${encodeURIComponent(query)}`);
    if (!res.ok) return [];

    const data = await res.json();
    if (!Array.isArray(data)) return [];

    const results = [];

    for (const entry of data) {
      if (results.length >= 5) break;

      const word = entry.word || query;
      const phonetic = entry.phonetic || entry.phonetics?.find(p => p.text)?.text || '';
      const audioUrl = entry.phonetics?.find(p => p.audio)?.audio || null;

      for (const meaning of entry.meanings || []) {
        if (results.length >= 5) break;

        const partOfSpeech = meaning.partOfSpeech || '';

        for (const def of meaning.definitions || []) {
          if (results.length >= 5) break;

          results.push({
            id: `freeDictionary:${word}:${results.length}`,
            word,
            phonetic: phonetic.replace(/^\/?/, '').replace(/\/?$/, ''), // strip surrounding slashes
            translation: def.definition || '',
            language,
            notes: def.synonyms?.length ? `Synonyms: ${def.synonyms.slice(0, 5).join(', ')}` : '',
            tags: partOfSpeech ? [partOfSpeech] : [],
            examples: def.example ? [def.example] : [],
            audio_url: audioUrl,
            source_type: 'freeDictionary',
            contributor_name: 'Free Dictionary API',
          });
        }
      }
    }

    return results;
  } catch {
    return [];
  }
}
