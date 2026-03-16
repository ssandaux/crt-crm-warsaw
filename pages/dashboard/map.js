import { useState, useMemo, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import AddBusinessModal from '../../components/AddBusinessModal';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import { useData } from '../../components/DataContext';
import { districts, statuses } from '../../mockData/businesses';
import { STATUS_CONFIG, StatusSelect, selectCls, inputCls } from '../../components/ui';
import BusinessProfile from '../../components/BusinessProfile';
import { EditModal, DeleteConfirm } from '../../components/BusinessModals';
import { importFromGoogle, getImportWaveInfo, TOTAL_WAVES } from '../../lib/importGoogle';

const GoogleMapComp = dynamic(() => import('../../components/GoogleMapComp'), { ssr: false });


const SKIP_TYPES = new Set(['point_of_interest', 'establishment', 'premise', 'political', 'locality', 'sublocality', 'sublocality_level_1', 'country', 'postal_code', 'route', 'street_address']);
function formatType(types = []) {
  const t = (types || []).find((t) => !SKIP_TYPES.has(t));
  return t ? t.replace(/_/g, ' ') : 'Business';
}
function formatWebsite(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
}

function PlacePanel({ place, onClose, onAddToCrm }) {
  return (
    <>
      <div className="fixed inset-0 z-[1500]" onClick={onClose} />
      <div className="fixed top-0 right-0 h-screen w-[300px] bg-white border-l border-gray-200 shadow-2xl z-[1600] flex flex-col overflow-hidden">
        <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-gray-100">
          <div className="flex-1 min-w-0 pr-3">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Google Place</p>
            <h2 className="text-[15px] font-bold text-gray-900 leading-snug">{place.name}</h2>
            {place.types?.length > 0 && (
              <span className="inline-block mt-1.5 text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full capitalize">
                {formatType(place.types)}
              </span>
            )}
          </div>
          <button onClick={onClose} className="mt-0.5 p-1.5 text-gray-400 hover:text-gray-700 transition-colors rounded-lg hover:bg-gray-100 shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {place.address && (
            <div className="flex items-start gap-2 text-[12px] text-gray-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 shrink-0 mt-0.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{place.address}</span>
            </div>
          )}
          {place.phone && (
            <a href={`tel:${place.phone}`} className="flex items-center gap-2 text-[12px] text-gray-600 hover:text-gray-900 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              {place.phone}
            </a>
          )}
          {place.website && (
            <a href={place.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[12px] text-blue-600 hover:text-blue-700 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              {formatWebsite(place.website)}
            </a>
          )}
        </div>
        <div className="px-5 pb-5 pt-3 border-t border-gray-100">
          <button
            onClick={onAddToCrm}
            className="w-full py-2 bg-gray-900 text-white text-[13px] font-semibold rounded-xl hover:bg-gray-800 transition-all"
          >
            + Add to CRM
          </button>
        </div>
      </div>
    </>
  );
}

const STATUS_DOT_COLORS = {
  client:    'bg-blue-500',
  agreed:    'bg-emerald-500',
  contacted: 'bg-amber-400',
  rejected:  'bg-red-500',
  untouched: 'bg-gray-400',
};

