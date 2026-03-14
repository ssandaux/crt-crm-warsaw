import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const STATUS_COLORS = {
  client:    { fill: '#3b82f6' },
  agreed:    { fill: '#10b981' },
  contacted: { fill: '#f59e0b' },
  rejected:  { fill: '#ef4444' },
  untouched: { fill: '#9ca3af' },
};

// ─── Warsaw constants ──────────────────────────────────────────────────────────

const WARSAW_CENTER = [52.2297, 21.0122];
const WARSAW_BOUNDS = [[52.05, 20.77], [52.42, 21.37]];

// Fallback boundary used while districts are loading
const WARSAW_APPROX = [
  [52.369, 21.050], [52.357, 21.155], [52.328, 21.271],
  [52.248, 21.271], [52.173, 21.242], [52.096, 21.188],
  [52.090, 21.050], [52.100, 20.908], [52.146, 20.851],
  [52.210, 20.851], [52.280, 20.869], [52.336, 20.912],
  [52.369, 21.050],
];
const WORLD_RING = [[-90, -180], [-90, 180], [90, 180], [90, -180]];

// localStorage cache — avoids re-fetching Overpass on every page load
const CACHE_KEY = 'crm_warsaw_districts_v1';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 1 week

// ─── Overpass helpers ──────────────────────────────────────────────────────────

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
  // Try cache first
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      const { ts, data } = JSON.parse(raw);
      if (Date.now() - ts < CACHE_TTL && data?.features?.length > 0) return data;
    }
  } catch {}

  // Use Warsaw's specific OSM relation ID (336353) → area ID 3600336353
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

// ─── District layer (manages Leaflet layers directly) ─────────────────────────

function buildMaskPositions(districtsGeo) {
  if (!districtsGeo) return [WORLD_RING, WARSAW_APPROX];
  const holes = districtsGeo.features.flatMap((f) => {
    if (f.geometry.type === 'Polygon')
      return [f.geometry.coordinates[0].map(([lng, lat]) => [lat, lng])];
    if (f.geometry.type === 'MultiPolygon')
      return f.geometry.coordinates.map((poly) => poly[0].map(([lng, lat]) => [lat, lng]));
    return [];
  });
  return holes.length ? [WORLD_RING, ...holes] : [WORLD_RING, WARSAW_APPROX];
}

function DistrictLayer({ districtsGeo, showDistricts }) {
  const map = useMap();
  const maskRef = useRef(null);
  const geoRef  = useRef(null);

  useEffect(() => {
    // Always remove existing layers first (prevents duplicates on re-render)
    if (maskRef.current) { try { map.removeLayer(maskRef.current); } catch (_) {} maskRef.current = null; }
    if (geoRef.current)  { try { map.removeLayer(geoRef.current);  } catch (_) {} geoRef.current  = null; }

    if (!showDistricts) return;

    // Darkening mask — dark outside, holes where districts are
    maskRef.current = L.polygon(buildMaskPositions(districtsGeo), {
      fillColor:   '#0f172a',
      fillOpacity: 0.58,
      color:       'transparent',
      weight:      0,
      interactive: false,
      fillRule:    'evenodd',
    }).addTo(map);

    // District outlines with hover highlight
    if (districtsGeo) {
      geoRef.current = L.geoJSON(districtsGeo, {
        style: () => ({
          color:       '#94a3b8',   // slate-400 border
          weight:      1.5,
          fillColor:   '#ffffff',   // white fill
          fillOpacity: 0.18,
        }),
        onEachFeature(feature, layer) {
          layer.on({
            mouseover() { layer.setStyle({ fillColor: '#f1f5f9', fillOpacity: 0.50, weight: 2 }); },
            mouseout()  { layer.setStyle({ fillColor: '#ffffff',  fillOpacity: 0.18, weight: 1.5 }); },
          });
          if (feature.properties?.name) {
            layer.bindTooltip(feature.properties.name, {
              sticky: true, className: 'district-tooltip', direction: 'auto',
            });
          }
        },
      }).addTo(map);
    }

    return () => {
      if (maskRef.current) { try { map.removeLayer(maskRef.current); } catch (_) {} maskRef.current = null; }
      if (geoRef.current)  { try { map.removeLayer(geoRef.current);  } catch (_) {} geoRef.current  = null; }
    };
  }, [showDistricts, districtsGeo, map]);

  return null;
}

// ─── Other map sub-components ──────────────────────────────────────────────────

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
        group.push(other); assigned.add(other.id);
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

