import { useState } from 'react';
import Sidebar from './Sidebar';

export default function Layout({ children, fullWidth }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f9fb] dark:bg-[#111111]">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Mobile top bar — sticky */}
        <div className="sm:hidden sticky top-0 z-50 relative flex items-center justify-center h-14 border-b border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#191919] shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="absolute left-3 w-10 h-10 flex items-center justify-center text-gray-600 dark:text-gray-400"
            aria-label="Open menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <img src="/wordmark-black.svg" alt="CRT Agency" className="h-5 w-auto object-contain dark:invert" />
        </div>

        <div className={`flex-1 px-4 py-4 sm:px-8 sm:py-8 w-full ${fullWidth ? '' : 'max-w-7xl mx-auto'}`}>
          {children}
        </div>
      </main>
    </div>
  );
}
