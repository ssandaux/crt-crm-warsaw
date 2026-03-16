import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import { loadEvents } from '../../lib/dataStore';
import { STATUS_CONFIG } from '../../components/ui';

const TYPE_META = {
  added:       { label: 'Added',          color: 'bg-emerald-100 text-emerald-700' },
  updated:     { label: 'Updated',        color: 'bg-blue-100 text-blue-700' },
  deleted:     { label: 'Deleted',        color: 'bg-red-100 text-red-600' },
  status:      { label: 'Status changed', color: 'bg-amber-100 text-amber-700' },
  bulk_delete: { label: 'Bulk delete',    color: 'bg-red-100 text-red-600' },
  bulk_status: { label: 'Bulk status',    color: 'bg-amber-100 text-amber-700' },
};

function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    + ' · '
    + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export default function NotificationsPage() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    setEvents(loadEvents());
  }, []);

  return (
    <Layout>
      <PageHeader
        title="Notifications"
        count={events.length}
        subtitle="Recent activity log — last 60 events."
        action={
          events.length > 0 && (
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('crm_events');
                  setEvents([]);
                }
              }}
              className="px-3 py-1.5 rounded-lg text-[12px] font-medium border border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600 transition-all bg-white"
            >
              Clear all
            </button>
          )
        }
      />

      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-28 text-center">
          <div className="w-10 h-10 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <p className="text-[14px] font-semibold text-gray-700 mb-1">No activity yet</p>
          <p className="text-[13px] text-gray-400">Actions like adding or editing businesses will appear here.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden max-w-2xl">
          {events.map((ev, i) => {
            const meta = TYPE_META[ev.type] ?? { label: ev.type, color: 'bg-gray-100 text-gray-600' };
            const statusCfg = STATUS_CONFIG[ev.detail];
            return (
              <div key={ev.id} className={`flex items-start gap-3.5 px-5 py-4 ${i > 0 ? 'border-t border-gray-100' : ''}`}>
                {/* Type badge */}
                <span className={`mt-0.5 shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${meta.color}`}>
                  {meta.label}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-gray-900 truncate">{ev.bizName}</p>
                  {ev.detail && ev.detail !== 'removed' && (
                    <p className="text-[12px] text-gray-400 mt-0.5 flex items-center gap-1.5">
                      {statusCfg ? (
                        <>
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusCfg.color}`} />
                          {statusCfg.label}
                        </>
                      ) : ev.detail}
                    </p>
                  )}
                </div>
                <span className="text-[11px] text-gray-400 shrink-0 whitespace-nowrap mt-0.5">{fmtDate(ev.date)}</span>
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
}
