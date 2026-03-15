import { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

const STATUS_COLORS = {
  client:    '#3b82f6',
  agreed:    '#10b981',
  contacted: '#f59e0b',
  rejected:  '#ef4444',
  untouched: '#9ca3af',
};

const WARSAW_CENTER = { lat: 52.2297, lng: 21.0122 };

const MAP_OPTIONS = {
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
  restriction: {
    latLngBounds: { north: 52.45, south: 52.05, east: 21.40, west: 20.75 },
    strictBounds: false,
  },
  styles: [
    { featureType: 'poi', stylers: [{ visibility: 'off' }] },
    { featureType: 'transit.station', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  ],
};

// ─── District fetching (Overpass API) ─────────────────────────────────────────

const CACHE_KEY = 'crm_warsaw_districts_v1';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000;

function stitchWays(ways) {
  if (!ways.length) return [];
  let segs = ways.map((w) => w.geometry.map((p) => [p.lat, p.lon]));
  const rings = [];
  while (segs.length > 0) {
    let ring = segs[0];
    segs = segs.slice(1);
    let changed = true;
    while (changed) {
      changed = false;
      for (let i = 0; i < segs.length; i++) {
        const seg = segs[i];
        const re = ring[ring.length - 1], rs = ring[0];
        const se = seg[seg.length - 1], ss = seg[0];
        const near = (a, b) => Math.abs(a[0] - b[0]) < 5e-5 && Math.abs(a[1] - b[1]) < 5e-5;
        if      (near(re, ss)) ring = [...ring, ...seg.slice(1)];
        else if (near(re, se)) ring = [...ring, ...[...seg].reverse().slice(1)];
        else if (near(rs, se)) ring = [...seg.slice(0, -1), ...ring];
        else if (near(rs, ss)) ring = [...[...seg].reverse().slice(0, -1), ...ring];
        else continue;
        segs.splice(i, 1); changed = true; break;
      }
    }
    rings.push(ring);
  }
  return rings;
}

function osmToGeoJSON(data) {
  const features = data.elements
    .filter((e) => e.type === 'relation')
    .map((rel) => {
      const outerWays = (rel.members || []).filter(
        (m) => m.role === 'outer' && Array.isArray(m.geometry) && m.geometry.length > 1
      );
      if (!outerWays.length) return null;
      const rings = stitchWays(outerWays);
      if (!rings.length) return null;
      return {
        type: 'Feature',
        properties: { name: rel.tags?.name ?? '' },
        geometry: {
          type: 'Polygon',
          coordinates: rings.map((r) => r.map(([lat, lng]) => [lng, lat])),
        },
      };
    })
    .filter(Boolean);
  return { type: 'FeatureCollection', features };
}

async function fetchDistricts() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      const { ts, data } = JSON.parse(raw);
      if (Date.now() - ts < CACHE_TTL && data?.features?.length > 0) return data;
    }
  } catch {}

  const q = `[out:json][timeout:30];
area(3600336353)->.warsaw;
relation(area.warsaw)["admin_level"="9"]["boundary"="administrative"];
out geom;`;

  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(q)}`,
  });
  const json = await res.json();
  const geo = osmToGeoJSON(json);
  if (geo.features.length > 0) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: geo })); } catch {}
    return geo;
  }
  return null;
}

// ─── Clustering ────────────────────────────────────────────────────────────────

function buildClusters(markers, threshold = 0.015) {
  const clusters = [];
  const assigned = new Set();
  for (const m of markers) {
    if (assigned.has(m.id)) continue;
    const group = [m];
    assigned.add(m.id);
    for (const other of markers) {
      if (assigned.has(other.id)) continue;
      if (Math.abs(m.lat - other.lat) < threshold && Math.abs(m.lng - other.lng) < threshold) {
        group.push(other);
        assigned.add(other.id);
      }
    }
    clusters.push({
      markers: group,
      lat: group.reduce((s, x) => s + x.lat, 0) / group.length,
      lng: group.reduce((s, x) => s + x.lng, 0) / group.length,
    });
  }
  return clusters;
}

// ─── Icon helpers ──────────────────────────────────────────────────────────────

function makeCircleIcon(color, radius, strokeWidth = 2.5) {
  const size = radius * 2 + strokeWidth * 2;
  const c = size / 2;
  const svg = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">` +
    `<circle cx="${c}" cy="${c}" r="${radius}" fill="${color}" stroke="white" stroke-width="${strokeWidth}"/>` +
    `</svg>`
  );
  return {
    url: `data:image/svg+xml;charset=UTF-8,${svg}`,
    anchor: new window.google.maps.Point(c, c),
    scaledSize: new window.google.maps.Size(size, size),
  };
}

