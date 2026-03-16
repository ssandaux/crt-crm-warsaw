import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useJsApiLoader } from '@react-google-maps/api';
import Layout from '../../components/Layout';
import { useData } from '../../components/DataContext';
import { importFromGoogle, getImportWaveInfo, TOTAL_WAVES } from '../../lib/importGoogle';

const LIBRARIES = ['places'];

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
  const { businesses, ready } = useData();
  const hiddenDivRef = useRef(null);

  const [importConfirm, setImportConfirm]   = useState(false);
  const [importing, setImporting]           = useState(false);
  const [importProgress, setImportProgress] = useState(null);
  const [importDone, setImportDone]         = useState(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  });

  const stats = useMemo(() => {
    const total = businesses.length;
    const byStatus = {};
    for (const b of businesses) {
      byStatus[b.status] = (byStatus[b.status] ?? 0) + 1;
    }
    return { total, ...byStatus };
  }, [businesses]);

  async function handleGoogleImport() {
    if (!hiddenDivRef.current) return;
    setImportConfirm(false);
    setImporting(true);
    setImportDone(null);
    setImportProgress(null);
    try {
      const result = await importFromGoogle(hiddenDivRef.current, (progress) => setImportProgress(progress));
      setImportDone(result);
      setImporting(false);
    } catch {
      setImporting(false);
    }
  }

  const statCards = [
    { label: 'Total businesses', count: stats.total,            colorClass: 'text-gray-800',    bg: 'bg-white',      href: '/dashboard/businesses' },
    { label: 'Untouched',        count: stats.untouched ?? 0,   colorClass: 'text-gray-500',    bg: 'bg-gray-50',    href: null },
    { label: 'Contacted',        count: stats.contacted ?? 0,   colorClass: 'text-amber-600',   bg: 'bg-amber-50',   href: null },
    { label: 'Agreed',           count: stats.agreed   ?? 0,    colorClass: 'text-emerald-600', bg: 'bg-emerald-50', href: null },
    { label: 'Clients',          count: stats.client   ?? 0,    colorClass: 'text-blue-600',    bg: 'bg-blue-50',    href: null },
    { label: 'Rejected',         count: stats.rejected ?? 0,    colorClass: 'text-red-500',     bg: 'bg-red-50',     href: null },
  ];

  return (
    <Layout>
      {/* Hidden div for PlacesService (no map needed) */}
      <div ref={hiddenDivRef} style={{ display: 'none' }} />

      {/* Import confirm modal */}
      {importConfirm && (() => {
        const info = getImportWaveInfo();
        const waveLabels = ['центр Варшавы', 'средний пояс', 'внешний пояс'];
        const area = waveLabels[info.wave - 1] ?? `пояс ${info.wave}`;
        return (
          <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-sm mx-4 p-6">
              <div className="flex items-center gap-2 mb-3">
                <p className="text-[15px] font-bold text-gray-900">Import from Google</p>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                  Волна {info.wave} / {info.totalWaves}
                </span>
              </div>
              <p className="text-[13px] text-gray-500 mb-6">
                Будет просканирован <span className="font-medium text-gray-700">{area}</span> — {info.cellCount} зон (~3–4 мин). Новые бизнесы добавятся как <span className="font-medium text-gray-700">untouched</span>. Дубликаты пропускаются.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setImportConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-[13px] font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGoogleImport}
                  className="flex-1 py-2.5 rounded-xl bg-gray-900 text-white text-[13px] font-semibold hover:bg-gray-800 transition-colors"
                >
                  Yes, import
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Import progress modal */}
      {importing && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-sm mx-4 p-6">
            <p className="text-[14px] font-bold text-gray-900 mb-1">Importing from Google Places</p>
            <p className="text-[12px] text-gray-400 mb-5">Scanning zones from center outward. Takes ~3–4 min.</p>
            {importProgress && (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <p className="text-[12px] font-medium text-gray-700">{importProgress.label}</p>
                    <p className="text-[11px] text-gray-400">{importProgress.step} / {importProgress.total}</p>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className="bg-gray-900 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${(importProgress.step / importProgress.total) * 100}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1.5 capitalize">
                    {importProgress.status}…{importProgress.count != null ? ` ${importProgress.count} places` : ''}
                  </p>
                </div>
                <p className="text-[12px] text-gray-500 pt-2 border-t border-gray-100">
                  Added to CRM: <span className="font-semibold text-gray-900">{importProgress.totalInserted?.toLocaleString() ?? 0}</span>
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Import done banner */}
      {importDone && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3">
          <p className="text-[13px] text-emerald-700 font-medium">
            Done — {importDone.totalInserted} new businesses added (Wave {importDone.wave}/{importDone.totalWaves})
          </p>
          <button onClick={() => setImportDone(null)} className="text-emerald-400 hover:text-emerald-700 transition-colors shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-[20px] font-bold text-gray-900 leading-tight">Overview</p>
          <p className="text-[12px] text-gray-400 mt-0.5">Business pipeline summary</p>
        </div>
      </div>

      {/* Stats grid */}
      {!ready ? (
        <div className="grid grid-cols-2 gap-3 mb-6">
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

      {/* Import button */}
      <button
        onClick={() => setImportConfirm(true)}
        disabled={!isLoaded || importing}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-[14px] font-medium border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-800 transition-all disabled:opacity-50 mb-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        Import from Google
      </button>
      <p className="text-[11px] text-gray-400 text-center mb-6">
        Up to 1,000 new businesses per import · Total database limit: 10,000
      </p>
    </Layout>
  );
}
