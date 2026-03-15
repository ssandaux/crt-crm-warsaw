import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from './AuthContext';
import { useTheme } from './ThemeContext';

const navGroups = [
  {
    label: 'General',
    items: [
      {
        label: 'Map',
        href: '/dashboard/map',
        iconBg: '',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        ),
      },
      {
        label: 'Businesses',
        href: '/dashboard/businesses',
        iconBg: '',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        ),
      },
      {
        label: 'Reminders',
        href: '/dashboard/followups',
        iconBg: '',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        ),
      },
      {
        label: 'Tasks',
        href: '/dashboard/tasks',
        iconBg: '',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        ),
      },
      {
        label: 'Tracker',
        href: '/dashboard/tracker',
        iconBg: '',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        ),
      },
    ],
  },
  {
    label: 'Settings',
    items: [
      {
        label: 'Activity',
        href: '/dashboard/notifications',
        iconBg: '',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        ),
      },
    ],
  },
];

export default function Sidebar() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { dark, toggle } = useTheme();

  async function handleSignOut() {
    await signOut();
    router.replace('/login');
  }

  const userEmail = user?.email ?? '';
  const userInitial = userEmail.charAt(0).toUpperCase() || 'U';

  return (
    <aside className="w-[220px] h-screen sticky top-0 bg-white dark:bg-[#111827] border-r border-gray-200 dark:border-[#1f2d42] flex flex-col select-none shrink-0">

      {/* Company header */}
      <div className="px-4 py-3.5 border-b border-gray-100 dark:border-[#1f2d42] flex items-center gap-2">
        <img src="/logo-black.png" alt="Icon" className="h-7 w-auto object-contain shrink-0 dark:invert" />
        <img src="/wordmark-black.svg" alt="CRT Agency" className="h-6 w-auto object-contain dark:invert" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2.5 pt-3 pb-2 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-3">
            <p className="px-2 mb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = router.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
                      active
                        ? 'bg-gray-100 dark:bg-[#1f2d42] text-gray-900 dark:text-white'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1a2540] hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <span className={`w-4 h-4 flex items-center justify-center shrink-0 ${active ? 'text-gray-700' : 'text-gray-400'}`}>
                      {item.icon}
                    </span>
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badge && (
                      <span className="text-[10px] font-semibold bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full leading-none">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Theme toggle */}
      <div className="px-3 pb-1">
        <button
          onClick={toggle}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1f2d42] transition-colors group"
          title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {/* Icon */}
          <span className="w-4 h-4 flex items-center justify-center shrink-0">
            {dark ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 7a5 5 0 100 10A5 5 0 0012 7z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </span>
          <span className="flex-1 text-[12px] font-medium text-left">{dark ? 'Light mode' : 'Dark mode'}</span>
          {/* Pill toggle */}
          <div className={`relative w-8 h-[18px] rounded-full transition-colors duration-300 ${dark ? 'bg-gray-600' : 'bg-gray-200'}`}>
            <div className={`absolute top-[3px] w-3 h-3 rounded-full bg-white shadow-sm transition-transform duration-300 ${dark ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
          </div>
        </button>
      </div>

      {/* User footer */}
      <div className="px-3 py-3 border-t border-gray-100 dark:border-[#1f2d42]">
        <div className="flex items-center gap-2.5 px-1">
          <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-gray-100">
            <img src="/logo-black.png" alt="Logo" className="w-5 h-5 object-contain dark:invert" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-medium text-gray-800 truncate leading-none">{userEmail}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Warsaw HQ</p>
          </div>
          <button onClick={handleSignOut} className="text-gray-300 hover:text-red-400 transition-colors" title="Sign out">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>

    </aside>
  );
}
