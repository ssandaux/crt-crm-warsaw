import '../styles/globals.css';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { DataProvider } from '../components/DataContext';
import { AuthProvider, useAuth } from '../components/AuthContext';
import { ThemeProvider } from '../components/ThemeContext';

const PUBLIC_PATHS = ['/login'];

function RouteGuard({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const isPublic = PUBLIC_PATHS.includes(router.pathname);

    // Not logged in → send to /login
    if (!user && !isPublic) {
      router.replace('/login');
      return;
    }

    // Already logged in → skip login page
    if (user && isPublic) {
      router.replace('/dashboard/map');
    }
  }, [user, loading, router.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <svg className="w-5 h-5 text-gray-300 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      </div>
    );
  }

  // Block render of protected page before redirect fires
  if (!user && !PUBLIC_PATHS.includes(router.pathname)) return null;

  return children;
}

export default function App({ Component, pageProps }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RouteGuard>
          <DataProvider>
            <Component {...pageProps} />
          </DataProvider>
        </RouteGuard>
      </AuthProvider>
    </ThemeProvider>
  );
}
