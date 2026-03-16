import { supabase } from './supabase';

// 6×6 grid covering wider Warsaw area, sorted center-outward
// Each import "wave" processes the next 16 cells starting from the center
const WARSAW_CENTER    = { lat: 52.2297, lng: 21.0122 };
const WAVE_SIZE        = 16;
const STORAGE_KEY      = 'crm_import_wave';
const PER_IMPORT_LIMIT = 1000;  // max new businesses added per import click
const TOTAL_CAP        = 10000; // max total businesses allowed in the DB

const ALL_CELLS = (() => {
  const cells = [];
  const ROWS = 6, COLS = 6;
  const LAT_MIN = 52.10, LAT_MAX = 52.37;
  const LNG_MIN = 20.87, LNG_MAX = 21.25;
  const latStep = (LAT_MAX - LAT_MIN) / ROWS;
  const lngStep = (LNG_MAX - LNG_MIN) / COLS;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const lat = LAT_MIN + latStep * (r + 0.5);
      const lng = LNG_MIN + lngStep * (c + 0.5);
      const dist = Math.sqrt(
        (lat - WARSAW_CENTER.lat) ** 2 + (lng - WARSAW_CENTER.lng) ** 2
      );
      cells.push({ lat, lng, dist });
    }
  }
  // Sort nearest to Warsaw center first
  cells.sort((a, b) => a.dist - b.dist);
  return cells; // 36 cells, innermost first
})();

export const TOTAL_WAVES = Math.ceil(ALL_CELLS.length / WAVE_SIZE); // 3

function getCurrentWave() {
  try {
    const v = parseInt(localStorage.getItem(STORAGE_KEY) ?? '0', 10);
    return isNaN(v) ? 0 : v % TOTAL_WAVES;
  } catch { return 0; }
}

function saveNextWave(current) {
  try {
    localStorage.setItem(STORAGE_KEY, String((current + 1) % TOTAL_WAVES));
  } catch {}
}

const SEARCH_RADIUS = 3000; // meters

const SKIP_TYPES = new Set([
  'point_of_interest', 'establishment', 'locality', 'political',
  'country', 'route', 'street_address', 'postal_code',
  'sublocality', 'sublocality_level_1', 'administrative_area_level_1',
  'administrative_area_level_2',
]);

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function nearbySearchAll(svc, center) {
  return new Promise((resolve) => {
    const allResults = [];
    function handlePage(results, status, pagination) {
      const OK   = window.google.maps.places.PlacesServiceStatus.OK;
      const ZERO = window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS;
      if (status !== OK && status !== ZERO) { resolve(allResults); return; }
      allResults.push(...(results || []));
      if (pagination?.hasNextPage && allResults.length < 60) {
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

// Returns info about the upcoming wave without running it
export function getImportWaveInfo() {
  const wave = getCurrentWave();
  const cells = ALL_CELLS.slice(wave * WAVE_SIZE, (wave + 1) * WAVE_SIZE);
  return { wave: wave + 1, totalWaves: TOTAL_WAVES, cellCount: cells.length };
}

export async function importFromGoogle(map, onProgress) {
  const svc       = new window.google.maps.places.PlacesService(map);
  const wave      = getCurrentWave();
  const cells     = ALL_CELLS.slice(wave * WAVE_SIZE, (wave + 1) * WAVE_SIZE);
  const totalCells = cells.length;
  let totalFound    = 0;
  let totalInserted = 0;
  const seenPlaceIds = new Set();

  // Check current total in DB
  const { count: currentCount } = await supabase
    .from('businesses')
    .select('id', { count: 'exact', head: true });
  const dbCount = currentCount ?? 0;
  const remainingCap = Math.max(0, TOTAL_CAP - dbCount);
  const sessionLimit = Math.min(PER_IMPORT_LIMIT, remainingCap);

  if (sessionLimit === 0) {
    return { totalFound: 0, totalInserted: 0, wave: wave + 1, totalWaves: TOTAL_WAVES, capReached: true };
  }

  for (let i = 0; i < totalCells; i++) {
    if (totalInserted >= sessionLimit) break;
    const cell  = cells[i];
    const label = `Wave ${wave + 1}/${TOTAL_WAVES} · Zone ${i + 1}/${totalCells}`;

    onProgress({ step: i + 1, total: totalCells, label, status: 'searching', totalInserted });

    let rawResults;
    try { rawResults = await nearbySearchAll(svc, cell); } catch { continue; }

    const unique = rawResults.filter((r) => {
      if (!r.place_id || seenPlaceIds.has(r.place_id)) return false;
      seenPlaceIds.add(r.place_id);
      return true;
    });

    if (unique.length === 0) continue;

    onProgress({ step: i + 1, total: totalCells, label, status: 'enriching', count: unique.length, totalInserted });

    const rows = [];
    for (const result of unique) {
      await sleep(120);
      const detail = await getDetails(svc, result.place_id);
      if (!detail) continue;
      const row = normalizePlace(detail);
      if (row) rows.push(row);
    }

    totalFound += rows.length;
    if (rows.length === 0) continue;

    onProgress({ step: i + 1, total: totalCells, label, status: 'inserting', count: rows.length, totalInserted });

    for (let j = 0; j < rows.length; j += 200) {
      const batch  = rows.slice(j, j + 200);
      const osmIds = batch.map((r) => r.osm_id);

      const { data: existing } = await supabase
        .from('businesses')
        .select('id, osm_id, phone, website')
        .in('osm_id', osmIds);

      const existingMap = new Map((existing || []).map((e) => [e.osm_id, e]));

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

      let newRows = batch.filter((r) => !existingMap.has(r.osm_id));
      const canInsert = sessionLimit - totalInserted;
      if (newRows.length > canInsert) newRows = newRows.slice(0, canInsert);
      if (newRows.length > 0) {
        const { data } = await supabase.from('businesses').insert(newRows).select('id');
        if (data) totalInserted += data.length;
      }
      if (totalInserted >= sessionLimit) break;
    }
    if (totalInserted >= sessionLimit) break;
  }

  saveNextWave(wave);
  return { totalFound, totalInserted, wave: wave + 1, totalWaves: TOTAL_WAVES };
}
