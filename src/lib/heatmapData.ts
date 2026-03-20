/**
 * Heatmap data engine — generates a smooth, DiDi-style viability overlay.
 *
 * Key design choices:
 *  • Deterministic per subcategory (hash-seeded) so panning is stable.
 *  • Multiple noise octaves blended for organic look.
 *  • "Hot zone" anchors in real Mexicali commercial areas.
 *  • Continuous HSL interpolation for buttery gradients.
 */

export interface HeatPoint {
  lat: number;
  lng: number;
  /** 0–1 viability score (1 = best zone) */
  value: number;
}

// ── Deterministic hash → 0-1 float ─────────────────────────────
function hash(str: string): number {
  let a = 2166136261;
  for (let i = 0; i < str.length; i++) {
    a ^= str.charCodeAt(i);
    a = Math.imul(a, 16777619);
  }
  return ((a >>> 0) % 100000) / 100000;
}

// ── Mexicali commercial anchors ─────────────────────────────────
const ANCHORS = [
  { lat: 32.6245, lng: -115.4523, w: 0.38 },  // Centro histórico
  { lat: 32.6340, lng: -115.4680, w: 0.30 },  // Zona Río Nuevo
  { lat: 32.6130, lng: -115.4220, w: 0.22 },  // Zona Industrial
  { lat: 32.6500, lng: -115.4680, w: 0.20 },  // Calafia / norte
  { lat: 32.6180, lng: -115.4900, w: 0.24 },  // Pueblo Nuevo
  { lat: 32.6400, lng: -115.4300, w: 0.18 },  // González Ortega
  { lat: 32.6560, lng: -115.4400, w: 0.16 },  // Pro-Hogar
  { lat: 32.6080, lng: -115.4650, w: 0.15 },  // Ex-Ejido Coahuila
  { lat: 32.6350, lng: -115.4150, w: 0.14 },  // Xochimilco
  { lat: 32.6450, lng: -115.4850, w: 0.17 },  // Los Pinos
];

function sqDist(lat1: number, lng1: number, lat2: number, lng2: number) {
  const dLat = (lat2 - lat1) * 111.32;
  const dLng = (lng2 - lng1) * 111.32 * Math.cos((lat1 * Math.PI) / 180);
  return dLat * dLat + dLng * dLng;
}

// ── Grid generator ──────────────────────────────────────────────
export function generateHeatmapGrid(
  subcatId: string,
  bounds: { north: number; south: number; east: number; west: number },
  gridSize = 36,
): HeatPoint[] {
  const points: HeatPoint[] = [];
  const latStep = (bounds.north - bounds.south) / gridSize;
  const lngStep = (bounds.east - bounds.west) / gridSize;
  const seed = hash(subcatId);

  for (let i = 0; i <= gridSize; i++) {
    for (let j = 0; j <= gridSize; j++) {
      const lat = bounds.south + i * latStep;
      const lng = bounds.west + j * lngStep;

      // Octave 1 – coarse
      const k1 = `${lat.toFixed(3)},${lng.toFixed(3)},${subcatId}`;
      let v = hash(k1);

      // Octave 2 – medium
      const k2 = `${(lat * 2.73).toFixed(3)},${(lng * 2.73).toFixed(3)},${subcatId}`;
      v = v * 0.45 + hash(k2) * 0.35;

      // Octave 3 – fine
      const k3 = `${(lat * 7.19).toFixed(4)},${(lng * 7.19).toFixed(4)},${subcatId}`;
      v += hash(k3) * 0.20;

      // Anchor proximity boost (gaussian-like falloff)
      for (const a of ANCHORS) {
        const sd = sqDist(lat, lng, a.lat, a.lng);
        const sigma = 2.5; // km² spread
        v += a.w * Math.exp(-sd / (2 * sigma));
      }

      // Category-specific spatial bias
      const dCenter = Math.sqrt(sqDist(lat, lng, 32.6245, -115.4523));
      v += (seed > 0.5 ? 1 : -1) * 0.12 * Math.exp(-dCenter / 4);

      // Second category axis — east/west bias
      v += (seed > 0.3 && seed < 0.7 ? 1 : -1) * 0.06 * ((lng + 115.45) * 50);

      points.push({ lat, lng, value: Math.max(0, Math.min(1, v)) });
    }
  }

  return points;
}

// ── Continuous color interpolation ──────────────────────────────
// Maps 0→1 to Red→Orange→Yellow→Green using smooth HSL lerp.
//   0.00 → hsl(0,   80%, 55%)   red
//   0.30 → hsl(25,  90%, 52%)   orange
//   0.55 → hsl(45, 100%, 50%)   yellow
//   1.00 → hsl(142, 72%, 45%)   green
const STOPS = [
  { t: 0.0, h: 0, s: 80, l: 55 },
  { t: 0.3, h: 25, s: 90, l: 52 },
  { t: 0.55, h: 45, s: 100, l: 50 },
  { t: 1.0, h: 142, s: 72, l: 45 },
];

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function viabilityColor(value: number, alpha = 0.55): string {
  const v = Math.max(0, Math.min(1, value));

  // Find surrounding stops
  let lo = STOPS[0], hi = STOPS[STOPS.length - 1];
  for (let i = 0; i < STOPS.length - 1; i++) {
    if (v >= STOPS[i].t && v <= STOPS[i + 1].t) {
      lo = STOPS[i];
      hi = STOPS[i + 1];
      break;
    }
  }

  const t = lo.t === hi.t ? 0 : (v - lo.t) / (hi.t - lo.t);
  // Smooth-step for extra buttery blending
  const st = t * t * (3 - 2 * t);

  const h = Math.round(lerp(lo.h, hi.h, st));
  const s = Math.round(lerp(lo.s, hi.s, st));
  const l = Math.round(lerp(lo.l, hi.l, st));

  return `hsla(${h},${s}%,${l}%,${alpha})`;
}

/** Solid RGB string for legend swatches */
export function viabilityColorSolid(value: number): string {
  return viabilityColor(value, 1);
}
