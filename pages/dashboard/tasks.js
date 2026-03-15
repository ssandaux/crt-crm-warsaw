import { useState, useRef, useEffect } from 'react';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import { useData } from '../../components/DataContext';

const STATUSES = [
  { value: 'contacted', label: 'Contacted', color: 'bg-blue-100 text-blue-700' },
  { value: 'agreed',    label: 'Agreed',    color: 'bg-emerald-100 text-emerald-700' },
  { value: 'rejected',  label: 'Rejected',  color: 'bg-red-100 text-red-700' },
  { value: 'follow_up', label: 'Follow-up', color: 'bg-amber-100 text-amber-700' },
];

const SKIP_TTL_DAYS = 7;

// ─── Icons ────────────────────────────────────────────────────────────────────
function IconCheck() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}
function IconSkip() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
function IconMapPin() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
function IconLink() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  );
}
function IconPhone() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  );
}
function IconChevronDown() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}
function IconHistory() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
function IconClose() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
function IconRestore() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

// ─── Status dropdown for Approve ─────────────────────────────────────────────
function ApproveDropdown({ onApprove }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-gray-900 text-white hover:bg-gray-800 transition-colors"
      >
        <IconCheck /> Approve <IconChevronDown />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[140px]">
          {STATUSES.map((s) => (
            <button
              key={s.value}
              onClick={() => { setOpen(false); onApprove(s.value); }}
              className="w-full text-left px-3 py-2 text-[12px] hover:bg-gray-50 flex items-center gap-2"
            >
              <span className={`inline-block w-2 h-2 rounded-full ${s.color.split(' ')[0]}`} />
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── History panel ────────────────────────────────────────────────────────────
function HistoryPanel({ skippedList, onRestore, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex">
      {/* backdrop */}
      <div className="flex-1 bg-black/20" onClick={onClose} />
      {/* panel */}
      <div className="w-[420px] bg-white shadow-2xl flex flex-col h-full border-l border-gray-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <p className="text-[14px] font-semibold text-gray-900">Skipped history</p>
            <p className="text-[12px] text-gray-400 mt-0.5">Хранится {SKIP_TTL_DAYS} дней, потом удаляется навсегда</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors">
            <IconClose />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {skippedList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <p className="text-[13px] text-gray-400">Нет скипнутых бизнесов</p>
            </div>
          ) : (
            skippedList.map((biz) => {
              const skipDate = biz.lastAction ? new Date(biz.lastAction) : null;
              const daysLeft = skipDate
                ? SKIP_TTL_DAYS - Math.floor((Date.now() - skipDate.getTime()) / 86400000)
                : null;

              return (
                <div key={biz.id} className="px-5 py-3.5 hover:bg-gray-50/60 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-gray-900 truncate">{biz.name}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {biz.type || '—'}
                        {biz.address && biz.address !== '—' ? ` · ${biz.address}` : ''}
                      </p>
                      {daysLeft !== null && (
                        <p className={`text-[11px] mt-1 ${daysLeft <= 1 ? 'text-red-400' : 'text-gray-300'}`}>
                          Удалится через {daysLeft} д.
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => onRestore(biz.id)}
                      className="flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-800 bg-white transition-colors"
                    >
                      <IconRestore /> Restore
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TasksPage() {
  const { businesses, changeStatus, deleteBusinesses, ready } = useData();
  const [approving, setApproving] = useState(new Set());
  const [historyOpen, setHistoryOpen] = useState(false);

  // On load: delete skipped businesses older than 7 days
  useEffect(() => {
    if (!ready) return;
    const cutoff = Date.now() - SKIP_TTL_DAYS * 86400000;
    const expired = businesses.filter((b) => {
      if (b.status !== 'skipped') return false;
      const d = b.lastAction ? new Date(b.lastAction).getTime() : 0;
      return d < cutoff;
    });
    if (expired.length > 0) {
      deleteBusinesses(expired.map((b) => b.id));
    }
  }, [ready]); // eslint-disable-line react-hooks/exhaustive-deps

  const tasks = businesses.filter((b) => b.status === 'untouched');
  const skippedList = businesses.filter((b) => b.status === 'skipped');

  async function handleApprove(biz, status) {
    setApproving((prev) => new Set([...prev, biz.id]));
    await changeStatus(biz.id, status);
    setApproving((prev) => {
      const next = new Set(prev);
      next.delete(biz.id);
      return next;
    });
  }

  async function handleSkip(biz) {
    setApproving((prev) => new Set([...prev, biz.id]));
    await changeStatus(biz.id, 'skipped');
    setApproving((prev) => {
      const next = new Set(prev);
      next.delete(biz.id);
      return next;
    });
  }

  async function handleRestore(id) {
    await changeStatus(id, 'untouched');
  }

  function normalizeUrl(raw) {
    if (!raw || raw === '—') return null;
    return raw.startsWith('http') ? raw : `https://${raw}`;
  }

  const headerActions = (
    <button
      onClick={() => setHistoryOpen(true)}
      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium border border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-900 bg-white transition-colors"
    >
      <IconHistory />
      History
      {skippedList.length > 0 && (
        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-200 text-[10px] font-bold text-gray-600">
          {skippedList.length}
        </span>
      )}
    </button>
  );

  if (!ready) {
    return (
      <Layout fullWidth>
        <PageHeader title="Tasks" subtitle="Review untouched businesses." />
        <div className="flex items-center justify-center py-24 text-[13px] text-gray-400">Loading…</div>
      </Layout>
    );
  }

  return (
    <Layout fullWidth>
      <PageHeader
        title="Tasks"
        count={tasks.length}
        subtitle="Untouched businesses awaiting your first contact. Approve to move them into Businesses."
        action={headerActions}
      />

      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <p className="text-[15px] font-semibold text-gray-700 mb-1">All done!</p>
          <p className="text-[13px] text-gray-400">No untouched businesses left to review.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Business</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Category</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Address</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Website</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Phone</th>
                <th className="text-right px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {tasks.map((biz) => {
                const url = normalizeUrl(biz.website);
                const isProcessing = approving.has(biz.id);
                return (
                  <tr key={biz.id} className={`transition-colors ${isProcessing ? 'opacity-40' : 'hover:bg-gray-50/70'}`}>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-gray-900">{biz.name}</span>
                      {biz.district && biz.district !== '—' && (
                        <span className="ml-2 text-[11px] text-gray-400">{biz.district}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-gray-100 text-gray-600">
                        {biz.type || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-[200px]">
                      <span className="inline-flex items-center gap-1.5 text-gray-400 text-[12px] truncate">
                        <IconMapPin className="shrink-0" />
                        <span className="truncate">{biz.address || '—'}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-[180px]">
                      {url ? (
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-[12px] text-blue-500 hover:text-blue-700 hover:underline transition-colors max-w-full"
                        >
                          <IconLink />
                          <span className="truncate">{biz.website.replace(/^https?:\/\/(www\.)?/, '')}</span>
                        </a>
                      ) : (
                        <span className="text-[12px] text-gray-200">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {biz.phone && biz.phone !== '—' ? (
                        <a
                          href={`tel:${biz.phone}`}
                          className="inline-flex items-center gap-1.5 text-[12px] text-gray-500 hover:text-gray-800 transition-colors whitespace-nowrap"
                        >
                          <IconPhone />
                          {biz.phone}
                        </a>
                      ) : (
                        <span className="text-[12px] text-gray-200">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {isProcessing ? (
                          <span className="text-[12px] text-gray-400">Saving…</span>
                        ) : (
                          <>
                            <ApproveDropdown onApprove={(status) => handleApprove(biz, status)} />
                            <button
                              onClick={() => handleSkip(biz)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-800 bg-white transition-colors"
                            >
                              <IconSkip /> Skip
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/40">
            <p className="text-[12px] text-gray-400">{tasks.length} untouched businesses</p>
          </div>
        </div>
      )}

      {historyOpen && (
        <HistoryPanel
          skippedList={skippedList}
          onRestore={handleRestore}
          onClose={() => setHistoryOpen(false)}
        />
      )}
    </Layout>
  );
}
