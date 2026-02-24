import { useState, useRef, useCallback } from 'react';
import { Trash2, X } from 'lucide-react';
import { ConfirmDialog } from '../ui/Modal';

const COLUMNS = [
  { key: 'word', label: 'Word', width: '180px', required: true },
  { key: 'phonetic', label: 'Phonetic', width: '140px' },
  { key: 'translation', label: 'Translation', width: '220px', required: true },
  { key: 'notes', label: 'Notes' },
  { key: 'tags', label: 'Tags', width: '140px' },
];
const COL_KEYS = COLUMNS.map(c => c.key);

function parseTags(str) {
  if (!str) return [];
  return str.split(',').map(s => s.trim()).filter(Boolean);
}

function formatTags(tags) {
  if (!Array.isArray(tags)) return '';
  return tags.join(', ');
}

function masteryColor(level) {
  if (level >= 0.8) return '#4ade80';
  if (level >= 0.4) return '#facc15';
  return 'rgba(255,255,255,0.25)';
}

const EMPTY_DRAFT = { word: '', phonetic: '', translation: '', notes: '', tags: '' };

export default function DeckSpreadsheet({ entries, deck, onCreateEntry, onUpdateEntry, onDeleteEntry, deckId, toast, className = '' }) {
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState({});
  const [newDraft, setNewDraft] = useState({ ...EMPTY_DRAFT });
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [saving, setSaving] = useState(false);

  const refs = useRef({});
  const deckColor = deck?.color || '#06b6d4';

  // ── Ref helpers ──
  const setRef = useCallback((key) => (el) => {
    if (el) refs.current[key] = el;
    else delete refs.current[key];
  }, []);

  const focusCell = useCallback((key) => {
    requestAnimationFrame(() => {
      const el = refs.current[key];
      if (el) { el.focus(); el.select?.(); }
    });
  }, []);

  // ── Selection ──
  const toggleSelect = useCallback((id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds(prev =>
      prev.size === entries.length ? new Set() : new Set(entries.map(e => e.id))
    );
  }, [entries]);

  // ── Edit existing row ──
  const startEdit = useCallback((entry, colKey = 'word') => {
    setEditingId(entry.id);
    setEditDraft({
      word: entry.word || '',
      phonetic: entry.phonetic || '',
      translation: entry.translation || '',
      notes: entry.notes || '',
      tags: formatTags(entry.tags),
    });
    focusCell(`${entry.id}-${colKey}`);
  }, [focusCell]);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditDraft({});
  }, []);

  const saveEdit = useCallback(async () => {
    if (!editingId) return false;
    if (!editDraft.word?.trim() || !editDraft.translation?.trim()) {
      toast?.error('Word and translation are required');
      return false;
    }
    setSaving(true);
    const { error } = await onUpdateEntry(editingId, {
      word: editDraft.word.trim(),
      phonetic: editDraft.phonetic.trim(),
      translation: editDraft.translation.trim(),
      notes: editDraft.notes.trim(),
      tags: parseTags(editDraft.tags),
    });
    setSaving(false);
    if (error) { toast?.error('Failed to save'); return false; }
    setEditingId(null);
    setEditDraft({});
    return true;
  }, [editingId, editDraft, onUpdateEntry, toast]);

  // ── New row ──
  const saveNewRow = useCallback(async () => {
    if (!newDraft.word?.trim() || !newDraft.translation?.trim()) {
      toast?.error('Word and translation are required');
      return false;
    }
    setSaving(true);
    const { error } = await onCreateEntry({
      deck_id: deckId,
      word: newDraft.word.trim(),
      phonetic: newDraft.phonetic.trim(),
      translation: newDraft.translation.trim(),
      language: deck?.target_language || 'en',
      notes: newDraft.notes.trim(),
      tags: parseTags(newDraft.tags),
    });
    setSaving(false);
    if (error) { toast?.error('Failed to create entry'); return false; }
    setNewDraft({ ...EMPTY_DRAFT });
    focusCell('new-word');
    return true;
  }, [newDraft, onCreateEntry, deckId, deck, toast, focusCell]);

  // ── Delete ──
  const deleteSingle = useCallback(async (id) => {
    setSaving(true);
    const { error } = await onDeleteEntry(id, deckId);
    setSaving(false);
    if (error) toast?.error('Failed to delete');
    setConfirmDeleteId(null);
    setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
  }, [onDeleteEntry, deckId, toast]);

  const deleteBulk = useCallback(async () => {
    setSaving(true);
    const ids = [...selectedIds];
    for (const id of ids) await onDeleteEntry(id, deckId);
    setSaving(false);
    setSelectedIds(new Set());
    setShowBulkDelete(false);
    toast?.success(`Deleted ${ids.length} entries`);
  }, [selectedIds, onDeleteEntry, deckId, toast]);

  // ── Keyboard: edit row ──
  const handleEditKey = useCallback(async (e, colKey) => {
    if (e.key === 'Escape') { e.preventDefault(); cancelEdit(); return; }
    if (e.key === 'Enter') { e.preventDefault(); saveEdit(); return; }
    if (e.key === 'Tab') {
      e.preventDefault();
      const idx = COL_KEYS.indexOf(colKey);
      if (!e.shiftKey) {
        if (idx < COL_KEYS.length - 1) {
          focusCell(`${editingId}-${COL_KEYS[idx + 1]}`);
        } else {
          const rowIdx = entries.findIndex(en => en.id === editingId);
          const ok = await saveEdit();
          if (ok) {
            if (rowIdx + 1 < entries.length) {
              startEdit(entries[rowIdx + 1], 'word');
            } else {
              focusCell('new-word');
            }
          }
        }
      } else {
        if (idx > 0) focusCell(`${editingId}-${COL_KEYS[idx - 1]}`);
      }
    }
  }, [editingId, entries, cancelEdit, saveEdit, startEdit, focusCell]);

  // ── Keyboard: new row ──
  const handleNewKey = useCallback(async (e, colKey) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setNewDraft({ ...EMPTY_DRAFT });
      return;
    }
    if (e.key === 'Enter') { e.preventDefault(); saveNewRow(); return; }
    if (e.key === 'Tab') {
      e.preventDefault();
      const idx = COL_KEYS.indexOf(colKey);
      if (!e.shiftKey) {
        if (idx < COL_KEYS.length - 1) {
          focusCell(`new-${COL_KEYS[idx + 1]}`);
        } else {
          saveNewRow();
        }
      } else {
        if (idx > 0) focusCell(`new-${COL_KEYS[idx - 1]}`);
      }
    }
  }, [saveNewRow, focusCell]);

  // ── Blur handler for edit row ──
  const handleEditBlur = useCallback((e) => {
    requestAnimationFrame(() => {
      if (!editingId) return;
      const active = document.activeElement;
      const stillInRow = COL_KEYS.some(k => refs.current[`${editingId}-${k}`] === active);
      if (!stillInRow) {
        saveEdit();
      }
    });
  }, [editingId, saveEdit]);

  const hasSelection = selectedIds.size > 0;

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Toolbar */}
      {hasSelection && (
        <SpreadsheetToolbar
          count={selectedIds.size}
          onDelete={() => setShowBulkDelete(true)}
          onClear={() => setSelectedIds(new Set())}
        />
      )}

      {/* Table */}
      <div className="flex-1 overflow-auto rounded-xl backdrop-blur-lg bg-white/5 border border-white/10">
        <table className="w-full border-collapse" style={{ minWidth: 780 }}>
          <SpreadsheetHeader
            allSelected={entries.length > 0 && selectedIds.size === entries.length}
            onToggleAll={toggleSelectAll}
          />
          <tbody>
            {entries.map(entry => (
              <SpreadsheetRow
                key={entry.id}
                entry={entry}
                isEditing={editingId === entry.id}
                editDraft={editingId === entry.id ? editDraft : null}
                onEditDraftChange={setEditDraft}
                isSelected={selectedIds.has(entry.id)}
                onToggleSelect={() => toggleSelect(entry.id)}
                onStartEdit={(colKey) => startEdit(entry, colKey)}
                onKeyDown={handleEditKey}
                onBlur={handleEditBlur}
                confirmingDelete={confirmDeleteId === entry.id}
                onRequestDelete={() => setConfirmDeleteId(entry.id)}
                onConfirmDelete={() => deleteSingle(entry.id)}
                onCancelDelete={() => setConfirmDeleteId(null)}
                deckColor={deckColor}
                setRef={setRef}
                saving={saving}
              />
            ))}
            <SpreadsheetNewRow
              draft={newDraft}
              onDraftChange={setNewDraft}
              onKeyDown={handleNewKey}
              setRef={setRef}
            />
          </tbody>
        </table>
      </div>

      {/* Entry count */}
      <div className="flex items-center justify-between mt-3 px-1">
        <span className="text-xs text-slate-500">
          {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
        </span>
        {saving && (
          <span className="text-xs text-starlog-400">Saving...</span>
        )}
      </div>

      {/* Bulk delete dialog */}
      <ConfirmDialog
        isOpen={showBulkDelete}
        onClose={() => setShowBulkDelete(false)}
        onConfirm={deleteBulk}
        title="Delete Entries"
        message={`Delete ${selectedIds.size} selected entries? This cannot be undone.`}
        confirmText={`Delete ${selectedIds.size}`}
        loading={saving}
      />
    </div>
  );
}

