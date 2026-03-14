import { useState } from 'react';
import { STATUS_CONFIG, StatusBadge } from './ui';
import { statuses } from '../mockData/businesses';

function IconClose() {
  return <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
}
function IconEdit() {
  return <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
}
function IconDelete() {
  return <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
}
function IconMove() {
  return <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
}
function IconPin() {
  return <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 shrink-0 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
}
function IconPhone() {
  return <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 shrink-0 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>;
}
function IconMail() {
  return <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 shrink-0 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
}
function IconBuilding() {
  return <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 shrink-0 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>;
}
function IconDistrict() {
  return <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 shrink-0 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" /></svg>;
}

function Row({ icon, value }) {
  if (!value || value === '—') return null;
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5">{icon}</span>
      <span className="text-[13px] text-gray-600 leading-snug">{value}</span>
    </div>
  );
}

// ─── Activity timeline (editable, localStorage-backed) ────────────────────────

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

function fmtEntryDate(iso) {
  if (!iso) return '';
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function ActivityTimeline({ bizId }) {
  const storageKey = `crm_act_${bizId}`;

  const [entries, setEntries] = useState(() => {
    try { return JSON.parse(localStorage.getItem(storageKey) || '[]'); }
    catch { return []; }
  });
  const [adding, setAdding]       = useState(false);
  const [newText, setNewText]     = useState('');
  const [newDate, setNewDate]     = useState(todayISO);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText]   = useState('');
  const [editDate, setEditDate]   = useState('');

  function persist(updated) {
    setEntries(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  }

  function handleAdd() {
    if (!newText.trim()) return;
    persist([{ id: Date.now(), text: newText.trim(), date: newDate }, ...entries]);
    setNewText('');
    setNewDate(todayISO());
    setAdding(false);
  }

  function startEdit(entry) {
    setEditingId(entry.id);
    setEditText(entry.text);
    setEditDate(entry.date);
  }

  function handleSaveEdit(id) {
    persist(entries.map((e) => (e.id === id ? { ...e, text: editText.trim(), date: editDate } : e)));
    setEditingId(null);
  }

  const sorted = [...entries].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="px-5 py-4 border-b border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Activity</p>
        <button
          onClick={() => { setAdding((v) => !v); }}
          className="text-[11px] font-medium text-gray-400 hover:text-gray-700 transition-colors"
        >
          + Add
        </button>
      </div>

      {/* Add form */}
      {adding && (
        <div className="mb-3 bg-gray-50 rounded-xl border border-gray-100 p-3 space-y-2">
          <textarea
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Describe the activity…"
            rows={2}
            className="w-full text-[12px] text-gray-700 bg-white border border-gray-200 rounded-lg px-2.5 py-2 outline-none resize-none focus:ring-2 focus:ring-gray-300 placeholder-gray-400"
          />
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="flex-1 text-[12px] text-gray-600 border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-gray-300 bg-white"
            />
            <button
              onClick={handleAdd}
              className="px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-gray-900 text-white hover:bg-gray-800 transition-colors"
            >
              Save
            </button>
            <button
              onClick={() => setAdding(false)}
              className="text-[12px] text-gray-400 hover:text-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {sorted.length === 0 && !adding && (
        <p className="text-[12px] text-gray-300 italic">No activity yet.</p>
      )}

      {/* Entries */}
      <div className="space-y-3">
        {sorted.map((entry, i) => (
          <div key={entry.id} className="flex gap-3">
            {/* Dot + line */}
            <div className="flex flex-col items-center shrink-0">
              <span className="w-2 h-2 rounded-full mt-1 shrink-0 bg-gray-300" />
              {i < sorted.length - 1 && <span className="w-px flex-1 bg-gray-100 mt-1" />}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pb-1">
              {editingId === entry.id ? (
                <div className="space-y-1.5">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={2}
                    className="w-full text-[12px] text-gray-700 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none resize-none focus:ring-2 focus:ring-gray-300"
                  />
                  <div className="flex items-center gap-1.5">
                    <input
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="flex-1 text-[11px] text-gray-600 border border-gray-200 rounded-md px-2 py-1 outline-none focus:ring-1 focus:ring-gray-300 bg-white"
                    />
                    <button
                      onClick={() => handleSaveEdit(entry.id)}
                      className="px-2 py-1 rounded-md text-[11px] font-semibold bg-gray-900 text-white hover:bg-gray-800 transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-2 py-1 rounded-md text-[11px] text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[11px] text-gray-400">{fmtEntryDate(entry.date)}</span>
                    <button
                      onClick={() => startEdit(entry)}
                      className="ml-auto text-[11px] text-gray-300 hover:text-gray-600 transition-colors"
                    >
                      Edit
                    </button>
                  </div>
                  <p className="text-[12px] text-gray-500 leading-snug">{entry.text}</p>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

/**
 * BusinessProfile — right-side slide-in panel
 *
 * Props:
 *   biz            — business object
 *   onClose        — () => void
 *   onEdit         — (biz) => void
 *   onDelete       — (biz) => void
 *   onStatusChange   — (id, status) => void   (optional — shown when provided)
 *   onFollowUpChange — (id, date) => void     (optional — shown when provided)
 */
export default function BusinessProfile({ biz, onClose, onEdit, onDelete, onStatusChange, onFollowUpChange, onRelocate, noBackdrop }) {
  if (!biz) return null;

  return (
    <>
      {/* Backdrop */}
      {!noBackdrop && <div className="fixed inset-0 z-[1500] bg-black/10" onClick={onClose} />}

      {/* Panel */}
      <div className="fixed top-0 right-0 h-screen w-[300px] bg-white border-l border-gray-200 shadow-2xl z-[1600] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-gray-100 shrink-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-bold text-gray-900 leading-tight">{biz.name}</p>
              <div className="mt-1.5">
                <StatusBadge status={biz.status} />
              </div>
            </div>
            <button onClick={onClose} className="text-gray-300 hover:text-gray-500 transition-colors mt-0.5 shrink-0">
              <IconClose />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">

          {/* Next Action + Follow-up date */}
          {(biz.nextAction || biz.followUpDate) && (() => {
            const isOverdue = biz.followUpDate && new Date(biz.followUpDate) < new Date(new Date().toDateString());
            const fmtFollowUp = biz.followUpDate
              ? new Date(biz.followUpDate + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
              : null;
            return (
              <div className={`mx-5 mt-4 mb-0 px-3.5 py-2.5 border rounded-xl flex items-start gap-2.5 ${isOverdue ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isOverdue ? 'text-red-400' : 'text-amber-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <div className="min-w-0 flex-1">
                  {biz.nextAction && (
                    <>
                      <p className={`text-[10px] font-semibold uppercase tracking-wide mb-0.5 ${isOverdue ? 'text-red-500' : 'text-amber-600'}`}>Next Action</p>
                      <p className={`text-[13px] leading-snug ${isOverdue ? 'text-red-800' : 'text-amber-800'}`}>{biz.nextAction}</p>
                    </>
                  )}
                  {fmtFollowUp && (
                    <p className={`text-[11px] font-medium mt-1 ${isOverdue ? 'text-red-500' : 'text-amber-600'} ${biz.nextAction ? 'mt-1.5' : ''}`}>
                      {isOverdue ? 'Overdue · ' : 'Follow up · '}{fmtFollowUp}
                    </p>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Contact fields */}
          <div className="px-5 py-4 space-y-3 border-b border-gray-100">
            <Row icon={<IconBuilding />} value={biz.type} />
            <Row icon={<IconDistrict />} value={biz.district} />
            <Row icon={<IconPin />}      value={biz.address} />
            <Row icon={<IconPhone />}    value={biz.phone} />
            <Row icon={<IconMail />}     value={biz.email} />
          </div>

          {/* Note */}
          {biz.note && (
            <div className="px-5 py-4 border-b border-gray-100">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Note</p>
              <p className="text-[13px] text-gray-500 leading-relaxed">{biz.note}</p>
            </div>
          )}

          {/* Status switcher — map page only */}
          {onStatusChange && (
            <div className="px-5 py-4 border-b border-gray-100">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Status</p>
              <div className="grid grid-cols-2 gap-1.5">
                {statuses.map((s) => {
                  const c = STATUS_CONFIG[s];
                  return (
                    <button
                      key={s}
                      onClick={() => onStatusChange(biz.id, s)}
                      className={`py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${s === 'untouched' ? 'col-span-2' : ''} ${
                        biz.status === s
                          ? `${c.badge} border-transparent shadow-sm`
                          : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-700'
                      }`}
                    >
                      {c.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Follow-up date — map page only */}
          {onFollowUpChange && (
            <div className="px-5 py-4 border-b border-gray-100">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Follow-up date</p>
              <input
                type="date"
                defaultValue={biz.followUpDate ?? ''}
                key={biz.followUpDate ?? ''}
                onChange={(e) => onFollowUpChange(biz.id, e.target.value)}
                className="w-full text-[13px] text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent hover:border-gray-300 transition"
              />
              {biz.followUpDate && (
                <button
                  onClick={() => onFollowUpChange(biz.id, '')}
                  className="mt-1.5 text-[11px] text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Clear date
                </button>
              )}
            </div>
          )}

          {/* Activity timeline */}
          <ActivityTimeline bizId={biz.id} />

          {/* Last action */}
          <div className="px-5 py-3">
            <p className="text-[11px] text-gray-400">
              Last action:{' '}
              <span className="text-gray-500">
                {new Date(biz.lastAction).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </p>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-5 py-4 border-t border-gray-100 flex flex-col gap-2 shrink-0">
          {onRelocate && (
            <button
              onClick={() => onRelocate(biz)}
              className="w-full inline-flex items-center justify-center gap-2 py-2 rounded-lg text-[13px] font-medium border border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-800 bg-white transition-all"
            >
              <IconMove /> Move pin on map
            </button>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(biz)}
              className="flex-1 inline-flex items-center justify-center gap-2 py-2 rounded-lg text-[13px] font-medium border border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-800 bg-white transition-all"
            >
              <IconEdit /> Edit
            </button>
            <button
              onClick={() => onDelete(biz)}
              className="flex-1 inline-flex items-center justify-center gap-2 py-2 rounded-lg text-[13px] font-medium border border-red-100 text-red-400 hover:border-red-200 hover:text-red-600 bg-white transition-all"
            >
              <IconDelete /> Delete
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
