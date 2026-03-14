import { useState, useRef } from 'react';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import { useData } from '../../components/DataContext';
import { fetchWarsawBusinesses } from '../../lib/overpass';

const MOCK_TASKS = [
  { id: 't1',  name: 'Bistro Nowy Świat',         category: 'Restaurant',    district: 'Śródmieście',    address: 'Nowy Świat 35, Warszawa',           website: 'bistronowy.pl' },
  { id: 't2',  name: 'Piekarnia Złoty Kłos',       category: 'Bakery',        district: 'Mokotów',        address: 'ul. Puławska 120, Warszawa',         website: 'zlotyklos.pl' },
  { id: 't3',  name: 'Studio Fryzur Elegance',     category: 'Hair Salon',    district: 'Wola',           address: 'ul. Wolska 54, Warszawa',            website: '' },
  { id: 't4',  name: 'Centrum Fitness ProBody',    category: 'Gym',           district: 'Praga-Południe', address: 'ul. Grochowska 270, Warszawa',       website: 'probody.pl' },
  { id: 't5',  name: 'Kawiarnia Pod Arkadami',     category: 'Café',          district: 'Żoliborz',       address: 'ul. Mickiewicza 27, Warszawa',       website: 'podarkadami.pl' },
  { id: 't6',  name: 'Auto Serwis Kowalski',       category: 'Auto Service',  district: 'Targówek',       address: 'ul. Radzymińska 108, Warszawa',      website: '' },
  { id: 't7',  name: 'Klinika Urody Aura',         category: 'Beauty Clinic', district: 'Ursynów',        address: 'ul. Romera 4, Warszawa',             website: 'klinikaura.pl' },
  { id: 't8',  name: 'Sklep Rowerowy VeloPoint',   category: 'Retail',        district: 'Ochota',         address: 'ul. Grójecka 87, Warszawa',          website: 'velopoint.pl' },
  { id: 't9',  name: 'Restauracja Warszawa 1920',  category: 'Restaurant',    district: 'Śródmieście',    address: 'ul. Krakowskie Przedmieście 15',     website: 'warszawa1920.pl' },
  { id: 't10', name: 'Przedszkole Tęczowy Świat',  category: 'Education',     district: 'Bemowo',         address: 'ul. Lazurowa 14, Warszawa',          website: '' },
  { id: 't11', name: 'Gabinet Stomatologiczny Dr. Wiśniewska', category: 'Medical', district: 'Bielany', address: 'ul. Conrada 6, Warszawa',            website: 'drwisniewska.pl' },
  { id: 't12', name: 'Bar Mleczny Przy Rondzie',   category: 'Restaurant',    district: 'Praga-Północ',   address: 'ul. Targowa 20, Warszawa',           website: '' },
  { id: 't13', name: 'Kwiaciarnia Florals',         category: 'Retail',        district: 'Wilanów',        address: 'ul. Przyczółkowa 30, Warszawa',      website: 'florals.pl' },
  { id: 't14', name: 'Agencja Nieruchomości Nest', category: 'Real Estate',   district: 'Mokotów',        address: 'ul. Domaniewska 37, Warszawa',       website: 'nestnieruchomosci.pl' },
  { id: 't15', name: 'Drukarnia Szybka Prasa',     category: 'Print Shop',    district: 'Wola',           address: 'ul. Kasprzaka 18/20, Warszawa',      website: 'szybkaprasa.pl' },
];

