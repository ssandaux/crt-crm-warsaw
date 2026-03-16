import { useMemo } from 'react';
import Link from 'next/link';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import { useData } from '../../components/DataContext';
import { STATUS_CONFIG } from '../../components/ui';

function fmt(iso) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function isOverdue(iso) {
  return new Date(iso) < new Date(new Date().toDateString());
}

function isToday(iso) {
  return iso === new Date().toISOString().split('T')[0];
}

export default function FollowUpsPage() {
  const { businesses } = useData();

  const items = useMemo(() => {
    return businesses
      .filter((b) => b.followUpDate)
      .sort((a, b) => new Date(a.followUpDate) - new Date(b.followUpDate));
  }, [businesses]);

  const overdue = items.filter((b) => isOverdue(b.followUpDate));
  const today   = items.filter((b) => isToday(b.followUpDate));
  const upcoming = items.filter((b) => !isOverdue(b.followUpDate) && !isToday(b.followUpDate));

  function Section({ title, rows, accent }) {
    if (!rows.length) return null;
    return (
      <div className="mb-6">
        <p className={`text-[11px] font-semibold uppercase tracking-widest mb-2 ${accent}`}>{title}</p>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {rows.map((biz, i) => {
            const cfg = STATUS_CONFIG[biz.status] ?? STATUS_CONFIG.contacted;
            const overdueBiz = isOverdue(biz.followUpDate);
            const todayBiz = isToday(biz.followUpDate);
            return (
              <div
                key={biz.id}
                className={`flex items-start gap-4 px-5 py-4 ${i < rows.length - 1 ? 'border-b border-gray-100' : ''}`}
              >
                {/* Status dot */}
                <span className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${cfg.color}`} />

                {/* Name + meta + contacts */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[13px] font-semibold text-gray-900 truncate">{biz.name}</p>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}>
                      {cfg.label}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                    {[biz.type, biz.district].filter(Boolean).join(' · ')}
                    {biz.address && <span className="ml-1">· {biz.address}</span>}
                  </p>
                  {/* Contact row */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                    {biz.phone && (
                      <a href={`tel:${biz.phone}`} className="inline-flex items-center gap-1 text-[12px] text-gray-500 hover:text-gray-800 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                        {biz.phone}
                      </a>
                    )}
                    {biz.email && (
                      <a href={`mailto:${biz.email}`} className="inline-flex items-center gap-1 text-[12px] text-gray-500 hover:text-gray-800 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        {biz.email}
                      </a>
                    )}
                    {biz.website && (
                      <a href={biz.website.startsWith('http') ? biz.website : `https://${biz.website}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[12px] text-blue-500 hover:text-blue-700 hover:underline transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                        {biz.website}
                      </a>
                    )}
                    {!biz.phone && !biz.email && !biz.website && (
                      <span className="text-[11px] text-gray-300 italic">No contact info</span>
                    )}
                    {biz.nextAction && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-gray-400 italic">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {biz.nextAction}
                      </span>
                    )}
                  </div>
                </div>

                {/* Date */}
                <span className={`text-[12px] font-semibold shrink-0 mt-0.5 ${overdueBiz || todayBiz ? 'text-red-500' : 'text-gray-500'}`}>
                  {(overdueBiz || todayBiz) && <span className="mr-1">⚠</span>}
                  {fmt(biz.followUpDate)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <PageHeader
        title="Reminders"
        count={items.length}
        subtitle="Businesses with scheduled reminder dates."
      />

      {items.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="text-[15px] font-semibold text-gray-400">No reminders scheduled</p>
          <p className="text-[13px] text-gray-300 mt-1">
            Set reminder dates on the{' '}
            <Link href="/dashboard/map" className="text-gray-500 underline underline-offset-2 hover:text-gray-700">
              Map
            </Link>{' '}
            or in{' '}
            <Link href="/dashboard/businesses" className="text-gray-500 underline underline-offset-2 hover:text-gray-700">
              Businesses
            </Link>
            .
          </p>
        </div>
      ) : (
        <>
          <Section title="Overdue" rows={overdue} accent="text-red-400" />
          <Section title="Today" rows={today} accent="text-red-500" />
          <Section title="Upcoming" rows={upcoming} accent="text-gray-400" />
        </>
      )}
    </Layout>
  );
}
