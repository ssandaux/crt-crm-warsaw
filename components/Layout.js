import Sidebar from './Sidebar';

export default function Layout({ children, fullWidth }) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f9fb] dark:bg-[#0e1320]">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <div className={`flex-1 px-8 py-8 w-full ${fullWidth ? '' : 'max-w-7xl mx-auto'}`}>
          {children}
        </div>
      </main>
    </div>
  );
}
