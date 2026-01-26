import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Globe,
  ArrowRight,
  ArrowLeft,
  Loader,
  Search,
  ChevronDown,
  X,
} from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import { useDecks } from '../hooks/useDecks';
import { useEntries } from '../hooks/useEntries';
import { useToast } from '../components/ui/Toast';

// Supported languages
const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'sn', name: 'Shona', flag: '🇿🇼' },
  { code: 'zh', name: 'Mandarin Chinese', flag: '🇨🇳' },
  { code: 'zh-TW', name: 'Taiwanese Mandarin', flag: '🇹🇼' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
  { code: 'sw', name: 'Swahili', flag: '🇰🇪' },
  { code: 'vi', name: 'Vietnamese', flag: '🇻🇳' },
  { code: 'th', name: 'Thai', flag: '🇹🇭' },
  { code: 'id', name: 'Indonesian', flag: '🇮🇩' },
  { code: 'tr', name: 'Turkish', flag: '🇹🇷' },
  { code: 'pl', name: 'Polish', flag: '🇵🇱' },
  { code: 'nl', name: 'Dutch', flag: '🇳🇱' },
];

const INDIGENOUS_LANGUAGES = [
  { code: 'ami', name: 'Amis (阿美語)', flag: '🏝️' },
  { code: 'tay', name: 'Atayal (泰雅語)', flag: '🏔️' },
  { code: 'pwn', name: 'Paiwan (排灣語)', flag: '🌺' },
];

const COLOR_OPTIONS = [
  '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6',
  '#ec4899', '#f43f5e', '#f97316', '#eab308',
];

