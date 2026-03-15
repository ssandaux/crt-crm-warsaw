import { supabase } from './supabase';

// 6×6 grid covering Warsaw bounding box (52.09–52.37 lat, 20.85–21.27 lng)
// Smaller cells = smaller radius = more results per km² (Google caps at 60/request)
const GRID_CELLS = (() => {
  const cells = [];
  const ROWS = 6, COLS = 6;
  const LAT_MIN = 52.09, LAT_MAX = 52.37;
  const LNG_MIN = 20.85, LNG_MAX = 21.27;
  const latStep = (LAT_MAX - LAT_MIN) / ROWS;
  const lngStep = (LNG_MAX - LNG_MIN) / COLS;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      cells.push({
        lat: LAT_MIN + latStep * (r + 0.5),
        lng: LNG_MIN + lngStep * (c + 0.5),
      });
    }
  }
  return cells; // 36 cells
})();

const SEARCH_RADIUS = 2500; // meters — tighter radius for denser, more uniform coverage

const SKIP_TYPES = new Set([
  'point_of_interest', 'establishment', 'locality', 'political',
  'country', 'route', 'street_address', 'postal_code',
  'sublocality', 'sublocality_level_1', 'administrative_area_level_1',
  'administrative_area_level_2',
]);

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// Fetches all pages (up to 60 results) for one grid cell
function nearbySearchAll(svc, center) {
  return new Promise((resolve) => {
    const allResults = [];

    function handlePage(results, status, pagination) {
      const OK = window.google.maps.places.PlacesServiceStatus.OK;
      const ZERO = window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS;
      if (status !== OK && status !== ZERO) { resolve(allResults); return; }
      allResults.push(...(results || []));
      if (pagination?.hasNextPage && allResults.length < 60) {
        // Google requires ≥2s between pages
        setTimeout(() => pagination.nextPage(), 2100);
      } else {
        resolve(allResults);
      }
    }

    svc.nearbySearch(
      {
        location: new window.google.maps.LatLng(center.lat, center.lng),
        radius: SEARCH_RADIUS,
        type: 'establishment',
      },
      handlePage
    );
  });
}

function getDetails(svc, placeId) {
  return new Promise((resolve) => {
    svc.getDetails(
      {
        placeId,
        fields: [
          'place_id', 'name', 'formatted_address', 'vicinity',
          'international_phone_number', 'website', 'types', 'geometry',
        ],
      },
      (place, status) => {
        const OK = window.google.maps.places.PlacesServiceStatus.OK;
        resolve(status === OK ? place : null);
      }
    );
  });
}

function normalizePlace(place) {
  const lat = place.geometry?.location?.lat();
  const lng = place.geometry?.location?.lng();
  if (!lat || !lng || !place.name) return null;

  const filteredTypes = (place.types || []).filter((t) => !SKIP_TYPES.has(t));
  const rawType = filteredTypes[0] || 'business';

  return {
    osm_id:      `google/${place.place_id}`,
    name:        place.name,
    type:        rawType.replace(/_/g, ' '),
    district:    '',
    status:      'untouched',
    address:     place.formatted_address || place.vicinity || '—',
    phone:       place.international_phone_number || '—',
    email:       '—',
    website:     place.website || '',
    note:        '',
    lat,
    lng,
    last_action: new Date().toISOString().slice(0, 10),
  };
}

export const GOOGLE_IMPORT_TOTAL = GRID_CELLS.length; // 16

export async function importFromGoogle(map, onProgress) {
  const svc = new window.google.maps.places.PlacesService(map);
  const totalCells = GRID_CELLS.length;
  let totalFound = 0;
  let totalInserted = 0;
  const seenPlaceIds = new Set();

  for (let i = 0; i < totalCells; i++) {
    const cell = GRID_CELLS[i];
    const label = `Zone ${i + 1} / ${totalCells}`;

    onProgress({ step: i + 1, total: totalCells, label, status: 'searching', totalInserted });

    let rawResults;
    try {
      rawResults = await nearbySearchAll(svc, cell);
    } catch {
      continue;
    }

    // Deduplicate by place_id within this run
    const unique = rawResults.filter((r) => {
      if (!r.place_id || seenPlaceIds.has(r.place_id)) return false;
      seenPlaceIds.add(r.place_id);
      return true;
    });

    if (unique.length === 0) continue;

    onProgress({ step: i + 1, total: totalCells, label, status: 'enriching', count: unique.length, totalInserted });

    // Fetch full details (phone + website) for each result
    const rows = [];
    for (const result of unique) {
      await sleep(120); // stay within QPS limits
      const detail = await getDetails(svc, result.place_id);
      if (!detail) continue;
      const row = normalizePlace(detail);
      if (row) rows.push(row);
    }

    totalFound += rows.length;
    if (rows.length === 0) continue;

    onProgress({ step: i + 1, total: totalCells, label, status: 'inserting', count: rows.length, totalInserted });

    // Upsert: insert new records, enrich existing ones missing phone/website
    for (let j = 0; j < rows.length; j += 200) {
      const batch = rows.slice(j, j + 200);
      const osmIds = batch.map((r) => r.osm_id);

      const { data: existing } = await supabase
        .from('businesses')
        .select('id, osm_id, phone, website')
        .in('osm_id', osmIds);

      const existingMap = new Map((existing || []).map((e) => [e.osm_id, e]));

      // Enrich existing records that are missing contact info
      for (const ex of existingMap.values()) {
        const fresh = batch.find((r) => r.osm_id === ex.osm_id);
        if (!fresh) continue;
        const updates = {};
        if ((!ex.phone || ex.phone === '—') && fresh.phone && fresh.phone !== '—') updates.phone = fresh.phone;
        if (!ex.website && fresh.website) updates.website = fresh.website;
        if (Object.keys(updates).length > 0) {
          await supabase.from('businesses').update(updates).eq('id', ex.id);
        }
      }

      // Insert only new records
      const newRows = batch.filter((r) => !existingMap.has(r.osm_id));
      if (newRows.length > 0) {
        const { data } = await supabase.from('businesses').insert(newRows).select('id');
        if (data) totalInserted += data.length;
      }
    }
  }

  return { totalFound, totalInserted };
}