function IconPhone() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  );
}
function IconMail() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}
function IconClose() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function ToolbarBtn({ active, activeClass, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium border transition-all ${
        active
          ? activeClass
          : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700'
      }`}
    >
      {children}
    </button>
  );
}


export default function MapPage() {
  const { businesses, addBusiness, updateBusiness, deleteBusiness, changeStatus: ctxChangeStatus } = useData();
  const googleMapRef = useRef(null);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('');
  const [showUncontacted, setShowUncontacted] = useState(false);
  const [clusterMode, setClusterMode] = useState(true);
  const [showDistricts, setShowDistricts] = useState(false);
  const [showPoiMarkers, setShowPoiMarkers] = useState(true);
  const [importConfirm, setImportConfirm] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(null);
  const [importDone, setImportDone] = useState(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [pickingLocation, setPickingLocation] = useState(false);
  const [pendingCoords, setPendingCoords] = useState(null);
  const [poiDefaults, setPoiDefaults] = useState(null);
  const [selectedPoi, setSelectedPoi] = useState(null);
  const [editBiz, setEditBiz] = useState(null);
  const [deleteBiz, setDeleteBiz] = useState(null);
  const [relocatingId, setRelocatingId] = useState(null);

  const markers = businesses ?? [];
  const selectedMarker = markers.find((m) => m.id === selected) ?? null;

  function changeStatus(id, newStatus) {
    ctxChangeStatus(id, newStatus);
  }

  function handleMapClick(e) {
    if (pickingLocation) {
      setPendingCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
      setPickingLocation(false);
      setShowAddModal(true);
    } else if (relocatingId) {
      updateBusiness(relocatingId, { lat: e.latlng.lat, lng: e.latlng.lng });
      setRelocatingId(null);
    } else {
      setSelected(null);
    }
  }

  function handleRelocate(biz) {
    setRelocatingId(biz.id);
  }

  function openAddModal() {
    setPendingCoords(null);
    setShowAddModal(true);
  }

  function handlePickOnMap() {
    setShowAddModal(false);
    setPickingLocation(true);
  }

  function handleAddSubmit({ name, type, district, status, address, phone, email, website, note, coords }) {
    const newBiz = addBusiness({
      name: name.trim(),
      type: type.trim() || '—',
      district,
      status,
      address: address.trim() || '—',
      phone: phone.trim() || '—',
      email: email.trim() || '—',
      website: website?.trim() || '',
      note: note.trim() || '',
      lat: coords?.lat ?? 52.2297,
      lng: coords?.lng ?? 21.0122,
    });
    setSelected(newBiz.id);
    setShowAddModal(false);
    setPendingCoords(null);
  }

  function toggleUncontacted() {
    if (!showUncontacted) setFilterStatus('');
    setShowUncontacted((v) => !v);
  }

  function handleFilterStatus(val) {
    setFilterStatus(val);
    if (val) setShowUncontacted(false);
    setSelected(null);
  }

  const filtered = useMemo(() => {
    let rows = markers;
    if (showUncontacted) rows = rows.filter((b) => b.status === 'untouched');
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((b) => b.name.toLowerCase().includes(q) || b.district.toLowerCase().includes(q) || b.type.toLowerCase().includes(q));
    }
    if (filterStatus) rows = rows.filter((b) => b.status === filterStatus);
    if (filterDistrict) rows = rows.filter((b) => b.district === filterDistrict);
    return rows;
  }, [markers, search, filterStatus, filterDistrict, showUncontacted]);

  const counts = statuses.reduce((acc, s) => {
    acc[s] = markers.filter((m) => m.status === s).length;
    return acc;
  }, {});


  const hasFilters = search || filterStatus || filterDistrict || showUncontacted;

  async function handleGoogleImport() {
    if (!googleMapRef.current) return;
    setImportConfirm(false);
    setImporting(true);
    setImportDone(null);
    setImportProgress(null);
    try {
      const result = await importFromGoogle(googleMapRef.current, (progress) => setImportProgress(progress));
      setImportDone(result);
      window.location.reload();
    } catch {
      setImporting(false);
    }
  }

  function handlePoiClick(placeData) {
    setSelected(null);
    setSelectedPoi(placeData);
  }

  function handleAddPoiToCrm() {
    const poi = selectedPoi;
    setSelectedPoi(null);
    const streetAddress = poi.address.split(',')[0] || poi.address;
    setPendingCoords({ lat: poi.lat, lng: poi.lng });
    setPoiDefaults({
      name: poi.name,
      type: formatType(poi.types),
      address: streetAddress,
      phone: poi.phone || '',
      website: poi.website || '',
    });
    setShowAddModal(true);
  }

  function handleEditFromProfile(biz) { setSelected(null); setEditBiz(biz); }
  function handleDeleteFromProfile(biz) { setSelected(null); setDeleteBiz(biz); }
  function handleConfirmDelete() {
    deleteBusiness(deleteBiz.id);
    setDeleteBiz(null);
  }

  return (
    <Layout fullWidth>
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
                  <p className="text-[11px] text-gray-400 mt-1.5 capitalize">{importProgress.status}…{importProgress.count != null ? ` ${importProgress.count} places` : ''}</p>
                </div>
                <p className="text-[12px] text-gray-500 pt-2 border-t border-gray-100">
                  Added to CRM: <span className="font-semibold text-gray-900">{importProgress.totalInserted?.toLocaleString() ?? 0}</span>
                </p>
              </div>
            )}
          </div>
        </div>
      )}
      {showAddModal && (
        <AddBusinessModal
          onClose={() => { setShowAddModal(false); setPendingCoords(null); setPoiDefaults(null); }}
          onSubmit={handleAddSubmit}
          onPickOnMap={handlePickOnMap}
          pendingCoords={pendingCoords}
          defaultValues={poiDefaults}
        />
      )}
      {editBiz   && <EditModal biz={editBiz} onClose={() => setEditBiz(null)} onSave={(changes) => { updateBusiness(editBiz.id, changes); setEditBiz(null); }} />}
      {deleteBiz && <DeleteConfirm biz={deleteBiz} onClose={() => setDeleteBiz(null)} onConfirm={handleConfirmDelete} />}
      {selectedPoi && !showAddModal && (
        <PlacePanel
          place={selectedPoi}
          onClose={() => setSelectedPoi(null)}
          onAddToCrm={handleAddPoiToCrm}
        />
      )}
      {selectedMarker && !showAddModal && !editBiz && !deleteBiz && !selectedPoi && (
        <BusinessProfile
          biz={selectedMarker}
          onClose={() => { setSelected(null); setRelocatingId(null); }}
          onEdit={handleEditFromProfile}
          onDelete={handleDeleteFromProfile}
          onStatusChange={changeStatus}
          onFollowUpChange={(id, date) => updateBusiness(id, { followUpDate: date || null })}
          onRelocate={handleRelocate}
          noBackdrop
        />
      )}

      <PageHeader
        title="Map"
        count={markers.length}

        subtitle="Businesses across Warsaw by location and status."
        action={
          <div className="flex flex-col items-end gap-2">
            <button
              onClick={() => setImportConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 text-white text-[13px] font-semibold hover:bg-gray-800 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Import from Google
            </button>
            <button
              onClick={openAddModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Business
            </button>
          </div>
        }
      />

      {/* Search + filter bar */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className="relative flex-1 sm:flex-none">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search business, district..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-56 pl-8 pr-3 py-[7px] text-[13px] text-gray-700 bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent placeholder-gray-400 transition hover:border-gray-300"
          />
        </div>

        <div className="w-px h-5 bg-gray-200" />

        <StatusSelect
          value={filterStatus}
          onChange={handleFilterStatus}
          statuses={statuses}
        />

        <select value={filterDistrict} onChange={(e) => { setFilterDistrict(e.target.value); setSelected(null); }} className={selectCls}>
          <option value="">All districts</option>
          {districts.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>

        {hasFilters && (
          <button
            onClick={() => { setSearch(''); setFilterStatus(''); setFilterDistrict(''); setShowUncontacted(false); }}
            className="text-[12px] text-gray-400 hover:text-gray-700 flex items-center gap-1 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear
          </button>
        )}

        <span className="ml-auto text-[12px] text-gray-400">
          {filtered.length} of {markers.length} shown
        </span>
      </div>

      {/* Toolbar + Stats */}
      <div className="flex flex-wrap items-center gap-1.5 mb-4">
        <ToolbarBtn
          active={showUncontacted}
          activeClass="bg-gray-100 border-gray-300 text-gray-700"
          onClick={toggleUncontacted}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />
          Untouched only
        </ToolbarBtn>

        <ToolbarBtn
          active={clusterMode}
          activeClass="bg-gray-100 border-gray-300 text-gray-800"
          onClick={() => setClusterMode((v) => !v)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="3" strokeLinecap="round" />
            <circle cx="5" cy="5" r="2" strokeLinecap="round" />
            <circle cx="19" cy="5" r="2" strokeLinecap="round" />
            <circle cx="5" cy="19" r="2" strokeLinecap="round" />
            <circle cx="19" cy="19" r="2" strokeLinecap="round" />
          </svg>
          Cluster markers
        </ToolbarBtn>

        <ToolbarBtn
          active={showDistricts}
          activeClass="bg-blue-50 border-blue-200 text-blue-700"
          onClick={() => setShowDistricts((v) => !v)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          Districts
        </ToolbarBtn>

        <ToolbarBtn
          active={!showPoiMarkers}
          activeClass="bg-gray-100 border-gray-300 text-gray-800"
          onClick={() => setShowPoiMarkers((v) => !v)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {showPoiMarkers ? 'Hide Google places' : 'Show Google places'}
        </ToolbarBtn>

        {/* Stats — right side */}
        <div className="ml-auto flex items-center gap-5">
          {statuses.map((s) => {
            const cfg = STATUS_CONFIG[s];
            return (
              <div key={s} className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.color}`} />
                <span className="text-[12px] text-gray-400 font-medium">{cfg.label}</span>
                <span className="text-[13px] font-bold text-gray-700">{counts[s]}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Map — full width */}
      <div>
          <div
            className="relative w-full rounded-2xl border border-gray-200 overflow-hidden shadow-sm"
            style={{ height: 'calc(100dvh - 320px)', minHeight: '320px' }}
          >
            {/* Pick location banner */}
            {pickingLocation && (
              <div className="absolute inset-x-0 top-0 z-[1001] flex items-center justify-center gap-3 bg-gray-900/90 text-white text-[12px] font-medium px-4 py-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                Click on the map to set the business location
                <button
                  onClick={() => { setPickingLocation(false); setShowAddModal(true); }}
                  className="ml-2 text-white/60 hover:text-white transition-colors underline"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Relocate pin banner */}
            {relocatingId && (
              <div className="absolute inset-x-0 top-0 z-[1001] flex items-center justify-center gap-3 bg-blue-900/90 text-white text-[12px] font-medium px-4 py-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-300 animate-pulse shrink-0" />
                Click on the map to move the pin to a new location
                <button
                  onClick={() => setRelocatingId(null)}
                  className="ml-2 text-white/60 hover:text-white transition-colors underline"
                >
                  Cancel
                </button>
              </div>
            )}

            <GoogleMapComp
              markers={filtered}
              selectedId={selected}
              onMarkerClick={(id) => { setSelectedPoi(null); setSelected((prev) => (prev === id ? null : id)); }}
              onMapClick={handleMapClick}
              cluster={clusterMode}
              showDistricts={showDistricts}
              crosshair={!!(relocatingId || pickingLocation)}
              onPoiClick={handlePoiClick}
              showPoiMarkers={showPoiMarkers}
              onMapReady={(map) => { googleMapRef.current = map; }}
            />


            {/* Marker count */}
            <div className="absolute top-3.5 left-3.5 z-[1000] bg-white/95 backdrop-blur-sm rounded-lg border border-gray-200/80 px-3 py-1.5 shadow-sm pointer-events-none">
              <p className="text-[11px] text-gray-500">{filtered.length} locations</p>
            </div>

          </div>
      </div>
    </Layout>
  );
}
