/**
 * Generates a grid of heatmap points across the visible map area for a given business subcategory.
 * Uses seeded pseudo-random values based on coordinates so the heatmap is deterministic per subcategory.
 */

import { SECTORES } from "./businessCategories";

export interface HeatPoint {
  lat: number;
  lng: number;
  /** 0–1 viability score (1 = best) */
  value: number;
}

// Simple hash to produce a deterministic float from a string
function hashToFloat(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return (Math.abs(h) % 10000) / 10000;
}

/** Mexicali "hot zones" – areas with naturally higher commercial viability */
const HOT_ZONES = [
  { lat: 32.6245, lng: -115.4523, boost: 0.3 },   // Centro
  { lat: 32.6340, lng: -115.4680, boost: 0.25 },   // Zona Río Nuevo
  { lat: 32.6130, lng: -115.4220, boost: 0.2 },    // Industrial
  { lat: 32.6500, lng: -115.4680, boost: 0.15 },   // Calafia
  { lat: 32.6180, lng: -115.4900, boost: 0.2 },    // Pueblo Nuevo
  { lat: 32.6400, lng: -115.4300, boost: 0.18 },   // González Ortega
];

function distKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const dLat = (lat2 - lat1) * 111.32;
  const dLng = (lng2 - lng1) * 111.32 * Math.cos((lat1 * Math.PI) / 180);
  return Math.sqrt(dLat * dLat + dLng * dLng);
}

/**
 * Generate heatmap grid covering the given bounds.
 * @param subcatId – selected business subcategory (changes the pattern)
 * @param bounds – { north, south, east, west }
 * @param gridSize – number of points per axis (default 28)
 */
export function generateHeatmapGrid(
  subcatId: string,
  bounds: { north: number; south: number; east: number; west: number },
  gridSize = 28
): HeatPoint[] {
  const points: HeatPoint[] = [];
  const latStep = (bounds.north - bounds.south) / gridSize;
  const lngStep = (bounds.east - bounds.west) / gridSize;

  // Derive a category-specific seed offset so different subcategories produce different patterns
  const catSeed = hashToFloat(subcatId);

  for (let i = 0; i <= gridSize; i++) {
    for (let j = 0; j <= gridSize; j++) {
      const lat = bounds.south + i * latStep;
      const lng = bounds.west + j * lngStep;

      // Base noise from coordinate hash
      const coordKey = `${lat.toFixed(4)},${lng.toFixed(4)},${subcatId}`;
      let val = hashToFloat(coordKey);

      // Add a second frequency of noise for organic feel
      const coordKey2 = `${(lat * 3.7).toFixed(3)},${(lng * 3.7).toFixed(3)},${subcatId}`;
      val = val * 0.6 + hashToFloat(coordKey2) * 0.4;

      // Boost near hot zones
      for (const hz of HOT_ZONES) {
        const d = distKm(lat, lng, hz.lat, hz.lng);
        if (d < 3) {
          val += hz.boost * Math.max(0, 1 - d / 3);
        }
      }

      // Category-based shift — some categories thrive near center, some near outskirts
      const distFromCenter = distKm(lat, lng, 32.6245, -115.4523);
      val += (catSeed > 0.5 ? 1 : -1) * 0.1 * Math.max(0, 1 - distFromCenter / 5);

      points.push({ lat, lng, value: Math.max(0, Math.min(1, val)) });
    }
  }

  return points;
}

/**
 * Returns the viability color for a 0–1 score as an rgba string.
 */
export function viabilityColor(value: number, opacity = 0.55): string {
  // green → yellow → orange → red
  if (value >= 0.7) {
    // green
    return `rgba(34,197,94,${opacity})`;
  } else if (value >= 0.45) {
    // yellow-ish
    const t = (value - 0.45) / 0.25;
    const r = Math.round(234 - t * 200);
    const g = Math.round(179 + t * 18);
    const b = Math.round(8 + t * 78);
    return `rgba(${r},${g},${b},${opacity})`;
  } else if (value >= 0.25) {
    // orange
    return `rgba(249,115,22,${opacity})`;
  } else {
    // red
    return `rgba(239,68,68,${opacity})`;
  }
}
