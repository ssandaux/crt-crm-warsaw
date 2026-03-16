import { useState, useRef, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import { useData } from '../../components/DataContext';

const STATUSES = [
  { value: 'agreed',   label: 'Agreed',   dot: 'bg-emerald-500' },
  { value: 'rejected', label: 'Rejected', dot: 'bg-red-500' },
  { value: 'client',   label: 'Client',   dot: 'bg-blue-500' },
];

const SKIP_TTL_DAYS = 7;
const PAGE_SIZES = [10, 25, 50, 100];

const DEFAULT_COL_WIDTHS = {
  business: 320,
  category: 130,
  address:  220,
  website:  190,
  phone:    160,
  actions:  200,
};

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
    <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
function IconGoogleMaps() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
function IconLink() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  );
}
function IconPhone() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  );
}
function IconChevronDown() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
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

// ─── Resizable column header ───────────────────────────────────────────────
function ResizableTh({ width, onResize, children, className = '', isLast = false }) {
  const startX = useRef(null);
  const startW = useRef(null);

  const onMouseDown = useCallback((e) => {
    e.preventDefault();
    startX.current = e.clientX;
    startW.current = width;

    function onMove(ev) {
      const delta = ev.clientX - startX.current;
      const next  = Math.max(80, startW.current + delta);
      onResize(next);
    }
    function onUp() {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [width, onResize]);

  return (
    <th
      style={{ width, minWidth: width }}
      className={`relative text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider bg-gray-50/60 border-b border-gray-100 select-none ${className}`}
    >
      {children}
      {!isLast && (
        <div
          onMouseDown={onMouseDown}
          className="absolute right-0 top-0 h-full w-4 flex items-center justify-center cursor-col-resize group z-10"
          style={{ userSelect: 'none' }}
        >
          <div className="w-[3px] h-5 rounded-full bg-gray-200 group-hover:bg-gray-400 transition-colors" />
        </div>
      )}
    </th>
  );
}

// ─── Split button: "Contacted" + chevron for custom status ────────────────
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
    <div className="relative inline-flex" ref={ref}>
      <button
        onClick={() => onApprove('contacted')}
        className="inline-flex items-center gap-1.5 px-3.5 py-[7px] text-[12px] font-medium tracking-wide bg-gray-900 text-white hover:bg-gray-800 active:scale-[0.98] transition-all leading-none rounded-md whitespace-nowrap select-none"
      >
        <IconCheck />
        Contacted
      </button>
    </div>
  );
}

