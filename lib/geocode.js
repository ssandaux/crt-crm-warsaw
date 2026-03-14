/**
 * Geocode a Warsaw street address using Nominatim (OpenStreetMap).
 * Returns { lat, lng } or null if not found.
 */
export async function geocodeWarsaw(address) {
  const trimmed = address?.trim();
  if (!trimmed || trimmed === '—' || trimmed.length < 3) return null;

  try {
    const q = encodeURIComponent(`${trimmed}, Warszawa`);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1&countrycodes=pl&addressdetails=0`,
      { headers: { 'User-Agent': 'CRM-Warsaw/1.0', 'Accept-Language': 'pl,en' } }
    );
    const data = await res.json();
    if (!Array.isArray(data) || !data.length) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}
