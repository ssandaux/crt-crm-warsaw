/**
 * Fetch businesses from OpenStreetMap via Overpass API for Warsaw.
 * Returns a normalized list of business objects.
 */

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

// OSM amenity/shop/tourism tags → human-readable category
const TAG_CATEGORY = {
  restaurant: 'Restaurant',
  cafe: 'Cafe',
  bar: 'Bar',
  pub: 'Pub',
  fast_food: 'Fast Food',
  food_court: 'Food Court',
  hotel: 'Hotel',
  hostel: 'Hostel',
  guest_house: 'Guest House',
  shop: 'Shop',
  supermarket: 'Supermarket',
  convenience: 'Convenience Store',
  bakery: 'Bakery',
  butcher: 'Butcher',
  pharmacy: 'Pharmacy',
  bank: 'Bank',
  atm: 'ATM',
  gym: 'Gym',
  spa: 'Spa',
  beauty: 'Beauty Salon',
  hairdresser: 'Hairdresser',
  laundry: 'Laundry',
  dry_cleaning: 'Dry Cleaning',
  dentist: 'Dentist',
  doctor: 'Doctor',
  clinic: 'Clinic',
  hospital: 'Hospital',
  veterinary: 'Veterinary',
  school: 'School',
  university: 'University',
  library: 'Library',
  cinema: 'Cinema',
  theatre: 'Theatre',
  nightclub: 'Nightclub',
  casino: 'Casino',
  gallery: 'Gallery',
  museum: 'Museum',
  fitness_centre: 'Fitness Centre',
  sports_centre: 'Sports Centre',
  car_wash: 'Car Wash',
  car_repair: 'Car Repair',
  fuel: 'Fuel Station',
  parking: 'Parking',
  post_office: 'Post Office',
  travel_agency: 'Travel Agency',
  estate_agent: 'Estate Agent',
  office: 'Office',
  coworking_space: 'Coworking Space',
};

function resolveCategory(tags) {
  const keys = ['amenity', 'shop', 'tourism', 'leisure', 'office'];
  for (const key of keys) {
    if (tags[key]) {
      return TAG_CATEGORY[tags[key]] || capitalize(tags[key].replace(/_/g, ' '));
    }
  }
  return 'Business';
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function buildAddress(tags) {
  const parts = [];
  if (tags['addr:street']) {
    const street = tags['addr:street'];
    const num = tags['addr:housenumber'];
    parts.push(num ? `${street} ${num}` : street);
  }
  if (tags['addr:city']) parts.push(tags['addr:city']);
  return parts.join(', ') || null;
}

function elementToCoords(el) {
  if (el.type === 'node') {
    return { lat: el.lat, lng: el.lon };
  }
  if (el.center) {
    return { lat: el.center.lat, lng: el.center.lon };
  }
  return null;
}

function normalizeElement(el) {
  const tags = el.tags || {};
  const name = tags.name || tags['name:en'] || tags['brand'] || null;
  if (!name) return null; // skip unnamed objects

  const coords = elementToCoords(el);
  if (!coords) return null;

  return {
    osm_id:   `${el.type}/${el.id}`,
    name,
    category: resolveCategory(tags),
    address:  buildAddress(tags),
    district: tags['addr:suburb'] || tags['addr:quarter'] || tags['addr:district'] || null,
    website:  tags.website         || tags['contact:website'] || tags['url']            || null,
    phone:    tags.phone           || tags['contact:phone']   || tags['contact:mobile'] || null,
    email:    tags.email           || tags['contact:email']                             || null,
    lat: coords.lat,
    lng: coords.lng,
  };
}

/**
 * Fetch businesses from Overpass API for Warsaw.
 *
 * @param {object} options
 * @param {string[]} [options.tags] — OSM tag filters, default: amenity, shop, tourism, leisure, office
 * @param {number}  [options.limit] — max results, default: 500
 * @param {number}  [options.timeout] — Overpass timeout in seconds, default: 25
 * @returns {Promise<Array<{osm_id, name, category, address, district, website, phone, email, lat, lng}>>}
 */
// Warsaw bounding box: south, west, north, east
const WARSAW_BBOX = '52.09,20.85,52.37,21.27';

export async function fetchWarsawBusinesses({
  tags = ['amenity', 'shop', 'tourism', 'leisure', 'office'],
  limit = 500,
  timeout = 25,
} = {}) {
  // Use bounding box — more reliable than area lookup by name
  const tagQueries = tags
    .map(
      (tag) => `
  node["${tag}"]["name"](${WARSAW_BBOX});
  way["${tag}"]["name"](${WARSAW_BBOX});`
    )
    .join('');

  const query = `
[out:json][timeout:${timeout}];
(${tagQueries}
);
out center ${limit};
`.trim();

  const response = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!response.ok) {
    throw new Error(`Overpass API error: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();
  const elements = json.elements || [];

  const businesses = elements
    .map(normalizeElement)
    .filter(Boolean);

  // Deduplicate by osm_id
  const seen = new Set();
  return businesses.filter((b) => {
    if (seen.has(b.osm_id)) return false;
    seen.add(b.osm_id);
    return true;
  });
}
