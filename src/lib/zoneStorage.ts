/** Persistencia de la última zona analizada y settings del mapa. */

import type { AnalysisData } from "./mockData";

const LAST_ZONE_KEY = "geomarket_last_zone";
const MAP_STATE_KEY = "geomarket_map_state";

export interface MapPersistedState {
  radius: number;
  center?: { lat: number; lng: number };
  zoom?: number;
}

export function getLastZone(): AnalysisData | null {
  try {
    const raw = localStorage.getItem(LAST_ZONE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function setLastZone(z: AnalysisData) {
  try { localStorage.setItem(LAST_ZONE_KEY, JSON.stringify(z)); } catch {}
}

export function clearLastZone() {
  try { localStorage.removeItem(LAST_ZONE_KEY); } catch {}
}

export function getMapState(): MapPersistedState {
  try {
    const raw = localStorage.getItem(MAP_STATE_KEY);
    return raw ? JSON.parse(raw) : { radius: 500 };
  } catch { return { radius: 500 }; }
}

export function setMapState(s: MapPersistedState) {
  try { localStorage.setItem(MAP_STATE_KEY, JSON.stringify(s)); } catch {}
}

// ── Zonas guardadas (historial del Dashboard) ───────────────────
const SAVED_ZONES_KEY = "geomarket_saved_zones";

export interface SavedZone extends AnalysisData {
  id: string;
  alias?: string;
  savedAt: number;
}

export function getSavedZones(): SavedZone[] {
  try {
    const raw = localStorage.getItem(SAVED_ZONES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveZone(z: AnalysisData, alias?: string): SavedZone {
  const list = getSavedZones();
  const id = crypto.randomUUID();
  const entry: SavedZone = { ...z, id, alias, savedAt: Date.now() };
  list.unshift(entry);
  try { localStorage.setItem(SAVED_ZONES_KEY, JSON.stringify(list.slice(0, 20))); } catch {}
  return entry;
}

export function removeSavedZone(id: string) {
  const list = getSavedZones().filter((z) => z.id !== id);
  try { localStorage.setItem(SAVED_ZONES_KEY, JSON.stringify(list)); } catch {}
}