function makeClusterIcon(color, count, diameter) {
  const c = diameter / 2;
  const svg = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${diameter}" height="${diameter}">` +
    `<circle cx="${c}" cy="${c}" r="${c - 2}" fill="${color}" stroke="white" stroke-width="2.5"/>` +
    `<text x="50%" y="50%" text-anchor="middle" dy=".35em" fill="white" font-size="11" font-weight="700" font-family="system-ui,sans-serif">${count}</text>` +
    `</svg>`
  );
  return {
    url: `data:image/svg+xml;charset=UTF-8,${svg}`,
    anchor: new window.google.maps.Point(c, c),
    scaledSize: new window.google.maps.Size(diameter, diameter),
  };
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function GoogleMapComp({ markers, selectedId, onMarkerClick, onMapClick, cluster, showDistricts, crosshair }) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'crm-warsaw-map',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  });

  const mapRef = useRef(null);
  const dataListeners = useRef([]);
  const [hoveredId, setHoveredId] = useState(null);
  const [districtsGeo, setDistrictsGeo] = useState(null);
  const markerJustClicked = useRef(false);

  useEffect(() => {
    fetchDistricts()
      .then((geo) => { if (geo) setDistrictsGeo(geo); })
      .catch(() => {});
  }, []);

  const onLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);

  const onUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  // Crosshair cursor
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.setOptions({ draggableCursor: crosshair ? 'crosshair' : '' });
  }, [crosshair]);

  // Districts data layer
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    map.data.forEach((f) => map.data.remove(f));
    dataListeners.current.forEach((l) => window.google.maps.event.removeListener(l));
    dataListeners.current = [];

    if (!showDistricts || !districtsGeo) return;

    map.data.addGeoJson(districtsGeo);
    map.data.setStyle({
      fillColor: '#ffffff',
      fillOpacity: 0.18,
      strokeColor: '#94a3b8',
      strokeWeight: 1.5,
      clickable: false,
    });

    dataListeners.current.push(
      map.data.addListener('mouseover', (e) => {
        map.data.overrideStyle(e.feature, { fillOpacity: 0.45, strokeWeight: 2 });
      }),
      map.data.addListener('mouseout', () => {
        map.data.revertStyle();
      })
    );
  }, [showDistricts, districtsGeo]);

  // Pan to selected marker
  useEffect(() => {
    if (!mapRef.current || !selectedId) return;
    const m = markers.find((x) => x.id === selectedId);
    if (m) {
      mapRef.current.panTo({ lat: m.lat, lng: m.lng });
      if (mapRef.current.getZoom() < 14) mapRef.current.setZoom(14);
    }
  }, [selectedId, markers]);

  const handleMapClick = useCallback((e) => {
    if (markerJustClicked.current) { markerJustClicked.current = false; return; }
    onMapClick({ latlng: { lat: e.latLng.lat(), lng: e.latLng.lng() } });
  }, [onMapClick]);

  function renderMarkers() {
    if (!cluster) {
      return markers.map((m) => {
        const color = STATUS_COLORS[m.status] ?? STATUS_COLORS.untouched;
        const isSelected = m.id === selectedId;
        const isHovered = m.id === hoveredId;
        const radius = isSelected ? 10 : isHovered ? 8 : 6;
        return (
          <Marker
            key={m.id}
            position={{ lat: m.lat, lng: m.lng }}
            icon={makeCircleIcon(color, radius, isSelected ? 3 : 2.5)}
            zIndex={isSelected ? 100 : isHovered ? 50 : 1}
            onClick={() => { markerJustClicked.current = true; onMarkerClick(m.id); }}
            onMouseOver={() => setHoveredId(m.id)}
            onMouseOut={() => setHoveredId(null)}
          />
        );
      });
    }

    return buildClusters(markers).map((grp, i) => {
      if (grp.markers.length === 1) {
        const m = grp.markers[0];
        const color = STATUS_COLORS[m.status] ?? STATUS_COLORS.untouched;
        const isSelected = m.id === selectedId;
        const isHovered = m.id === hoveredId;
        const radius = isSelected ? 10 : isHovered ? 8 : 6;
        return (
          <Marker
            key={`s-${m.id}`}
            position={{ lat: m.lat, lng: m.lng }}
            icon={makeCircleIcon(color, radius, isSelected ? 3 : 2.5)}
            zIndex={isSelected ? 100 : 1}
            onClick={() => { markerJustClicked.current = true; onMarkerClick(m.id); }}
            onMouseOver={() => setHoveredId(m.id)}
            onMouseOut={() => setHoveredId(null)}
          />
        );
      }

      const sc = {};
      grp.markers.forEach((m) => { sc[m.status] = (sc[m.status] || 0) + 1; });
      const dominant = Object.entries(sc).sort((a, b) => b[1] - a[1])[0][0];
      const color = STATUS_COLORS[dominant] ?? STATUS_COLORS.untouched;
      const diameter = 26 + grp.markers.length * 2;

      return (
        <Marker
          key={`c-${i}`}
          position={{ lat: grp.lat, lng: grp.lng }}
          icon={makeClusterIcon(color, grp.markers.length, diameter)}
          onClick={() => { markerJustClicked.current = true; onMarkerClick(grp.markers[0].id); }}
        />
      );
    });
  }

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-full text-[13px] text-red-500">
        Failed to load Google Maps
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full text-[13px] text-gray-400">
        Loading map…
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={{ height: '100%', width: '100%' }}
      center={WARSAW_CENTER}
      zoom={12}
      options={MAP_OPTIONS}
      onLoad={onLoad}
      onUnmount={onUnmount}
      onClick={handleMapClick}
    >
      {renderMarkers()}
    </GoogleMap>
  );
}