// ─── History panel ─────────────────────────────────────────────────────────
function HistoryPanel({ skippedList, onRestore, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/20" onClick={onClose} />
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

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function TasksPage() {
  const { businesses, changeStatus, deleteBusinesses, ready } = useData();
  const [approving, setApproving]   = useState(new Set());
  const [historyOpen, setHistoryOpen] = useState(false);
  const [colWidths, setColWidths]   = useState(DEFAULT_COL_WIDTHS);
  const [page, setPage]             = useState(1);
  const [pageSize, setPageSize]     = useState(25);

  function setColWidth(col, w) {
    setColWidths((prev) => ({ ...prev, [col]: w }));
  }

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

  const tasks       = businesses.filter((b) => b.status === 'untouched');
  const skippedList = businesses.filter((b) => b.status === 'skipped');

  const totalPages  = Math.max(1, Math.ceil(tasks.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows    = tasks.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const paginationPages = () => {
    const pages = [];
    if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) pages.push(i); }
    else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  async function handleApprove(biz, status) {
    setApproving((prev) => new Set([...prev, biz.id]));
    await changeStatus(biz.id, status);
    setApproving((prev) => { const n = new Set(prev); n.delete(biz.id); return n; });
  }

  async function handleSkip(biz) {
    setApproving((prev) => new Set([...prev, biz.id]));
    await changeStatus(biz.id, 'skipped');
    setApproving((prev) => { const n = new Set(prev); n.delete(biz.id); return n; });
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

  const totalWidth = Object.values(colWidths).reduce((a, b) => a + b, 0);

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
          {/* Scrollable table wrapper */}
          <div className="overflow-x-auto">
            <table
              className="text-[13px] border-collapse"
              style={{ tableLayout: 'fixed', width: totalWidth, minWidth: '100%' }}
            >
              <colgroup>
                <col style={{ width: colWidths.business }} />
                <col style={{ width: colWidths.category }} />
                <col style={{ width: colWidths.address }} />
                <col style={{ width: colWidths.website }} />
                <col style={{ width: colWidths.phone }} />
                <col style={{ width: colWidths.actions }} />
              </colgroup>
              <thead>
                <tr>
                  <ResizableTh width={colWidths.business} onResize={(w) => setColWidth('business', w)}>
                    Business
                  </ResizableTh>
                  <ResizableTh width={colWidths.category} onResize={(w) => setColWidth('category', w)}>
                    Category
                  </ResizableTh>
                  <ResizableTh width={colWidths.address} onResize={(w) => setColWidth('address', w)}>
                    Address
                  </ResizableTh>
                  <ResizableTh width={colWidths.website} onResize={(w) => setColWidth('website', w)}>
                    Website
                  </ResizableTh>
                  <ResizableTh width={colWidths.phone} onResize={(w) => setColWidth('phone', w)}>
                    Phone
                  </ResizableTh>
                  <ResizableTh width={colWidths.actions} onResize={() => {}} isLast className="text-right">
                    Actions
                  </ResizableTh>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pageRows.map((biz) => {
                  const url          = normalizeUrl(biz.website);
                  const isProcessing = approving.has(biz.id);
                  return (
                    <tr
                      key={biz.id}
                      className={`transition-colors ${isProcessing ? 'opacity-40 pointer-events-none' : 'hover:bg-gray-50/70'}`}
                    >
                      {/* Business */}
                      <td className="px-4 py-3 overflow-hidden">
                        <span className="font-semibold text-gray-900 truncate block">{biz.name}</span>
                        {biz.district && biz.district !== '—' && (
                          <span className="text-[11px] text-gray-400 truncate block">{biz.district}</span>
                        )}
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3 overflow-hidden">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-gray-100 text-gray-600 truncate max-w-full">
                          {biz.type || '—'}
                        </span>
                      </td>

                      {/* Address */}
                      <td className="px-4 py-3 overflow-hidden">
                        <span className="inline-flex items-center gap-1.5 text-gray-400 text-[12px] w-full overflow-hidden">
                          <IconMapPin />
                          <span className="truncate">{biz.address || '—'}</span>
                        </span>
                      </td>

                      {/* Website */}
                      <td className="px-4 py-3 overflow-hidden">
                        {url ? (
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-[12px] text-blue-500 hover:text-blue-700 hover:underline transition-colors w-full overflow-hidden"
                          >
                            <IconLink />
                            <span className="truncate">
                              {biz.website.replace(/^https?:\/\/(www\.)?/, '')}
                            </span>
                          </a>
                        ) : (
                          <span className="text-[12px] text-gray-200">—</span>
                        )}
                      </td>

                      {/* Phone */}
                      <td className="px-4 py-3 overflow-hidden whitespace-nowrap">
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

                      {/* Actions */}
                      <td className="px-4 py-3 overflow-visible">
                        <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                          {isProcessing ? (
                            <span className="text-[12px] text-gray-400 italic">Saving…</span>
                          ) : (
                            <>
                              <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([biz.name, biz.address].filter(Boolean).join(' '))}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Open in Google Maps"
                                className="inline-flex items-center gap-1 px-2.5 py-[7px] rounded-md text-[12px] font-medium text-gray-400 hover:text-blue-500 hover:bg-blue-50 active:scale-[0.98] transition-all whitespace-nowrap select-none"
                              >
                                <IconGoogleMaps />
                              </a>
                              <ApproveDropdown onApprove={(status) => handleApprove(biz, status)} />
                              <button
                                onClick={() => handleSkip(biz)}
                                className="inline-flex items-center gap-1 px-2.5 py-[7px] rounded-md text-[12px] font-medium text-gray-400 hover:text-gray-700 hover:bg-gray-100 active:scale-[0.98] transition-all whitespace-nowrap select-none"
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
          </div>

          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <p className="text-[12px] text-gray-400">
                {tasks.length === 0 ? '0 results'
                  : `${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, tasks.length)} of ${tasks.length} result${tasks.length !== 1 ? 's' : ''}`}
              </p>
              <div className="flex items-center gap-1">
                {PAGE_SIZES.map((s) => (
                  <button
                    key={s}
                    onClick={() => { setPageSize(s); setPage(1); }}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${pageSize === s ? 'bg-gray-900 text-white' : 'text-gray-400 hover:text-gray-700'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}
                  className="w-7 h-7 flex items-center justify-center rounded-md border border-gray-200 text-gray-400 hover:text-gray-700 hover:border-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                </button>
                {paginationPages().map((p, i) =>
                  p === '...'
                    ? <span key={`e-${i}`} className="w-7 h-7 flex items-center justify-center text-[12px] text-gray-400">…</span>
                    : <button key={p} onClick={() => setPage(p)}
                        className={`w-7 h-7 flex items-center justify-center rounded-md text-[12px] font-medium transition-colors ${currentPage === p ? 'bg-gray-900 text-white' : 'border border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-800'}`}>
                        {p}
                      </button>
                )}
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                  className="w-7 h-7 flex items-center justify-center rounded-md border border-gray-200 text-gray-400 hover:text-gray-700 hover:border-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            )}
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