// ─── CSV parser ───────────────────────────────────────────────────────────────
// Expected columns (order-independent, case-insensitive):
// name, category, district, address, website
function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/^"|"$/g, ''));
  const idx = (key) => headers.indexOf(key);
  return lines.slice(1).map((line, i) => {
    const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
    return {
      id:       `csv-${i}-${Date.now()}`,
      name:     cols[idx('name')]     ?? '',
      category: cols[idx('category')] ?? cols[idx('type')] ?? '',
      district: cols[idx('district')] ?? '',
      address:  cols[idx('address')]  ?? '',
      website:  cols[idx('website')]  ?? '',
    };
  }).filter((r) => r.name);
}

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
function IconUpload() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  );
}
function IconRefresh({ spinning }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={`w-3.5 h-3.5 ${spinning ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
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

// ─── Deduplication ────────────────────────────────────────────────────────────
const MAX_TASKS = 50;

/**
 * Returns a set of lookup keys for an item (task or business).
 * Keys:
 *  - "osm:<id>"         — when id matches the OSM pattern node/way/relation
 *  - "coords:<name>:<lat3>:<lng3>" — name + coordinates rounded to ~100 m
 *  - "name:<name>"      — fallback (name-only, used when no coords)
 */
function buildKeys(item) {
  const keys = [];
  const id = item.id ?? item.osm_id;
  if (id && /^(node|way|relation)\//.test(String(id))) {
    keys.push(`osm:${id}`);
  }
  const lat = item.lat ?? item.latitude;
  const lng = item.lng ?? item.longitude;
  const name = (item.name ?? '').toLowerCase().trim();
  if (name && lat != null && lng != null) {
    keys.push(`coords:${name}:${Number(lat).toFixed(3)}:${Number(lng).toFixed(3)}`);
  }
  if (name) keys.push(`name:${name}`);
  return keys;
}

/**
 * Removes items from newItems that already exist in existingItems.
 * Also deduplicates within newItems (first occurrence wins).
 * Returns at most MAX_TASKS items.
 */
function deduplicateAndLimit(newItems, existingItems) {
  const seen = new Set();
  for (const item of existingItems) {
    for (const k of buildKeys(item)) seen.add(k);
  }
  const result = [];
  for (const item of newItems) {
    if (result.length >= MAX_TASKS) break;
    const keys = buildKeys(item);
    if (keys.some((k) => seen.has(k))) continue;
    result.push(item);
    for (const k of keys) seen.add(k);
  }
  return result;
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TasksPage() {
  const { addBusiness, businesses } = useData();
  const [tasks, setTasks] = useState(MOCK_TASKS);
  const [approved, setApproved] = useState(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [dataSource, setDataSource] = useState('mock'); // 'mock' | 'osm' | 'file'
  const fileInputRef = useRef(null);

  function handleApprove(task) {
    addBusiness({
      name:         task.name,
      type:         task.category  || '—',
      district:     task.district  || '—',
      address:      task.address   || '—',
      status:       'untouched',
      phone:        task.phone     || '',
      email:        task.email     || '',
      note:         '',
      nextAction:   '',
      followUpDate: '',
      lat: task.lat ?? 52.2297,
      lng: task.lng ?? 21.0122,
    });
    setApproved((prev) => new Set([...prev, task.id]));
    setTimeout(() => setTasks((prev) => prev.filter((t) => t.id !== task.id)), 800);
  }

  function handleSkip(taskId) {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  }

  // Top up tasks to MAX_TASKS from OSM; keep existing tasks, skip duplicates
  async function handleRefresh() {
    const needed = MAX_TASKS - tasks.length;
    if (needed <= 0) return;

    setRefreshing(true);
    setUploadError('');
    try {
      // Fetch more than needed to compensate for dedup losses
      const fetchLimit = Math.min(needed * 6, 600);
      const results = await fetchWarsawBusinesses({ limit: fetchLimit, timeout: 25 });
      if (!results.length) throw new Error('Empty response');

      const mapped = results.map((r) => ({
        id:       r.osm_id,
        name:     r.name,
        category: r.category,
        district: r.district || '',
        address:  r.address  || '',
        website:  r.website  || '',
        phone:    r.phone    || '',
        email:    r.email    || '',
        lat:      r.lat,
        lng:      r.lng,
      }));

      // Deduplicate against current tasks + already-added businesses
      const newItems = deduplicateAndLimit(mapped, [...tasks, ...businesses]);
      const toAdd = newItems.slice(0, needed);

      if (toAdd.length > 0) {
        setTasks((prev) => [...prev, ...toAdd]);
        setDataSource('osm');
      }
    } catch {
      // Fall back: top up with mock items not already in the list
      const newMock = deduplicateAndLimit(MOCK_TASKS, [...tasks, ...businesses]);
      const toAdd = newMock.slice(0, needed);
      if (toAdd.length > 0) {
        setTasks((prev) => [...prev, ...toAdd]);
        if (tasks.length === 0) setDataSource('mock');
      }
      setUploadError('OSM unavailable — added mock data.');
    } finally {
      setRefreshing(false);
    }
  }

  // Upload CSV or JSON file
  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!fileInputRef.current) return;
    fileInputRef.current.value = '';
    if (!file) return;
    setUploadError('');

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target.result;
        let parsed = [];
        if (file.name.endsWith('.json')) {
          const json = JSON.parse(text);
          const arr = Array.isArray(json) ? json : json.businesses ?? json.data ?? [];
          parsed = arr.map((r, i) => ({
            id:       `up-${i}-${Date.now()}`,
            name:     r.name ?? '',
            category: r.category ?? r.type ?? '',
            district: r.district ?? '',
            address:  r.address ?? '',
            website:  r.website ?? '',
          })).filter((r) => r.name);
        } else {
          parsed = parseCSV(text);
        }
        if (!parsed.length) { setUploadError('No valid records found. Check column names.'); return; }
        const deduped = deduplicateAndLimit(parsed, businesses);
        setApproved(new Set());
        setTasks(deduped);
        setDataSource('file');
      } catch {
        setUploadError('Failed to parse file. Use CSV or JSON format.');
      }
    };
    reader.readAsText(file);
  }

  function normalizeUrl(raw) {
    if (!raw) return null;
    return raw.startsWith('http') ? raw : `https://${raw}`;
  }

  const actions = (
    <div className="flex items-center gap-2">
      {uploadError && (
        <span className="text-[12px] text-red-500 font-medium">{uploadError}</span>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.json"
        className="hidden"
        onChange={handleFileChange}
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium border border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-900 bg-white transition-colors"
      >
        <IconUpload /> Upload database
      </button>
      <button
        onClick={handleRefresh}
        disabled={refreshing}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium border border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-900 bg-white transition-colors disabled:opacity-50"
      >
        <IconRefresh spinning={refreshing} />
        {refreshing ? 'Refreshing…' : 'Refresh tasks'}
      </button>
    </div>
  );

  return (
    <Layout fullWidth>
      <PageHeader
        title="Tasks"
        count={tasks.length}
        subtitle="Review potential businesses and approve them into the pipeline."
        action={actions}
      />

      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <p className="text-[15px] font-semibold text-gray-700 mb-1">All done!</p>
          <p className="text-[13px] text-gray-400 mb-4">No pending businesses to review.</p>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium border border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-900 bg-white transition-colors"
          >
            <IconRefresh spinning={refreshing} /> Refresh tasks
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Business</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Category</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">District</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Address</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Website</th>
                <th className="text-right px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {tasks.map((task) => {
                const isApproved = approved.has(task.id);
                const url = normalizeUrl(task.website);
                return (
                  <tr
                    key={task.id}
                    className={`transition-colors ${isApproved ? 'bg-emerald-50/60' : 'hover:bg-gray-50/70'}`}
                  >
                    <td className="px-4 py-3">
                      <span className="font-semibold text-gray-900">{task.name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-gray-100 text-gray-600">
                        {task.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{task.district}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-gray-400 text-[12px]">
                        <IconMapPin />
                        {task.address}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {url ? (
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-[12px] text-blue-500 hover:text-blue-700 hover:underline transition-colors"
                        >
                          <IconLink />
                          {task.website}
                        </a>
                      ) : (
                        <span className="text-[12px] text-gray-200">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {isApproved ? (
                          <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-emerald-600">
                            <IconCheck /> Added
                          </span>
                        ) : (
                          <>
                            <button
                              onClick={() => handleApprove(task)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-gray-900 text-white hover:bg-gray-800 transition-colors"
                            >
                              <IconCheck /> Approve
                            </button>
                            <button
                              onClick={() => handleSkip(task.id)}
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

          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/40 flex items-center gap-3">
            <p className="text-[12px] text-gray-400">{tasks.length} pending review</p>
            {dataSource === 'osm' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 text-blue-500">
                OpenStreetMap
              </span>
            )}
            {dataSource === 'file' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-50 text-amber-600">
                Uploaded file
              </span>
            )}
            {dataSource === 'mock' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-gray-100 text-gray-400">
                Mock data
              </span>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}
