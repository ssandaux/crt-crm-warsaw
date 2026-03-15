import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';

export default function TrackerPage() {
  return (
    <Layout>
      <PageHeader
        title="Task Tracker"
        subtitle="Track internal tasks, to-dos and team progress."
      />

      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'To Do',       count: 0, color: 'bg-gray-400' },
          { label: 'In Progress', count: 0, color: 'bg-amber-400' },
          { label: 'Review',      count: 0, color: 'bg-blue-400' },
          { label: 'Done',        count: 0, color: 'bg-emerald-500' },
        ].map((col) => (
          <div key={col.label} className="bg-white rounded-2xl border border-gray-200 px-4 py-3 shadow-sm">
            <div className="flex items-center gap-1.5 mb-2">
              <span className={`w-1.5 h-1.5 rounded-full ${col.color}`} />
              <p className="text-[11px] text-gray-500 font-medium">{col.label}</p>
            </div>
            <p className="text-2xl font-bold text-gray-900 leading-none">{col.count}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <p className="text-[13px] font-semibold text-gray-700">Tasks</p>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium bg-gray-900 text-white hover:bg-gray-800 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New task
          </button>
        </div>

        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-[14px] font-semibold text-gray-700 mb-1">No tasks yet</p>
          <p className="text-[13px] text-gray-400">Create your first task to get started.</p>
        </div>
      </div>
    </Layout>
  );
}
