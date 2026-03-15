import { supabase } from './supabase';

const BBOX = '52.09,20.85,52.37,21.27'; // Warsaw bounding box

const STEPS = [
  {
    label: 'Restaurants, cafes & bars',
    query: `[out:json][timeout:60];(node["amenity"~"restaurant|cafe|bar|pub|fast_food|food_court|ice_cream|bakery"]["name"](${BBOX});way["amenity"~"restaurant|cafe|bar|pub|fast_food|food_court|ice_cream|bakery"]["name"](${BBOX}););out center 10000;`,
  },
  {
    label: 'Shops & retail',
    query: `[out:json][timeout:60];(node["shop"]["name"](${BBOX});way["shop"]["name"](${BBOX}););out center 10000;`,
  },
  {
    label: 'Offices & services',
    query: `[out:json][timeout:60];(node["office"]["name"](${BBOX});way["office"]["name"](${BBOX}););out center 10000;`,
  },
  {
    label: 'Hotels, tourism & leisure',
    query: `[out:json][timeout:60];(node["tourism"]["name"](${BBOX});way["tourism"]["name"](${BBOX});node["leisure"]["name"](${BBOX});way["leisure"]["name"](${BBOX}););out center 5000;`,
  },
];

async function fetchOverpass(query) {
  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query)}`,
  });
  if (!res.ok) throw new Error(`Overpass error: ${res.status}`);
  const json = await res.json();
  return json.elements || [];
}

function normalizeElement(el) {
  const tags = el.tags || {};
  const lat = el.lat ?? el.center?.lat;
  const lng = el.lon ?? el.center?.lon;
  if (!lat || !lng || !tags.name) return null;

  const category =
    tags.amenity || tags.shop || tags.office || tags.tourism || tags.leisure || 'business';

  const street = tags['addr:street'] || '';
  const number = tags['addr:housenumber'] || '';
  const address = street ? `${street}${number ? ' ' + number : ''}` : '—';

  return {
    osm_id: `${el.type}/${el.id}`,
    name: tags.name,
    type: category.replace(/_/g, ' '),
    district: '',
    status: 'untouched',
    address,
    phone: tags.phone || tags['contact:phone'] || '—',
    email: tags.email || tags['contact:email'] || '—',
    website: tags.website || tags['contact:website'] || '',
    note: '',
    lat,
    lng,
    last_action: new Date().toISOString().slice(0, 10),
  };
}

export async function importFromOsm(onProgress) {
  let totalFetched = 0;
  let totalInserted = 0;

  for (let i = 0; i < STEPS.length; i++) {
    const step = STEPS[i];

    onProgress({ step: i + 1, total: STEPS.length, label: step.label, status: 'fetching', totalInserted });

    let elements;
    try {
      elements = await fetchOverpass(step.query);
    } catch {
      onProgress({ step: i + 1, total: STEPS.length, label: step.label, status: 'error', totalInserted });
      continue;
    }

    const rows = elements.map(normalizeElement).filter(Boolean);
    totalFetched += rows.length;

    onProgress({ step: i + 1, total: STEPS.length, label: step.label, status: 'inserting', count: rows.length, totalInserted });

    // Insert in batches of 500
    for (let j = 0; j < rows.length; j += 500) {
      const batch = rows.slice(j, j + 500);
      const { data } = await supabase
        .from('businesses')
        .upsert(batch, { onConflict: 'osm_id', ignoreDuplicates: true })
        .select('id');
      if (data) totalInserted += data.length;
    }
  }

  return { totalFetched, totalInserted };
}
