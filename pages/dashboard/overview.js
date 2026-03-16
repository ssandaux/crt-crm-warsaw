import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { useData } from '../../components/DataContext';
import { STATUS_CONFIG } from '../../components/ui';

// ── CSV import ────────────────────────────────────────────────────────────────
function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/^"|"$/g, ''));
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
    const row = {};
    headers.forEach((h, idx) => { row[h] = cols[idx] ?? ''; });
    rows.push(row);
  }
  return rows;
}

function csvRowToBiz(row) {
  return {
    name:     row.name     ?? row['Название'] ?? '',
    type:     row.type     ?? row['Тип']      ?? '',
    district: row.district ?? row['Район']    ?? '',
    status:   row.status   ?? row['Статус']   ?? 'untouched',
    address:  row.address  ?? row['Адрес']    ?? '',
    phone:    row.phone    ?? row['Телефон']  ?? '',
    email:    row.email    ?? row['Email']    ?? '',
    website:  row.website  ?? row['Website']  ?? '',
    note:     row.note     ?? row['Заметка']  ?? '',
  };
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, count, colorClass, bg, href }) {
  const inner = (
    <div className={`rounded-2xl border border-gray-200 ${bg} p-4 flex flex-col gap-1 shadow-sm`}>
      <p className={`text-[28px] font-bold leading-none ${colorClass}`}>{count}</p>
      <p className="text-[12px] font-medium text-gray-500 mt-1">{label}</p>
    </div>
  );
  if (href) return <Link href={href}>{inner}</Link>;
  return inner;
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function OverviewPage() {
  const { businesses, ready, addBusiness } = useData();
  const fileRef = useRef(null);
  const [importState, setImportState] = useState(null); // null | 'loading' | { added, skipped }

  const stats = useMemo(() => {
    const total = businesses.length;
    const byStatus = {};
    for (const b of businesses) {
      byStatus[b.status] = (byStatus[b.status] ?? 0) + 1;
    }
    return { total, ...byStatus };
  }, [businesses]);

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setImportState('loading');
    try {
      const text = await file.text();
      const rows = parseCSV(text);
      let added = 0, skipped = 0;
      for (const row of rows) {
        const biz = csvRowToBiz(row);
        if (!biz.name.trim()) { skipped++; continue; }
        const result = await addBusiness(biz);
        if (result) added++; else skipped++;
      }
      setImportState({ added, skipped });
      setTimeout(() => setImportState(null), 4000);
    } catch {
      setImportState({ added: 0, skipped: -1 });
      setTimeout(() => setImportState(null), 4000);
    }
  }

  const statCards = [
    { label: 'Total businesses', count: stats.total,            colorClass: 'text-gray-800',    bg: 'bg-white',        href: '/dashboard/businesses' },
    { label: 'Untouched',        count: stats.untouched ?? 0,   colorClass: 'text-gray-500',    bg: 'bg-gray-50',      href: null },
    { label: 'Contacted',        count: stats.contacted ?? 0,   colorClass: 'text-amber-600',   bg: 'bg-amber-50',     href: null },
    { label: 'Agreed',           count: stats.agreed   ?? 0,    colorClass: 'text-emerald-600', bg: 'bg-emerald-50',   href: null },
    { label: 'Clients',          count: stats.client   ?? 0,    colorClass: 'text-blue-600',    bg: 'bg-blue-50',      href: null },
    { label: 'Rejected',         count: stats.rejected ?? 0,    colorClass: 'text-red-500',     bg: 'bg-red-50',       href: null },
  ];

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-[20px] font-bold text-gray-900 leading-tight">Overview</p>
          <p className="text-[12px] text-gray-400 mt-0.5">Business pipeline summary</p>
        </div>
      </div>

      {/* Stats grid */}
      {!ready ? (
        <div className="grid grid-cols-2 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-gray-100 bg-gray-50 p-4 h-20 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 mb-6">
          {statCards.map((c) => (
            <StatCard key={c.label} {...c} />
          ))}
        </div>
      )}

      {/* Import section */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 mb-4">
        <p className="text-[13px] font-semibold text-gray-800 mb-1">Import businesses</p>
        <p className="text-[12px] text-gray-400 mb-3">
          Upload a CSV file with columns: <span className="font-medium text-gray-500">name, type, district, status, address, phone, email, website, note</span>
        </p>

        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={handleFileChange}
        />

        <button
          onClick={() => fileRef.current?.click()}
          disabled={importState === 'loading'}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-medium border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-800 transition-all disabled:opacity-50"
        >
          {importState === 'loading' ? (
            <>
              <svg className="w-4 h-4 animate-spin text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Importing…
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Upload CSV
            </>
          )}
        </button>

        {importState && importState !== 'loading' && (
          <div className={`mt-2 px-3 py-2 rounded-lg text-[12px] font-medium ${importState.skipped === -1 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>
            {importState.skipped === -1
              ? 'Error reading file. Check the format and try again.'
              : `Done — ${importState.added} added, ${importState.skipped} skipped.`}
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/dashboard/businesses" className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex items-center gap-3 hover:border-gray-300 transition-all">
          <span className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </span>
          <div>
            <p className="text-[13px] font-semibold text-gray-800">Businesses</p>
            <p className="text-[11px] text-gray-400">{stats.total} total</p>
          </div>
        </Link>
        <Link href="/dashboard/followups" className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex items-center gap-3 hover:border-gray-300 transition-all">
          <span className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </span>
          <div>
            <p className="text-[13px] font-semibold text-gray-800">Reminders</p>
            <p className="text-[11px] text-gray-400">Follow-ups</p>
          </div>
        </Link>
      </div>
    </Layout>
  );
}