function FlyToMarker({ marker }) {
  const map = useMap();
  useEffect(() => {
    if (marker) map.flyTo([marker.lat, marker.lng], Math.max(map.getZoom(), 14), { duration: 0.6 });
  }, [marker, map]);
  return null;
}

function MapClickHandler({ onMapClick, markerJustClicked }) {
  useMapEvents({
    click: (e) => {
      if (markerJustClicked.current) { markerJustClicked.current = false; return; }
      onMapClick(e);
    },
  });
  return null;
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function LeafletMap({ markers, selectedId, onMarkerClick, onMapClick, cluster, showDistricts }) {
  const [hoveredId, setHoveredId] = useState(null);
  const markerJustClicked = useRef(false);
  const [districtsGeo, setDistrictsGeo] = useState(null);

  // Fetch once on mount — uses localStorage cache, so instant after first visit
  useEffect(() => {
    fetchDistricts().then((geo) => { if (geo) setDistrictsGeo(geo); }).catch(() => {});
  }, []);

  function handleMarkerClick(id) {
    markerJustClicked.current = true;
    onMarkerClick(id);
  }

  function renderMarkers() {
    if (!cluster) {
      return markers.map((marker) => {
        const color = (STATUS_COLORS[marker.status] ?? STATUS_COLORS.contacted).fill;
        const isSelected = marker.id === selectedId;
        const isHovered  = marker.id === hoveredId;
        return (
          <CircleMarker
            key={marker.id}
            center={[marker.lat, marker.lng]}
            radius={isSelected ? 11 : isHovered ? 9 : 7}
            pathOptions={{
              fillColor:    color,
              fillOpacity:  isSelected || isHovered ? 1 : 0.85,
              color:        'white',
              weight:       isSelected ? 3 : isHovered ? 2.5 : 2,
            }}
            eventHandlers={{
              click:     () => handleMarkerClick(marker.id),
              mouseover: () => setHoveredId(marker.id),
              mouseout:  () => setHoveredId(null),
            }}
          />
        );
      });
    }

    const groups = buildClusters(markers);
    return groups.map((grp, i) => {
      if (grp.markers.length === 1) {
        const marker = grp.markers[0];
        const color = (STATUS_COLORS[marker.status] ?? STATUS_COLORS.contacted).fill;
        const isSelected = marker.id === selectedId;
        const isHovered  = marker.id === hoveredId;
        return (
          <CircleMarker
            key={`s-${marker.id}`}
            center={[marker.lat, marker.lng]}
            radius={isSelected ? 11 : isHovered ? 9 : 7}
            pathOptions={{
              fillColor: color, fillOpacity: isSelected || isHovered ? 1 : 0.85,
              color: 'white', weight: isSelected ? 3 : 2,
            }}
            eventHandlers={{
              click:     () => handleMarkerClick(marker.id),
              mouseover: () => setHoveredId(marker.id),
              mouseout:  () => setHoveredId(null),
            }}
          />
        );
      }
      const statusCounts = {};
      grp.markers.forEach((m) => { statusCounts[m.status] = (statusCounts[m.status] || 0) + 1; });
      const dominant = Object.entries(statusCounts).sort((a, b) => b[1] - a[1])[0][0];
      const color = (STATUS_COLORS[dominant] ?? STATUS_COLORS.contacted).fill;
      const size  = 26 + grp.markers.length * 2;
      const icon  = L.divIcon({
        html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:white;border:2.5px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.2)">${grp.markers.length}</div>`,
        className: '', iconSize: [size, size], iconAnchor: [size / 2, size / 2],
      });
      return (
        <Marker key={`c-${i}`} position={[grp.lat, grp.lng]} icon={icon}
          eventHandlers={{ click: () => handleMarkerClick(grp.markers[0].id) }} />
      );
    });
  }

  return (
    <MapContainer
      center={WARSAW_CENTER}
      zoom={12}
      minZoom={11}
      maxBounds={WARSAW_BOUNDS}
      maxBoundsViscosity={0.9}
      style={{ height: '100%', width: '100%' }}
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions" target="_blank">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
        maxZoom={19}
      />

      <DistrictLayer districtsGeo={districtsGeo} showDistricts={showDistricts} />

      <FlyToMarker marker={markers.find((m) => m.id === selectedId) ?? null} />
      <MapClickHandler onMapClick={onMapClick} markerJustClicked={markerJustClicked} />
      {renderMarkers()}
    </MapContainer>
  );
}
