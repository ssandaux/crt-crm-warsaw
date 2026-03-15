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

function pickPhone(tags) {
  const val = tags.phone
    || tags['contact:phone']
    || tags.telephone
    || tags['contact:telephone']
    || tags.mobile
    || tags['contact:mobile']
    || tags['phone:pl']
    || '';
  return val.trim() || '—';
}

function pickWebsite(tags) {
  const val = tags.website
    || tags['contact:website']
    || tags.url
    || tags['contact:url']
    || tags['website:pl']
    || '';
  return val.trim();
}

function pickEmail(tags) {
  const val = tags.email
    || tags['contact:email']
    || tags['email:pl']
    || '';
  return val.trim() || '—';
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
    phone:   pickPhone(tags),
    email:   pickEmail(tags),
    website: pickWebsite(tags),
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

    // Insert in batches of 500; also enrich existing records missing phone/website/email
    for (let j = 0; j < rows.length; j += 500) {
      const batch = rows.slice(j, j + 500);
      const osmIds = batch.map((r) => r.osm_id);

      // 1. Find already-existing records in this batch that are missing contact info
      const { data: existing } = await supabase
        .from('businesses')
        .select('id, osm_id, phone, website, email')
        .in('osm_id', osmIds);

      const existingMap = new Map((existing || []).map((e) => [e.osm_id, e]));

      // 2. Enrich existing records if they are missing phone / website / email
      for (const ex of existingMap.values()) {
        const fresh = batch.find((r) => r.osm_id === ex.osm_id);
        if (!fresh) continue;
        const updates = {};
        if ((!ex.phone || ex.phone === '—') && fresh.phone && fresh.phone !== '—') updates.phone = fresh.phone;
        if (!ex.website && fresh.website) updates.website = fresh.website;
        if ((!ex.email || ex.email === '—') && fresh.email && fresh.email !== '—') updates.email = fresh.email;
        if (Object.keys(updates).length > 0) {
          await supabase.from('businesses').update(updates).eq('id', ex.id);
        }
      }

      // 3. Insert only records that don't exist yet
      const newRows = batch.filter((r) => !existingMap.has(r.osm_id));
      if (newRows.length > 0) {
        const { data } = await supabase.from('businesses').insert(newRows).select('id');
        if (data) totalInserted += data.length;
      }
    }
  }

  return { totalFetched, totalInserted };
}
