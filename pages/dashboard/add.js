import { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import { useData } from '../../components/DataContext';
import { types, districts, statuses } from '../../mockData/businesses';
import { STATUS_CONFIG, Card, inputCls, BtnPrimary, BtnSecondary, BtnGhost } from '../../components/ui';

function Field({ label, hint, required, children }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <label className="text-[13px] font-medium text-gray-700">
          {label} {required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
        {hint && <span className="text-[11px] text-gray-400">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function Section({ title, children, last }) {
  return (
    <div className={`px-7 py-6 ${!last ? 'border-b border-gray-100' : ''}`}>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">{title}</p>
      {children}
    </div>
  );
}

const empty = { name: '', type: '', address: '', district: '', phone: '', email: '', status: '', note: '', nextAction: '', followUpDate: '' };

export default function AddPage() {
  const router = useRouter();
  const { addBusiness } = useData();
  const [form, setForm] = useState(empty);
  const [submitted, setSubmitted] = useState(false);
  const [savedName, setSavedName] = useState('');

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    addBusiness({
      name: form.name.trim(),
      type: form.type,
      district: form.district,
      address: form.address.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      status: form.status || 'untouched',
      note: form.note.trim(),
      nextAction: form.nextAction.trim(),
      followUpDate: form.followUpDate,
      lat: 52.2297,
      lng: 21.0122,
    });
    setSavedName(form.name || 'New business');
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-28 text-center">
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-5 shadow-sm">
            <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">Business registered</h2>
          <p className="text-[13px] text-gray-400 mb-7">
            <span className="font-semibold text-gray-600">{savedName}</span> has been added to the CRM.
          </p>
          <div className="flex gap-2.5">
            <BtnSecondary type="button" onClick={() => { setForm(empty); setSubmitted(false); }}>
              Add another
            </BtnSecondary>
            <BtnPrimary type="button" onClick={() => router.push('/dashboard/businesses')}>
              View businesses
            </BtnPrimary>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageHeader
        title="Add Business"
        subtitle="Register a new company to the CRM"
      />

      <form onSubmit={handleSubmit} className="max-w-xl">
        <Card>

          <Section title="Basic information">
            <div className="space-y-4">
              <Field label="Business name" required>
                <input type="text" placeholder="e.g. TechHub Warsaw" value={form.name} onChange={set('name')} className={inputCls} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Type" required>
                  <select value={form.type} onChange={set('type')} className={inputCls + ' cursor-pointer'}>
                    <option value="">Select</option>
                    {types.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="District" required>
                  <select value={form.district} onChange={set('district')} className={inputCls + ' cursor-pointer'}>
                    <option value="">Select</option>
                    {districts.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Address" hint="Optional">
                <input type="text" placeholder="ul. Marszałkowska 1" value={form.address} onChange={set('address')} className={inputCls} />
              </Field>
            </div>
          </Section>

          <Section title="Contact details">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Phone" hint="Optional">
                <input type="tel" placeholder="+48 22 000 0000" value={form.phone} onChange={set('phone')} className={inputCls} />
              </Field>
              <Field label="Email" required>
                <input type="email" placeholder="contact@company.pl" value={form.email} onChange={set('email')} className={inputCls} />
              </Field>
            </div>
          </Section>

          <Section title="CRM" last>
            <div className="space-y-4">
              <Field label="Status" required>
                <div className="grid grid-cols-4 gap-2 mt-0.5">
                  {statuses.map((s) => {
                    const cfg = STATUS_CONFIG[s];
                    const isActive = form.status === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, status: s }))}
                        className={`flex items-center justify-center gap-1.5 py-2 text-[12px] font-semibold rounded-lg border transition-all ${
                          isActive ? cfg.active + ' shadow-sm' : 'text-gray-400 border-gray-200 hover:border-gray-300 hover:text-gray-700 bg-white'
                        }`}
                      >
                        {isActive && <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />}
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Next Action" hint="Optional">
                  <input
                    type="text"
                    placeholder="e.g. Call Friday…"
                    value={form.nextAction}
                    onChange={set('nextAction')}
                    className={inputCls}
                  />
                </Field>
                <Field label="Follow-up Date" hint="Optional">
                  <input
                    type="date"
                    value={form.followUpDate}
                    onChange={set('followUpDate')}
                    className={inputCls}
                  />
                </Field>
              </div>
              <Field label="Note" hint="Optional">
                <textarea
                  rows={3}
                  placeholder="Add context, next steps, or remarks..."
                  value={form.note}
                  onChange={set('note')}
                  className={inputCls + ' resize-none'}
                />
              </Field>
            </div>
          </Section>
        </Card>

        <div className="flex items-center gap-3 mt-4">
          <BtnPrimary type="submit" className="px-6">
            Save business
          </BtnPrimary>
          <BtnGhost type="button" onClick={() => router.push('/dashboard/businesses')} className="px-2 py-2">
            Cancel
          </BtnGhost>
        </div>
      </form>
    </Layout>
  );
}
