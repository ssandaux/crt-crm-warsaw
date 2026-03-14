import { businesses as mockBusinesses } from '../mockData/businesses';

const BIZ_KEY    = 'crm_businesses';
const EVENTS_KEY = 'crm_events';

export function loadBusinesses() {
  if (typeof window === 'undefined') return mockBusinesses;
  try {
    const raw = localStorage.getItem(BIZ_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return mockBusinesses;
}

export function saveBusinesses(data) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(BIZ_KEY, JSON.stringify(data));
}

export function loadEvents() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(EVENTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export function saveEvents(events) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
}

export function pushEvent(type, bizName, detail) {
  const events = loadEvents();
  const ev = { id: Date.now(), type, bizName, detail, date: new Date().toISOString() };
  saveEvents([ev, ...events].slice(0, 60));
}
