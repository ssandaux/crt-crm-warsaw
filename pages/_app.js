import '../styles/globals.css';
import 'leaflet/dist/leaflet.css';
import { DataProvider } from '../components/DataContext';

export default function App({ Component, pageProps }) {
  return (
    <DataProvider>
      <Component {...pageProps} />
    </DataProvider>
  );
}