// ── Header ──
function SpreadsheetHeader({ allSelected, onToggleAll }) {
  return (
    <thead>
      <tr className="sticky top-0 z-10 bg-slate-900/90 backdrop-blur-sm">
        <th className="w-[36px] px-2 py-3">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={onToggleAll}
            className="w-3.5 h-3.5 rounded accent-starlog-500 cursor-pointer"
          />
        </th>
        {COLUMNS.map(col => (
          <th
            key={col.key}
            className="text-left px-3 py-3 text-xs uppercase tracking-wider font-medium text-slate-500"
            style={{
              width: col.width || undefined,
              ...(!col.width ? { minWidth: '120px' } : {}),
            }}
          >
            {col.label}{col.required && <span className="text-red-400/60 ml-0.5">*</span>}
          </th>
        ))}
        <th className="w-[64px] text-left px-3 py-3 text-xs uppercase tracking-wider font-medium text-slate-500">
          Mastery
        </th>
        <th className="w-[44px]" />
      </tr>
      <tr>
        <td colSpan={COLUMNS.length + 3} className="h-px bg-white/10" />
      </tr>
    </thead>
  );
}

// ── Existing entry row ──
function SpreadsheetRow({
  entry, isEditing, editDraft, onEditDraftChange,
  isSelected, onToggleSelect, onStartEdit, onKeyDown, onBlur,
  confirmingDelete, onRequestDelete, onConfirmDelete, onCancelDelete,
  deckColor, setRef, saving,
}) {
  const mastery = entry.mastery_level || 0;

  return (
    <tr
      className={`group border-b border-white/5 transition-colors ${
        isEditing ? 'bg-white/10' : 'hover:bg-white/[.04]'
      }`}
      style={isEditing ? { boxShadow: `inset 3px 0 0 ${deckColor}` } : {}}
    >
      {/* Checkbox */}
      <td className="px-2 py-2.5">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          className="w-3.5 h-3.5 rounded accent-starlog-500 cursor-pointer"
        />
      </td>

      {/* Data columns */}
      {COLUMNS.map(col => (
        <td key={col.key} className="px-3 py-2.5" style={{ width: col.width || undefined }}>
          {isEditing ? (
            <input
              ref={setRef(`${entry.id}-${col.key}`)}
              value={editDraft?.[col.key] ?? ''}
              onChange={(e) => onEditDraftChange(prev => ({ ...prev, [col.key]: e.target.value }))}
              onKeyDown={(e) => onKeyDown(e, col.key)}
              onBlur={onBlur}
              className="w-full bg-transparent text-sm text-white outline-none border-b border-starlog-500/60 py-0.5"
              placeholder={col.label.toLowerCase()}
            />
          ) : (
            <div
              className="text-sm truncate py-0.5 cursor-text min-h-[24px] flex items-center"
              onClick={() => onStartEdit(col.key)}
            >
              {col.key === 'tags'
                ? (entry.tags?.length > 0
                    ? <span className="text-slate-400">{formatTags(entry.tags)}</span>
                    : <span className="text-slate-700">&mdash;</span>)
                : col.key === 'word'
                  ? <span className="text-white font-medium">{entry[col.key] || <span className="text-slate-700">&mdash;</span>}</span>
                  : col.key === 'translation'
                    ? <span className="text-starlog-400">{entry[col.key] || <span className="text-slate-700">&mdash;</span>}</span>
                    : col.key === 'phonetic'
                      ? <span className="text-slate-500">{entry[col.key] ? `/${entry[col.key]}/` : <span className="text-slate-700">&mdash;</span>}</span>
                      : <span className="text-slate-400">{entry[col.key] || <span className="text-slate-700">&mdash;</span>}</span>
              }
            </div>
          )}
        </td>
      ))}

      {/* Mastery bar */}
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-white/5">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${Math.round(mastery * 100)}%`, backgroundColor: masteryColor(mastery) }}
            />
          </div>
        </div>
      </td>

      {/* Delete */}
      <td className="px-2 py-2.5">
        {confirmingDelete ? (
          <div className="flex items-center gap-1">
            <button
              onClick={onConfirmDelete}
              disabled={saving}
              className="p-1 rounded text-red-400 hover:bg-red-500/20 transition-colors"
              title="Confirm delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onCancelDelete}
              className="p-1 rounded text-slate-500 hover:bg-white/5 transition-colors"
              title="Cancel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={onRequestDelete}
            className="p-1 rounded opacity-0 group-hover:opacity-100 transition-all text-slate-600 hover:bg-red-500/10 hover:text-red-400"
            title="Delete entry"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </td>
    </tr>
  );
}

// ── New row ──
function SpreadsheetNewRow({ draft, onDraftChange, onKeyDown, setRef }) {
  return (
    <tr className="border-b border-white/5 bg-white/[.02]">
      <td className="px-2 py-2.5" /> {/* no checkbox */}
      {COLUMNS.map(col => (
        <td key={col.key} className="px-3 py-2.5">
          <input
            ref={setRef(`new-${col.key}`)}
            value={draft[col.key]}
            onChange={(e) => onDraftChange(prev => ({ ...prev, [col.key]: e.target.value }))}
            onKeyDown={(e) => onKeyDown(e, col.key)}
            placeholder={col.key === 'word' ? '+ add word' : col.label.toLowerCase()}
            className={`w-full bg-transparent text-sm text-white outline-none py-0.5 ${
              col.key === 'word'
                ? 'placeholder:text-starlog-500/50 font-medium'
                : 'placeholder:text-slate-700'
            }`}
          />
        </td>
      ))}
      <td /> {/* mastery - empty */}
      <td /> {/* delete - empty */}
    </tr>
  );
}

// ── Toolbar (shown when rows are selected) ──
function SpreadsheetToolbar({ count, onDelete, onClear }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 mb-3 rounded-xl backdrop-blur-lg bg-white/5 border border-white/10">
      <span className="text-sm text-slate-400">{count} selected</span>
      <button
        onClick={onDelete}
        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"
      >
        Delete selected
      </button>
      <button
        onClick={onClear}
        className="text-xs text-slate-500 transition-colors hover:text-white"
      >
        Clear selection
      </button>
    </div>
  );
}
