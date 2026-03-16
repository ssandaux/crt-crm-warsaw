import { useState, useRef } from 'react';
import { geocodeWarsaw } from '../lib/geocode';
import { types, districts, statuses } from '../mockData/businesses';
import { STATUS_CONFIG, selectCls, inputCls } from './ui';

function IconEdit() {
  return <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
}
function IconDelete() {
  return <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
}
function IconClose() {
  return <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
}

export function EditModal({ biz, onClose, onSave }) {
  const [form, setForm] = useState({
    name: biz.name, type: biz.type, district: biz.district,
    address: biz.address, phone: biz.phone, email: biz.email,
    status: biz.status, note: biz.note ?? '', nextAction: biz.nextAction ?? '', followUpDate: biz.followUpDate ?? '',
  });
  const [errors, setErrors] = useState({});
  const [geoStatus, setGeoStatus] = useState(null); // null | 'loading' | 'found' | 'error'
  const geocodedCoords = useRef(null);

  function set(field, value) {
    setForm((p) => ({ ...p, [field]: value }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: false }));
    if (field === 'address') { geocodedCoords.current = null; setGeoStatus(null); }
  }

  async function handleAddressBlur() {
    if (!form.address.trim() || form.address === biz.address) return;
    setGeoStatus('loading');
    const result = await geocodeWarsaw(form.address);
    if (result) { geocodedCoords.current = result; setGeoStatus('found'); }
    else setGeoStatus('error');
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = true;
    if (!form.district) errs.district = true;
    if (Object.keys(errs).length) { setErrors(errs); return; }
    const coords = geocodedCoords.current
      ? { lat: geocodedCoords.current.lat, lng: geocodedCoords.current.lng }
      : {};
    onSave({ ...form, ...coords });
  }

  return (
    <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-[2px]" onClick={onClose}>
      <div className="bg-white sm:rounded-2xl rounded-t-2xl border border-gray-200 shadow-2xl w-full max-w-lg sm:mx-4 flex flex-col max-h-[92dvh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100 shrink-0">
          <div>
            <p className="text-[15px] font-bold text-gray-900">Edit Business</p>
            <p className="text-[12px] text-gray-400 mt-0.5">{biz.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 transition-colors"><IconClose /></button>
        </div>
        <form id="edit-biz-form" onSubmit={handleSubmit} className="px-5 py-4 space-y-3 overflow-y-auto flex-1">
          <div>
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1">Name *</label>
            <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)} className={`${inputCls} w-full ${errors.name ? 'border-red-300' : ''}`} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1">Type</label>
              <select value={form.type} onChange={(e) => set('type', e.target.value)} className={`${selectCls} w-full`}>
                <option value="">Select...</option>
                {types.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1">District *</label>
              <select value={form.district} onChange={(e) => set('district', e.target.value)} className={`${selectCls} w-full ${errors.district ? 'border-red-300' : ''}`}>
                <option value="">Select...</option>
                {districts.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1">Status</label>
            <div className="flex gap-1.5">
              {statuses.map((s) => {
                const c = STATUS_CONFIG[s];
                return (
                  <button key={s} type="button" onClick={() => set('status', s)}
                    className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${form.status === s ? `${c.badge} border-transparent shadow-sm` : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600'}`}>
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1">
              Address
              {geoStatus === 'loading' && <span className="ml-2 text-gray-400 font-normal normal-case">Locating…</span>}
              {geoStatus === 'found'   && <span className="ml-2 text-emerald-500 font-normal normal-case">Location updated</span>}
              {geoStatus === 'error'   && <span className="ml-2 text-amber-500 font-normal normal-case">Address not found</span>}
            </label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => set('address', e.target.value)}
              onBlur={handleAddressBlur}
              className={`${inputCls} w-full`}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1">Phone</label>
              <input type="text" value={form.phone} onChange={(e) => set('phone', e.target.value)} className={`${inputCls} w-full`} />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1">Email</label>
              <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} className={`${inputCls} w-full`} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1">Next Action</label>
              <input type="text" placeholder="e.g. Call Friday…" value={form.nextAction} onChange={(e) => set('nextAction', e.target.value)} className={`${inputCls} w-full`} />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1">Reminder Date</label>
              <input type="date" value={form.followUpDate} onChange={(e) => set('followUpDate', e.target.value)} className={`${inputCls} w-full`} />
            </div>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1">Note</label>
            <textarea rows={2} value={form.note} onChange={(e) => set('note', e.target.value)} className={`${inputCls} w-full resize-none`} />
          </div>
        </form>
        <div className="flex gap-2 px-5 py-4 border-t border-gray-100 shrink-0">
          <button type="button" onClick={onClose} className="flex-1 py-2 rounded-xl text-[13px] font-medium border border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700 transition-all bg-white">Cancel</button>
          <button type="submit" form="edit-biz-form" className="flex-1 py-2 rounded-xl text-[13px] font-semibold bg-gray-900 text-white hover:bg-gray-800 transition-all">Save changes</button>
        </div>
      </div>
    </div>
  );
}

export function DeleteConfirm({ biz, onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/30 backdrop-blur-[2px]" onClick={onClose}>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-sm mx-4 p-6" onClick={(e) => e.stopPropagation()}>
        <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center mb-4">
          <IconDelete />
        </div>
        <p className="text-[15px] font-bold text-gray-900 mb-1">Delete business?</p>
        <p className="text-[13px] text-gray-400 mb-5"><span className="font-semibold text-gray-600">{biz.name}</span> will be permanently removed.</p>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl text-[13px] font-medium border border-gray-200 text-gray-500 hover:border-gray-300 bg-white transition-all">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-2 rounded-xl text-[13px] font-semibold bg-red-500 text-white hover:bg-red-600 transition-all">Delete</button>
        </div>
      </div>
    </div>
  );
}
