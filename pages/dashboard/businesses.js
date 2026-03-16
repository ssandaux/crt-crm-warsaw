import { useState, useMemo, useRef, useEffect } from 'react';
import Layout from '../../components/Layout';
import AddBusinessModal from '../../components/AddBusinessModal';
import PageHeader from '../../components/PageHeader';
import { useData } from '../../components/DataContext';
import { types, districts, statuses } from '../../mockData/businesses';
import { STATUS_CONFIG, selectCls, inputCls, BtnPrimary, BtnSecondary, BtnGhost } from '../../components/ui';
import BusinessProfile from '../../components/BusinessProfile';
import { EditModal, DeleteConfirm } from '../../components/BusinessModals';

const COLUMNS = [
  { key: 'name',       label: 'Business' },
  { key: 'status',     label: 'Status' },
  { key: 'type',       label: 'Type' },
  { key: 'district',   label: 'District' },
  { key: 'contact',    label: 'Email' },
  { key: 'lastAction',  label: 'Last action' },
  { key: 'followUpDate', label: 'Reminder' },
  { key: 'note',        label: 'Note', noSort: true },
  { key: 'actions',    label: 'Actions', noSort: true },
];

const VIEW_TABS = [
  { key: 'table', label: 'Table', icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 6h18M3 14h18M3 18h18" /></svg> },
  { key: 'board', label: 'Board', icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" /></svg> },
];

const PAGE_SIZES = [10, 25, 50, 100];
const EMPTY_FORM = { name: '', type: '', district: '', address: '', phone: '', email: '', status: 'contacted', note: '' };

function SortIcon({ active, dir }) {
  return (
    <span className="inline-flex flex-col gap-[2px] ml-1.5">
      <span className={`block w-0 h-0 border-x-[3px] border-x-transparent border-b-[4px] transition-colors ${active && dir === 'asc' ? 'border-b-gray-700' : 'border-b-gray-300'}`} />
      <span className={`block w-0 h-0 border-x-[3px] border-x-transparent border-t-[4px] transition-colors ${active && dir === 'desc' ? 'border-t-gray-700' : 'border-t-gray-300'}`} />
    </span>
  );
}

function IconEdit() {
  return <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
}
function IconDelete() {
  return <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
}
function IconClose() {
  return <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
}

// ─── Inline status selector ───────────────────────────────────────────────────
function StatusSelect({ biz, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const cfg = STATUS_CONFIG[biz.status];

  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 group rounded-md px-1 -mx-1 py-0.5 hover:bg-gray-100 transition-colors"
      >
        <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
        <span className={`text-[13px] font-medium ${cfg.text}`}>{cfg.label}</span>
        <svg xmlns="http://www.w3.org/2000/svg" className="w-2.5 h-2.5 text-gray-300 group-hover:text-gray-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 bg-white rounded-xl border border-gray-200 shadow-xl z-50 overflow-hidden min-w-[120px]">
          {statuses.map((s) => {
            const c = STATUS_CONFIG[s];
            return (
              <button
                key={s}
                onClick={() => { onChange(biz.id, s); setOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-medium transition-colors text-left ${biz.status === s ? 'bg-gray-50 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.dot}`} />
                {c.label}
                {biz.status === s && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 ml-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Board View ───────────────────────────────────────────────────────────────
const BOARD_ORDER = ['untouched', 'contacted', 'agreed', 'rejected', 'client'];

function BoardView({ businesses, onEdit, onDelete, onStatusChange, onProfile }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {BOARD_ORDER.map((s) => {
        const cfg = STATUS_CONFIG[s];
        const cards = businesses.filter((b) => b.status === s);
        return (
          <div key={s} className="flex-1 min-w-[200px]">
            <div className="flex items-center gap-2 mb-2.5 px-1">
              <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.color}`} />
              <span className="text-[12px] font-semibold text-gray-600">{cfg.label}</span>
              <span className="ml-auto text-[11px] text-gray-400 font-medium bg-gray-100 px-1.5 py-0.5 rounded-md">{cards.length}</span>
            </div>
            <div className="space-y-2">
              {cards.map((biz) => (
                <div key={biz.id} className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm hover:shadow-md transition-shadow group">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <button onClick={() => onProfile(biz)} className="text-[13px] font-semibold text-gray-900 truncate leading-tight hover:text-gray-600 transition-colors text-left w-full">{biz.name}</button>
                      <p className="text-[11px] text-gray-400 mt-0.5 truncate">{biz.type} · {biz.district}</p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button onClick={() => onEdit(biz)} className="p-1 text-gray-400 hover:text-gray-700 transition-colors rounded"><IconEdit /></button>
                      <button onClick={() => onDelete(biz)} className="p-1 text-gray-400 hover:text-red-500 transition-colors rounded"><IconDelete /></button>
                    </div>
                  </div>
                  {biz.note && <p className="text-[11px] text-gray-400 italic truncate mb-2">{biz.note}</p>}
                  <div className="flex gap-1">
                    {statuses.map((ns) => (
                      <button key={ns} onClick={() => onStatusChange(biz.id, ns)}
                        className={`flex-1 py-0.5 rounded-md text-[10px] font-medium transition-all border ${ns === biz.status ? `${STATUS_CONFIG[ns].badge} border-transparent` : 'border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600 bg-white'}`}>
                        {STATUS_CONFIG[ns].label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {cards.length === 0 && (
                <div className="border-2 border-dashed border-gray-100 rounded-xl p-5 text-center">
                  <p className="text-[11px] text-gray-300">No businesses</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function BusinessesPage() {
  const { businesses, addBusiness, updateBusiness, deleteBusiness, deleteBusinesses, changeStatus, bulkChangeStatus } = useData();

  const [search, setSearch]               = useState('');
  const [filterStatus, setFilterStatus]   = useState('');
  const [filterType, setFilterType]       = useState('');
  const [filterDistrict, setFilterDistrict] = useState('');
  const [sortKey, setSortKey]             = useState('name');
  const [sortDir, setSortDir]             = useState('asc');
  const [activeView, setActiveView]       = useState('table');
  const [page, setPage]                   = useState(1);
  const [pageSize, setPageSize]           = useState(25);
  const [selected, setSelected]           = useState(new Set());
  const [showAddModal, setShowAddModal]   = useState(false);
  const [editBiz, setEditBiz]             = useState(null);
  const [deleteBiz, setDeleteBiz]         = useState(null);
  const [profileBiz, setProfileBiz]       = useState(null);
  const [bulkStatusMenu, setBulkStatusMenu] = useState(false);

  const hasFilters = search || filterStatus || filterType || filterDistrict;

  function handleSort(key) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  }

  const filtered = useMemo(() => {
    let rows = [...(businesses ?? [])].filter((b) => b.status !== 'skipped');
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((b) => b.name.toLowerCase().includes(q) || b.email?.toLowerCase().includes(q) || b.note?.toLowerCase().includes(q));
    }
    if (filterStatus) rows = rows.filter((b) => b.status === filterStatus);
    if (filterType)   rows = rows.filter((b) => b.type === filterType);
    if (filterDistrict) rows = rows.filter((b) => b.district === filterDistrict);
    rows.sort((a, b) => {
      const av = a[sortKey] ?? '', bv = b[sortKey] ?? '';
      return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
    return rows;
  }, [businesses, search, filterStatus, filterType, filterDistrict, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function toggleRow(id) {
    setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function toggleAll() {
    const ids = pageRows.map((r) => r.id);
    const all = ids.every((id) => selected.has(id));
    setSelected((prev) => { const n = new Set(prev); ids.forEach((id) => all ? n.delete(id) : n.add(id)); return n; });
  }
  const allOnPageSelected = pageRows.length > 0 && pageRows.every((r) => selected.has(r.id));
  const selectedIds = [...selected];

  function handleAddSubmit({ name, type, district, status, address, phone, email, website, note, coords }) {
    addBusiness({
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
    setShowAddModal(false);
  }

  function handleEdit(biz) { setProfileBiz(null); setEditBiz(biz); }
  function handleSaveEdit(changes) {
    updateBusiness(editBiz.id, changes);
    setEditBiz(null);
  }
  function handleDelete(biz) { setProfileBiz(null); setDeleteBiz(biz); }
  function handleConfirmDelete() {
    deleteBusiness(deleteBiz.id);
    setSelected((prev) => { const n = new Set(prev); n.delete(deleteBiz.id); return n; });
    setDeleteBiz(null);
  }
  function handleBulkDelete() {
    deleteBusinesses(selectedIds);
    setSelected(new Set());
  }
  function handleBulkStatus(status) {
    bulkChangeStatus(selectedIds, status);
    setBulkStatusMenu(false);
    setSelected(new Set());
  }

  // Export CSV
  function handleExport() {
    const header = ['ID', 'Name', 'Type', 'District', 'Address', 'Phone', 'Email', 'Status', 'Last Action', 'Note'];
    const rows = filtered.map((b) => [
      b.id, b.name, b.type, b.district, b.address ?? '', b.phone ?? '', b.email ?? '',
      b.status, b.lastAction, (b.note ?? '').replace(/,/g, ';'),
    ]);
    const csv = [header, ...rows].map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crm-warsaw-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

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

  return (
    <Layout fullWidth>
      {showAddModal && <AddBusinessModal onClose={() => setShowAddModal(false)} onSubmit={handleAddSubmit} />}
      {editBiz    && <EditModal biz={editBiz} onClose={() => setEditBiz(null)} onSave={handleSaveEdit} />}
      {deleteBiz  && <DeleteConfirm biz={deleteBiz} onClose={() => setDeleteBiz(null)} onConfirm={handleConfirmDelete} />}
      {profileBiz && <BusinessProfile biz={profileBiz} onClose={() => setProfileBiz(null)} onEdit={handleEdit} onDelete={handleDelete} />}

      <PageHeader
        title="Businesses"
        count={businesses?.filter((b) => b.status !== 'skipped').length ?? 0}
        subtitle="Track and manage all companies in the Warsaw pipeline."
        action={
          <div className="flex items-center gap-2">
            <BtnSecondary type="button" onClick={handleExport}>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Export
            </BtnSecondary>
            <button onClick={() => setShowAddModal(true)} className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white text-[13px] font-semibold px-4 py-2 rounded-lg transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              Add business
            </button>
          </div>
        }
      />

      {/* Bulk actions bar */}
      {selectedIds.length > 0 && (
        <div className="sticky top-4 z-30 flex items-center gap-3 mb-4 px-4 py-2.5 bg-white border border-gray-200 rounded-xl shadow-sm text-[13px]">
          <span className="font-semibold text-gray-900">{selectedIds.length} selected</span>
          <div className="w-px h-4 bg-gray-200" />
          <div className="relative">
            <button onClick={() => setBulkStatusMenu((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-900 transition-colors text-[12px] font-medium">
              Change status
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </button>
            {bulkStatusMenu && (
              <div className="absolute top-full left-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-xl z-50 overflow-hidden min-w-[130px]">
                {statuses.map((s) => {
                  const c = STATUS_CONFIG[s];
                  return (
                    <button key={s} onClick={() => handleBulkStatus(s)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-gray-700 hover:bg-gray-50 transition-colors text-left">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.color}`} />
                      {c.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <button onClick={handleBulkDelete}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:border-red-300 transition-colors text-[12px] font-medium">
            <IconDelete /> Delete
          </button>
          <button onClick={() => setSelected(new Set())} className="ml-auto text-gray-300 hover:text-gray-600 transition-colors">
            <IconClose />
          </button>
        </div>
      )}

      {/* View tabs + filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
        <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-1 self-start">
          {VIEW_TABS.map((tab) => (
            <button key={tab.key} onClick={() => setActiveView(tab.key)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-all ${activeView === tab.key ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:flex-1 sm:justify-end">
          <div className="relative flex-1 sm:flex-none">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input type="text" placeholder="Search..." value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full sm:w-48 pl-8 pr-3 py-[7px] text-[13px] text-gray-700 bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent placeholder-gray-400 transition hover:border-gray-300" />
          </div>
          <div className="w-px h-5 bg-gray-200" />
          <StatusSelect
            value={filterStatus}
            onChange={(v) => { setFilterStatus(v); setPage(1); }}
            statuses={statuses}
          />
          <select value={filterType} onChange={(e) => { setFilterType(e.target.value); setPage(1); }} className={selectCls}>
            <option value="">All types</option>
            {types.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={filterDistrict} onChange={(e) => { setFilterDistrict(e.target.value); setPage(1); }} className={selectCls}>
            <option value="">All districts</option>
            {districts.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          {hasFilters && (
            <button onClick={() => { setSearch(''); setFilterStatus(''); setFilterType(''); setFilterDistrict(''); setPage(1); }}
              className="text-[12px] text-gray-400 hover:text-gray-700 flex items-center gap-1 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Board view */}
      {activeView === 'board' && (
        <BoardView businesses={filtered} onEdit={handleEdit} onDelete={handleDelete} onStatusChange={changeStatus} onProfile={setProfileBiz} />
      )}

      {/* Table view */}
      {activeView === 'table' && (
        <>
        {/* Mobile cards */}
        <div className="md:hidden space-y-3">
          {pageRows.map((biz) => {
            const cfg = STATUS_CONFIG[biz.status];
            return (
              <div key={biz.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <button onClick={() => setProfileBiz(biz)} className="text-[14px] font-semibold text-gray-900 text-left leading-snug flex-1">
                    {biz.name}
                  </button>
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold shrink-0 ${cfg.badge}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                    {cfg.label}
                  </span>
                </div>
                <p className="text-[12px] text-gray-400 mb-3">{biz.type} {biz.district && biz.district !== '—' ? `· ${biz.district}` : ''}</p>
                <div className="flex items-center gap-3 mb-3 flex-wrap">
                  {biz.phone && biz.phone !== '—' && (
                    <a href={`tel:${biz.phone}`} className="text-[13px] text-gray-600 font-medium">{biz.phone}</a>
                  )}
                  {biz.website && biz.website !== '—' && (
                    <a href={biz.website.startsWith('http') ? biz.website : `https://${biz.website}`} target="_blank" rel="noopener noreferrer"
                      className="text-[13px] text-blue-500 truncate max-w-[180px]">
                      {biz.website.replace(/^https?:\/\/(www\.)?/, '')}
                    </a>
                  )}
                </div>
                <div className="flex gap-2 pt-3 border-t border-gray-100">
                  <button onClick={() => setProfileBiz(biz)}
                    className="flex-1 min-h-[40px] rounded-lg text-[12px] font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">
                    View
                  </button>
                  <button onClick={() => handleEdit(biz)}
                    className="flex-1 min-h-[40px] rounded-lg text-[12px] font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(biz)}
                    className="min-h-[40px] px-3 rounded-lg text-[12px] font-medium text-red-500 border border-red-100 bg-red-50 hover:bg-red-100 transition-colors">
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
          {/* Mobile pagination */}
          <div className="flex items-center justify-between pt-2 pb-4">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}
              className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 text-gray-400 disabled:opacity-30">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <span className="text-[13px] text-gray-500">{currentPage} / {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
              className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 text-gray-400 disabled:opacity-30">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="w-10 pl-4 pr-2 py-3">
                  <input type="checkbox" checked={allOnPageSelected} onChange={toggleAll}
                    className="w-3.5 h-3.5 rounded border-gray-300 accent-gray-800 cursor-pointer" />
                </th>
                {COLUMNS.map((col) => (
                  <th key={col.key} onClick={() => !col.noSort && handleSort(col.key)}
                    className={`text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap ${!col.noSort ? 'cursor-pointer hover:text-gray-700 select-none' : ''}`}>
                    <span className="inline-flex items-center">
                      {col.label}
                      {!col.noSort && <SortIcon active={sortKey === col.key} dir={sortDir} />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {pageRows.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-16 text-center text-[13px] text-gray-400">No businesses match your filters.</td></tr>
              ) : pageRows.map((biz) => (
                <tr key={biz.id} className={`hover:bg-gray-50/70 transition-colors group ${selected.has(biz.id) ? 'bg-gray-50' : ''}`}>
                  <td className="w-10 pl-4 pr-2 py-3">
                    <input type="checkbox" checked={selected.has(biz.id)} onChange={() => toggleRow(biz.id)}
                      className="w-3.5 h-3.5 rounded border-gray-300 accent-gray-800 cursor-pointer" />
                  </td>
                  <td className="px-4 py-3"><button onClick={() => setProfileBiz(biz)} className="font-semibold text-gray-900 hover:text-gray-600 text-left transition-colors">{biz.name}</button></td>
                  <td className="px-4 py-3"><StatusSelect biz={biz} onChange={changeStatus} /></td>
                  <td className="px-4 py-3 text-gray-500">{biz.type}</td>
                  <td className="px-4 py-3 text-gray-500">{biz.district}</td>
                  <td className="px-4 py-3 text-gray-400 text-[12px]">{biz.email}</td>
                  <td className="px-4 py-3 text-gray-400 text-[12px] whitespace-nowrap">
                    {new Date(biz.lastAction).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3 text-[12px] whitespace-nowrap">
                    {biz.followUpDate ? (() => {
                      const overdue = new Date(biz.followUpDate) < new Date(new Date().toDateString());
                      return (
                        <span className={overdue ? 'text-red-500 font-medium' : 'text-gray-400'}>
                          {new Date(biz.followUpDate + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                          {overdue && ' ·'}
                        </span>
                      );
                    })() : <span className="text-gray-200">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-[12px] max-w-[140px] truncate">{biz.note}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <button onClick={() => handleEdit(biz)} className="inline-flex items-center gap-1 text-[12px] text-gray-400 hover:text-gray-800 transition-colors font-medium">
                        <IconEdit /> Edit
                      </button>
                      <button onClick={() => handleDelete(biz)} className="inline-flex items-center gap-1 text-[12px] text-gray-400 hover:text-red-500 transition-colors font-medium">
                        <IconDelete /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <p className="text-[12px] text-gray-400">
                {filtered.length === 0 ? '0 results'
                  : `${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, filtered.length)} of ${filtered.length} result${filtered.length !== 1 ? 's' : ''}`}
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
        </>
      )}
    </Layout>
  );
}
