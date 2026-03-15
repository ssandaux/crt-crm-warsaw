import { useState } from 'react';
import { geocodeWarsaw } from '../lib/geocode';
import { districts, statuses } from '../mockData/businesses';
import { STATUS_CONFIG, selectCls, inputCls } from './ui';
import { useData } from './DataContext';

const EMPTY_FORM = { name: '', type: '', district: '', status: 'untouched', address: '', phone: '', email: '', note: '' };

function IconPin() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
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

// onPickOnMap is optional — only shown on Map page
export default function AddBusinessModal({ onClose, onSubmit, onPickOnMap, pendingCoords, defaultValues }) {
  const { isDuplicate } = useData();
  const [form, setForm] = useState(defaultValues ? { ...EMPTY_FORM, ...defaultValues } : EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [dupError, setDupError] = useState('');
  const [geocodedCoords, setGeocodedCoords] = useState(null);
  const [geoStatus, setGeoStatus] = useState(null); // null | 'loading' | 'found' | 'error'

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: false }));
    if (field === 'name' || field === 'address') setDupError('');
    if (field === 'address') { setGeocodedCoords(null); setGeoStatus(null); }
  }

  async function handleAddressBlur() {
    if (!form.address.trim() || form.address.trim().length < 4) return;
    setGeoStatus('loading');
    const result = await geocodeWarsaw(form.address);
    if (result) { setGeocodedCoords(result); setGeoStatus('found'); }
    else setGeoStatus('error');
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = true;
    if (!form.district) errs.district = true;
    if (Object.keys(errs).length) { setErrors(errs); return; }
    if (isDuplicate(form.name, form.address)) {
      setDupError('A business with this name and address already exists.');
      return;
    }
    setDupError('');
    onSubmit({ ...form, coords: pendingCoords ?? geocodedCoords });
  }

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/30 backdrop-blur-[2px]" onClick={onClose}>
      <div
        className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-md mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
          <div>
            <p className="text-[15px] font-bold text-gray-900">Add Business</p>
            <p className="text-[12px] text-gray-400 mt-0.5">New entry will appear in Businesses and on the map</p>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 transition-colors">
            <IconClose />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3 max-h-[75vh] overflow-y-auto">
          {/* Name */}
          <div>
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1">Name *</label>
            <input
              type="text"
              placeholder="e.g. Café Varsovia"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              className={`${inputCls} w-full ${errors.name ? 'border-red-300 focus:ring-red-200' : ''}`}
            />
          </div>

          {/* Type + District */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1">Type</label>
              <input
                type="text"
                placeholder="e.g. Restaurant"
                value={form.type}
                onChange={(e) => set('type', e.target.value)}
                className={`${inputCls} w-full`}
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1">District *</label>
              <select
                value={form.district}
                onChange={(e) => set('district', e.target.value)}
                className={`${selectCls} w-full ${errors.district ? 'border-red-300' : ''}`}
              >
                <option value="">Select...</option>
                {districts.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1">Status</label>
            <div className="flex gap-1.5">
              {statuses.map((s) => {
                const c = STATUS_CONFIG[s];
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => set('status', s)}
                    className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
                      form.status === s
                        ? `${c.badge} border-transparent shadow-sm`
                        : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600'
                    }`}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1">
              Address
              {geoStatus === 'loading' && <span className="ml-2 text-gray-400 font-normal normal-case">Locating…</span>}
              {geoStatus === 'found'   && <span className="ml-2 text-emerald-500 font-normal normal-case">Location found</span>}
              {geoStatus === 'error'   && <span className="ml-2 text-amber-500 font-normal normal-case">Address not found{onPickOnMap ? ' — pick on map' : ''}</span>}
            </label>
            <input
              type="text"
              placeholder="e.g. Marcina Kasprzaka 29b"
              value={form.address}
              onChange={(e) => set('address', e.target.value)}
              onBlur={handleAddressBlur}
              className={`${inputCls} w-full`}
            />
          </div>

          {/* Phone + Email */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1">Phone</label>
              <input
                type="text"
                placeholder="+48 ..."
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                className={`${inputCls} w-full`}
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1">Email</label>
              <input
                type="email"
                placeholder="contact@..."
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                className={`${inputCls} w-full`}
              />
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1">Note</label>
            <textarea
              rows={2}
              placeholder="Any notes..."
              value={form.note}
              onChange={(e) => set('note', e.target.value)}
              className={`${inputCls} w-full resize-none`}
            />
          </div>

          {/* Location picker — only on Map page */}
          {onPickOnMap && (
            <div className="flex items-center gap-2 pt-0.5">
              <button
                type="button"
                onClick={onPickOnMap}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-800 transition-all"
              >
                <IconPin />
                {pendingCoords ? 'Change location' : 'Pick on map'}
              </button>
              {pendingCoords ? (
                <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                  Picked on map · {pendingCoords.lat.toFixed(4)}, {pendingCoords.lng.toFixed(4)}
                </span>
              ) : geoStatus === 'found' ? (
                <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                  From address · {geocodedCoords.lat.toFixed(4)}, {geocodedCoords.lng.toFixed(4)}
                </span>
              ) : (
                <span className="text-[11px] text-gray-400">Location will be set from address</span>
              )}
            </div>
          )}

          {/* Duplicate error */}
          {dupError && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <p className="text-[12px] text-red-600 font-medium">{dupError}</p>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center gap-2 pt-2 border-t border-gray-100 mt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-xl text-[13px] font-medium border border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700 transition-all bg-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 rounded-xl text-[13px] font-semibold bg-gray-900 text-white hover:bg-gray-800 transition-all"
            >
              Add business
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