export default function ImportPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { success, error } = useToast();
  const { decks, createDeck } = useDecks();
  const { createEntry } = useEntries();
  const fileInputRef = useRef(null);

  // Pre-select deck from query param (e.g. /import?deck=mock-deck-1)
  const preselectedDeckId = searchParams.get('deck');
  useEffect(() => {
    if (preselectedDeckId && decks.some(d => d.id === preselectedDeckId)) {
      setImportMode('existing');
      setSelectedDeckId(preselectedDeckId);
    }
  }, [preselectedDeckId, decks]);

  // Step state: 'input' | 'preview' | 'importing' | 'success'
  const [step, setStep] = useState('input');

  // Import mode: 'new' (create new deck) or 'existing' (add to existing deck)
  const [importMode, setImportMode] = useState('new');
  const [selectedDeckId, setSelectedDeckId] = useState('');

  // Form data
  const [deckName, setDeckName] = useState('');
  const [deckColor, setDeckColor] = useState('#10b981');
  const [nativeLanguage, setNativeLanguage] = useState('en');
  const [targetLanguage, setTargetLanguage] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);

  // Parsed data
  const [parsedWords, setParsedWords] = useState([]);
  const [parseError, setParseError] = useState('');

  // Import progress
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [createdDeckId, setCreatedDeckId] = useState(null);

  const getLanguageInfo = (code) => {
    return [...SUPPORTED_LANGUAGES, ...INDIGENOUS_LANGUAGES].find(l => l.code === code) || { name: code, flag: '🌐' };
  };

  // Parse CSV line handling quoted values
  const parseCSVLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  // Parse CSV text to words array
  const parseCSV = (text) => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) throw new Error('CSV must have at least a header and one row');

    const header = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
    const wordIndex = header.findIndex(h => h === 'word' || h === 'front');
    const translationIndex = header.findIndex(h => h === 'translation' || h === 'back' || h === 'meaning');
    const phoneticIndex = header.findIndex(h => h === 'phonetic' || h === 'pronunciation' || h === 'pinyin');
    const notesIndex = header.findIndex(h => h === 'notes' || h === 'note');
    const tagsIndex = header.findIndex(h => h === 'tags' || h === 'tag');
    const masteryIndex = header.findIndex(h => h === 'mastery' || h === 'mastery_level');
    const streakIndex = header.findIndex(h => h === 'streak');
    const reviewCountIndex = header.findIndex(h => h === 'review_count' || h === 'reviews');

    if (wordIndex === -1) throw new Error('CSV must have a "Word" or "Front" column');

    const words = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = parseCSVLine(lines[i]);
      if (cols[wordIndex] && cols[wordIndex].trim()) {
        const mastery = masteryIndex >= 0 ? parseFloat(cols[masteryIndex]) : NaN;
        const streak = streakIndex >= 0 ? parseInt(cols[streakIndex], 10) : NaN;
        const reviewCount = reviewCountIndex >= 0 ? parseInt(cols[reviewCountIndex], 10) : NaN;
        const tagsRaw = tagsIndex >= 0 ? (cols[tagsIndex] || '').trim() : '';

        words.push({
          word: cols[wordIndex].trim(),
          translation: translationIndex >= 0 ? (cols[translationIndex] || '').trim() : '',
          phonetic: phoneticIndex >= 0 ? (cols[phoneticIndex] || '').trim() : '',
          notes: notesIndex >= 0 ? (cols[notesIndex] || '').trim() : '',
          tags: tagsRaw ? tagsRaw.split(/[;|]/).map(t => t.trim()).filter(Boolean) : [],
          // SRS fields - NaN means not provided, will default to zero
          mastery_level: isNaN(mastery) ? 0 : Math.max(0, Math.min(1, mastery)),
          streak: isNaN(streak) ? 0 : Math.max(0, streak),
          review_count: isNaN(reviewCount) ? 0 : Math.max(0, reviewCount),
          _hasMastery: !isNaN(mastery) || !isNaN(streak) || !isNaN(reviewCount),
        });
      }
    }

    return words;
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadedFile(file);
    setParseError('');

    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
    if (!deckName) {
      setDeckName(nameWithoutExt);
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setPastedText(event.target.result);
    };
    reader.readAsText(file);
  };

  const handleParse = () => {
    if (importMode === 'new' && !targetLanguage) {
      setParseError('Please select the language you are learning');
      return;
    }

    if (importMode === 'existing' && !selectedDeckId) {
      setParseError('Please select a deck to import into');
      return;
    }

    if (!pastedText.trim()) {
      setParseError('Please upload a file or paste CSV content');
      return;
    }

    try {
      const words = parseCSV(pastedText);
      if (words.length === 0) {
        throw new Error('No valid words found in CSV');
      }
      setParsedWords(words);
      setParseError('');
      setStep('preview');
    } catch (err) {
      setParseError(err.message);
    }
  };

  const handleImport = async () => {
    if (importMode === 'new' && !deckName.trim()) {
      error('Please enter a deck name');
      return;
    }

    setStep('importing');
    setImportProgress({ current: 0, total: parsedWords.length });

    try {
      let deckId;
      let lang;

      if (importMode === 'existing') {
        // Import into existing deck
        deckId = selectedDeckId;
        const existingDeck = decks.find(d => d.id === selectedDeckId);
        lang = existingDeck?.target_language || targetLanguage || 'und';
        setCreatedDeckId(deckId);
      } else {
        // Create a new deck
        const { data: newDeck, error: deckError } = await createDeck({
          name: deckName.trim(),
          target_language: targetLanguage,
          color: deckColor,
          description: `Imported ${parsedWords.length} words from CSV`,
        });

        if (deckError) {
          throw new Error('Failed to create deck');
        }

        deckId = newDeck.id;
        lang = targetLanguage;
        setCreatedDeckId(deckId);
      }

      // Create entries for each word
      const hasMasteryData = parsedWords.some(w => w._hasMastery);

      for (let i = 0; i < parsedWords.length; i++) {
        const word = parsedWords[i];

        const entryData = {
          deck_id: deckId,
          word: word.word,
          translation: word.translation,
          phonetic: word.phonetic,
          notes: word.notes,
          language: lang,
          source_type: 'import',
          tags: word.tags?.length > 0 ? word.tags : undefined,
        };

        // Include mastery data if provided
        if (word._hasMastery) {
          entryData.mastery_level = word.mastery_level;
          entryData.streak = word.streak;
          entryData.review_count = word.review_count;
          entryData.srs_state = word.mastery_level >= 0.8 ? 'active' : word.review_count > 0 ? 'active' : 'new';
        }

        await createEntry(entryData);

        setImportProgress({ current: i + 1, total: parsedWords.length });
      }

      const deckLabel = importMode === 'existing'
        ? decks.find(d => d.id === selectedDeckId)?.name || 'deck'
        : deckName;

      setStep('success');
      success(`Imported ${parsedWords.length} words into "${deckLabel}"!`);
    } catch (err) {
      setParseError(err.message || 'Import failed');
      setStep('preview');
      error('Import failed. Please try again.');
    }
  };

  const reset = () => {
    setStep('input');
    setImportMode('new');
    setSelectedDeckId('');
    setDeckName('');
    setDeckColor('#10b981');
    setTargetLanguage('');
    setPastedText('');
    setUploadedFile(null);
    setParsedWords([]);
    setParseError('');
    setCreatedDeckId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Combine all languages for search
  const ALL_LANGUAGES = [...SUPPORTED_LANGUAGES, ...INDIGENOUS_LANGUAGES];

  // Searchable language selector component
  const LanguageSearchSelect = ({ value, onChange, label, placeholder, excludeCode }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const dropdownRef = useRef(null);
    const inputRef = useRef(null);

    const selectedLang = ALL_LANGUAGES.find(l => l.code === value);

    // Filter languages based on search
    const filteredLanguages = ALL_LANGUAGES.filter(lang => {
      if (lang.code === excludeCode) return false;
      const searchLower = search.toLowerCase();
      return (
        lang.name.toLowerCase().includes(searchLower) ||
        lang.code.toLowerCase().includes(searchLower)
      );
    });

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (e) => {
        if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
          setIsOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (code) => {
      onChange(code);
      setIsOpen(false);
      setSearch('');
    };

    return (
      <div className={`space-y-2 ${isOpen ? 'relative z-50' : ''}`}>
        <label className="block text-sm font-medium text-slate-300">{label}</label>
        <div className="relative" ref={dropdownRef}>
          {/* Selected value / trigger */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(!isOpen);
              setTimeout(() => inputRef.current?.focus(), 50);
            }}
            className={`
              w-full flex items-center justify-between gap-2 px-4 py-3 rounded-lg border-2 transition-all text-left
              ${isOpen
                ? 'border-cyan-500 bg-slate-800'
                : value
                  ? 'border-slate-600 bg-slate-800/50'
                  : 'border-slate-700 bg-slate-800/50'
              }
            `}
          >
            {selectedLang ? (
              <div className="flex items-center gap-3">
                <span className="text-2xl">{selectedLang.flag}</span>
                <div>
                  <span className="text-white font-medium">{selectedLang.name}</span>
                  <span className="text-slate-500 ml-2 text-sm">({selectedLang.code})</span>
                </div>
              </div>
            ) : (
              <span className="text-slate-500">{placeholder}</span>
            )}
            <ChevronDown
              size={20}
              className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Dropdown */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="absolute z-[100] w-full mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden"
              >
                {/* Search input */}
                <div className="p-2 border-b border-slate-700">
                  <div className="relative">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      ref={inputRef}
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search languages..."
                      className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                    {search && (
                      <button
                        type="button"
                        onClick={() => setSearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Language list */}
                <div className="max-h-64 overflow-y-auto">
                  {filteredLanguages.length === 0 ? (
                    <div className="p-4 text-center text-slate-500">
                      No languages found
                    </div>
                  ) : (
                    filteredLanguages.map((lang) => (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => handleSelect(lang.code)}
                        className={`
                          w-full flex items-center gap-3 px-4 py-3 text-left transition-colors
                          ${value === lang.code
                            ? 'bg-cyan-500/20 text-cyan-400'
                            : 'hover:bg-slate-700/50 text-slate-300'
                          }
                        `}
                      >
                        <span className="text-xl">{lang.flag}</span>
                        <div className="flex-1">
                          <span className="font-medium">{lang.name}</span>
                          <span className="text-slate-500 ml-2 text-sm">({lang.code})</span>
                        </div>
                        {value === lang.code && (
                          <CheckCircle size={18} className="text-cyan-400" />
                        )}
                      </button>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">Import Words</h1>
          <p className="text-slate-400 text-sm">Upload a CSV file to a new or existing deck</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Input */}
        {step === 'input' && (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Import Mode Toggle */}
            <Card className="p-6">
              <h2 className="text-lg font-bold text-white mb-4">Import to...</h2>
              <div className="flex gap-3">
                <button
                  onClick={() => { setImportMode('new'); setSelectedDeckId(''); }}
                  className={`flex-1 p-4 rounded-lg border-2 transition-all text-left ${
                    importMode === 'new'
                      ? 'border-cyan-500 bg-cyan-500/10'
                      : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                  }`}
                >
                  <Plus size={20} className={importMode === 'new' ? 'text-cyan-400' : 'text-slate-500'} />
                  <p className={`font-medium mt-2 ${importMode === 'new' ? 'text-white' : 'text-slate-300'}`}>
                    New Deck
                  </p>
                  <p className="text-sm text-slate-500 mt-1">Create a new deck with imported words</p>
                </button>
                <button
                  onClick={() => setImportMode('existing')}
                  className={`flex-1 p-4 rounded-lg border-2 transition-all text-left ${
                    importMode === 'existing'
                      ? 'border-cyan-500 bg-cyan-500/10'
                      : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                  }`}
                >
                  <FileText size={20} className={importMode === 'existing' ? 'text-cyan-400' : 'text-slate-500'} />
                  <p className={`font-medium mt-2 ${importMode === 'existing' ? 'text-white' : 'text-slate-300'}`}>
                    Existing Deck
                  </p>
                  <p className="text-sm text-slate-500 mt-1">Add words to a deck you already have</p>
                </button>
              </div>

              {/* Existing deck selector */}
              {importMode === 'existing' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4"
                >
                  <label className="block text-sm font-medium text-slate-300 mb-2">Select deck</label>
                  {decks.length === 0 ? (
                    <p className="text-slate-500 text-sm">No decks yet. Create one first or switch to "New Deck".</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {decks.map(d => (
                        <button
                          key={d.id}
                          onClick={() => setSelectedDeckId(d.id)}
                          className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                            selectedDeckId === d.id
                              ? 'border-cyan-500 bg-cyan-500/10'
                              : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                          }`}
                        >
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: d.color || '#10b981' }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium truncate">{d.name}</p>
                            <p className="text-xs text-slate-500">
                              {d.word_count || 0} words
                              {d.target_language ? ` \u00b7 ${d.target_language.toUpperCase()}` : ''}
                            </p>
                          </div>
                          {selectedDeckId === d.id && (
                            <CheckCircle size={18} className="text-cyan-400 flex-shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </Card>

            {/* Language Selection & Deck Config - only for new decks */}
            {importMode === 'new' && (<>
            <Card className="p-6 relative z-20">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-10 h-10 bg-purple-500/20 border border-purple-500/50 rounded-lg flex items-center justify-center">
                  <Globe size={20} className="text-purple-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Language Pair</h2>
                  <p className="text-slate-400 text-sm">Select what you speak and what you're learning</p>
                </div>
              </div>

              {/* Language selectors in a grid */}
              <div className="grid sm:grid-cols-2 gap-4">
                {/* Native Language */}
                <LanguageSearchSelect
                  value={nativeLanguage}
                  onChange={setNativeLanguage}
                  label="I speak..."
                  placeholder="Select your native language"
                  excludeCode={targetLanguage}
                />

                {/* Target Language */}
                <LanguageSearchSelect
                  value={targetLanguage}
                  onChange={setTargetLanguage}
                  label="I'm learning..."
                  placeholder="Select target language"
                  excludeCode={nativeLanguage}
                />
              </div>

              {/* Language Pair Summary */}
              {nativeLanguage && targetLanguage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-4 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-cyan-500/30 rounded-lg"
                >
                  <div className="flex items-center justify-center gap-4 text-lg">
                    <span className="text-slate-300">
                      {getLanguageInfo(nativeLanguage).flag} {getLanguageInfo(nativeLanguage).name}
                    </span>
                    <ArrowRight className="text-cyan-400" />
                    <span className="text-cyan-400 font-bold">
                      {getLanguageInfo(targetLanguage).flag} {getLanguageInfo(targetLanguage).name}
                    </span>
                  </div>
                </motion.div>
              )}
            </Card>

            {/* Deck Name & Color */}
            <Card className="p-6">
              <Input
                label="Deck Name"
                placeholder="My Vocabulary Deck"
                value={deckName}
                onChange={(e) => setDeckName(e.target.value)}
              />

              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Color
                </label>
                <div className="flex gap-2">
                  {COLOR_OPTIONS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setDeckColor(color)}
                      className={`
                        w-8 h-8 rounded-full transition-transform
                        ${deckColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110' : ''}
                      `}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </Card>
            </>)}

            {/* Upload Area */}
            <Card className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-10 h-10 bg-cyan-500/20 border border-cyan-500/50 rounded-lg flex items-center justify-center">
                  <Upload size={20} className="text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Upload CSV File</h2>
                  <p className="text-slate-400 text-sm">
                    Required: "Word" column. Optional: "Translation", "Phonetic", "Notes"
                  </p>
                </div>
              </div>

              <label className="block cursor-pointer">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center hover:border-cyan-500/50 transition-all">
                  {uploadedFile ? (
                    <div className="flex items-center justify-center gap-3">
                      <FileText size={24} className="text-cyan-400" />
                      <span className="text-cyan-400 font-medium">{uploadedFile.name}</span>
                      <CheckCircle size={20} className="text-green-400" />
                    </div>
                  ) : (
                    <div>
                      <Upload size={40} className="text-slate-600 mx-auto mb-4" />
                      <p className="text-slate-400">Click to upload or drag and drop</p>
                      <p className="text-slate-600 text-sm mt-2">CSV files only</p>
                    </div>
                  )}
                </div>
              </label>
            </Card>

            {/* OR Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-slate-900 px-4 text-slate-500 font-medium">OR</span>
              </div>
            </div>

            {/* Paste Area */}
            <Card className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-10 h-10 bg-purple-500/20 border border-purple-500/50 rounded-lg flex items-center justify-center">
                  <FileText size={20} className="text-purple-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Paste CSV Data</h2>
                  <p className="text-slate-400 text-sm">Paste CSV text directly (include header row)</p>
                </div>
              </div>

              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder={`Word,Translation,Phonetic\n你好,hello,nǐ hǎo\n谢谢,thank you,xiè xiè`}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-white font-mono text-sm min-h-[150px] focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
              />
            </Card>

            {/* Error Display */}
            {parseError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg"
              >
                <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-400">{parseError}</p>
              </motion.div>
            )}

            {/* Parse Button */}
            {(pastedText || uploadedFile) && (
              <Button
                variant="primary"
                className="w-full"
                onClick={handleParse}
                disabled={importMode === 'new' ? !targetLanguage : !selectedDeckId}
              >
                {importMode === 'new' && !targetLanguage ? (
                  <>
                    <Globe size={20} />
                    Select target language first
                  </>
                ) : importMode === 'existing' && !selectedDeckId ? (
                  <>
                    <FileText size={20} />
                    Select a deck first
                  </>
                ) : importMode === 'existing' ? (
                  <>
                    <CheckCircle size={20} />
                    Parse &amp; Add to {decks.find(d => d.id === selectedDeckId)?.name || 'Deck'}
                  </>
                ) : (
                  <>
                    <CheckCircle size={20} />
                    Parse {getLanguageInfo(nativeLanguage).flag} → {getLanguageInfo(targetLanguage).flag} Deck
                  </>
                )}
              </Button>
            )}
          </motion.div>
        )}

        {/* Step 2: Preview */}
        {step === 'preview' && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <Card className="p-6 border-green-500/30">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-10 h-10 bg-green-500/20 border border-green-500/50 rounded-lg flex items-center justify-center">
                  <CheckCircle size={20} className="text-green-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {importMode === 'existing'
                      ? decks.find(d => d.id === selectedDeckId)?.name || 'Selected Deck'
                      : deckName || 'New Deck'
                    }
                  </h3>
                  <p className="text-slate-400">
                    {importMode === 'existing'
                      ? `Adding ${parsedWords.length} words to existing deck`
                      : `${getLanguageInfo(nativeLanguage).flag} → ${getLanguageInfo(targetLanguage).flag} • ${parsedWords.length} words`
                    }
                  </p>
                  {parsedWords.some(w => w._hasMastery) && (
                    <p className="text-green-400 text-sm mt-1">
                      Mastery data detected — progress will be imported
                    </p>
                  )}
                </div>
              </div>

              {/* Word Preview */}
              <div className="bg-slate-800/50 rounded-lg p-4 mb-6 max-h-64 overflow-y-auto">
                {parsedWords.slice(0, 10).map((word, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-slate-700 last:border-0">
                    <div className="flex-1">
                      <span className="text-white font-medium">{word.word}</span>
                      {word.phonetic && (
                        <span className="text-slate-500 ml-2 text-sm">/{word.phonetic}/</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {word._hasMastery && (
                        <span className="text-xs text-slate-500">
                          {Math.round(word.mastery_level * 100)}%
                        </span>
                      )}
                      {word.translation && (
                        <span className="text-cyan-400 text-sm">{word.translation}</span>
                      )}
                    </div>
                  </div>
                ))}
                {parsedWords.length > 10 && (
                  <p className="text-slate-500 text-sm text-center py-2">
                    ... and {parsedWords.length - 10} more words
                  </p>
                )}
              </div>

              {/* Deck Name Input - only for new decks */}
              {importMode === 'new' && (
                <>
                  <Input
                    label="Deck Name"
                    value={deckName}
                    onChange={(e) => setDeckName(e.target.value)}
                    placeholder="Enter deck name"
                    className="mb-4"
                  />

                  {/* Color Selection */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Color
                    </label>
                    <div className="flex gap-2">
                      {COLOR_OPTIONS.map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setDeckColor(color)}
                          className={`
                            w-8 h-8 rounded-full transition-transform
                            ${deckColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110' : ''}
                          `}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => setStep('input')} className="flex-1">
                  <ArrowLeft size={18} />
                  Back
                </Button>
                <Button variant="primary" onClick={handleImport} className="flex-1">
                  Import {parsedWords.length} Words
                  <ArrowRight size={18} />
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Step 3: Importing */}
        {step === 'importing' && (
          <motion.div
            key="importing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <Card className="p-12">
              <Loader size={48} className="text-cyan-400 mx-auto mb-6 animate-spin" />
              <h2 className="text-2xl font-bold text-white mb-3">Importing...</h2>
              <p className="text-slate-400 mb-6">
                Adding words to your deck
              </p>

              {/* Progress bar */}
              <div className="max-w-md mx-auto">
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-cyan-500"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${(importProgress.current / importProgress.total) * 100}%`
                    }}
                  />
                </div>
                <p className="text-slate-500 text-sm mt-2">
                  {importProgress.current} / {importProgress.total} words
                </p>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Step 4: Success */}
        {step === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card className="p-8 border-green-500/30 text-center">
              <div className="w-16 h-16 bg-green-500/20 border border-green-500/50 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={32} className="text-green-400" />
              </div>

              <h2 className="text-2xl font-bold text-white mb-2">Import Complete!</h2>
              <p className="text-slate-400 mb-8">
                Successfully imported {parsedWords.length} words to "{deckName}"
              </p>

              <div className="flex gap-3 justify-center">
                <Button variant="ghost" onClick={reset}>
                  Import Another
                </Button>
                <Button
                  variant="primary"
                  onClick={() => navigate(`/decks/${createdDeckId}`)}
                >
                  View Deck
                  <ArrowRight size={18} />
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CSV Format Guide */}
      {step === 'input' && (
        <Card className="p-6 bg-slate-800/30">
          <h3 className="text-lg font-bold text-cyan-400 mb-4">CSV Format Guide</h3>

          <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm overflow-x-auto mb-4">
            <pre className="text-slate-300">
{`Word,Translation,Phonetic,Tags,Mastery,Streak
你好,hello,nǐ hǎo,greeting|essential,0.9,8
谢谢,thank you,xiè xiè,greeting,0.6,3
再见,goodbye,zài jiàn,greeting,,`}
            </pre>
          </div>

          <ul className="space-y-2 text-slate-400 text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
              <span><strong className="text-white">Word</strong> column is required (target language)</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
              <span><strong className="text-white">Translation</strong>, <strong className="text-white">Phonetic</strong>, <strong className="text-white">Notes</strong> are optional</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
              <span><strong className="text-white">Tags</strong> column is optional (separate with <code className="text-cyan-400">|</code> or <code className="text-cyan-400">;</code>)</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
              <span><strong className="text-white">Mastery</strong>, <strong className="text-white">Streak</strong>, <strong className="text-white">Review_Count</strong> are optional (blank = start from zero)</span>
            </li>
          </ul>
        </Card>
      )}
    </div>
  );
}
