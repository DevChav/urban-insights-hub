/**
 * Mock DENUE para Mexicali, B.C.
 * Genera ~800 negocios distribuidos por subcategoría SCIAN y zona,
 * de forma determinista (mismo SCIAN → mismos negocios entre sesiones).
 *
 * Estructura compatible con el dataset oficial INEGI/DENUE:
 *   nombre_establecimiento, scian, latitud, longitud, etc.
 */

import type { DenueNegocio, ZonaMexicali } from "./mockData";
import { SECTORES } from "./businessCategories";

// PRNG determinista (mulberry32)
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// ── Geografía Mexicali: centroide por zona ──────────────────────
const MEXICALI_CENTER = { lat: 32.6245, lng: -115.4523 };

const ZONAS: { zona: ZonaMexicali; lat: number; lng: number; colonias: string[] }[] = [
  { zona: "Centro",   lat: 32.6245, lng: -115.4523, colonias: ["Centro", "Nueva", "Pueblo Nuevo", "Industrial"] },
  { zona: "Norte",    lat: 32.6620, lng: -115.4680, colonias: ["Pro-Hogar", "Río Nuevo", "Los Pinos", "Independencia"] },
  { zona: "Sur",      lat: 32.5780, lng: -115.4400, colonias: ["González Ortega", "Calafia", "El Dorado", "Orizaba"] },
  { zona: "Oriente",  lat: 32.6100, lng: -115.4050, colonias: ["Xochimilco", "Ex-Ejido Coahuila", "Baja California"] },
  { zona: "Poniente", lat: 32.6300, lng: -115.5050, colonias: ["Alamitos", "Misiones", "Villa Verde", "Hacienda"] },
];

const NAME_PREFIXES: Record<string, string[]> = {
  default: ["El Rincón de", "Casa", "La", "Don", "Doña", "Centro", "Mundo", "Express"],
  "722511": ["Restaurante", "El Sazón de", "Mariscos", "Cocina", "La Cocina de"],
  "722514": ["Tacos", "Taquería", "Tortas", "El Taco de", "Tortas Ahogadas"],
  "722513": ["Antojitos", "Garnachas", "Cenaduría", "El Comal de"],
  "722517": ["Pizzería", "Burger", "Hot Dogs", "Pollo Rostizado", "La Pizza de"],
  "722515": ["Café", "Cafetería", "Aroma", "Coffee", "Brew Lab"],
  "461110": ["Abarrotes", "Miscelánea", "Súper", "La Tiendita de"],
  "462112": ["Mini Súper", "OXXO Plaza", "7 Eleven", "Súper Express"],
  "461212": ["Depósito", "Cervecería", "Six de"],
  "463211": ["Boutique", "Modas", "Ropa", "Fashion", "Vestir"],
  "466410": ["Bazar", "Segunda", "Usado", "Vintage"],
  "465311": ["Papelería", "Útiles", "Copias"],
  "467111": ["Ferretería", "Tlapalería", "Herramientas"],
  "812110": ["Estética", "Salón", "Barbería", "Beauty Studio"],
  "621211": ["Consultorio Dental", "Dental", "Sonrisa", "Dr."],
  "621113": ["Consultorio Médico", "Clínica", "Dr.", "Dra."],
  "464111": ["Farmacia", "Farmacias", "Farma"],
  "811111": ["Taller Mecánico", "AutoServicio", "Mecánica"],
  "811121": ["Hojalatería y Pintura", "Carrocería", "Auto Body"],
  "522110": ["Banco", "BBVA", "Banamex", "Santander", "Banorte"],
  "813210": ["Iglesia", "Templo", "Parroquia"],
};

const SUFFIXES = ["Mexicali", "Cachanilla", "del Valle", "Express", "Plus", "Central", "del Norte", "MXL", "Premium", "Pro"];

function generateName(scian: string, rng: () => number): string {
  const prefixes = NAME_PREFIXES[scian] ?? NAME_PREFIXES.default;
  const p = prefixes[Math.floor(rng() * prefixes.length)];
  const s = SUFFIXES[Math.floor(rng() * SUFFIXES.length)];
  return `${p} ${s}`;
}

// Volumen por SCIAN — coherente con realidad de Mexicali
const VOLUMEN_POR_SCIAN: Record<string, number> = {
  "722511": 95, "722514": 140, "722513": 60, "722517": 75, "722515": 55,
  "461110": 180, "462112": 70, "461212": 50,
  "463211": 85, "466410": 30, "465311": 45, "467111": 55,
  "812110": 110, "621211": 50, "621113": 65, "464111": 90,
  "811111": 80, "811121": 35,
  "522110": 25, "813210": 70,
};

const EMPLEADOS_BANDS = ["0 a 5", "6 a 10", "11 a 30", "31 a 50", "51 a 100"];

// Indexa SCIAN → subcategoría
function buildScianIndex() {
  const idx: Record<string, { scianNombre: string }> = {};
  for (const sec of SECTORES) {
    for (const cat of sec.categorias) {
      for (const sub of cat.subcategorias) {
        if (sub.scian) idx[sub.scian] = { scianNombre: sub.nombre };
      }
    }
  }
  return idx;
}

// ── Generación cacheada ─────────────────────────────────────────
let cache: DenueNegocio[] | null = null;
let cacheByScian: Map<string, DenueNegocio[]> | null = null;

export function getDenueDataset(): DenueNegocio[] {
  if (cache) return cache;
  const idx = buildScianIndex();
  const list: DenueNegocio[] = [];

  for (const scian of Object.keys(idx)) {
    const total = VOLUMEN_POR_SCIAN[scian] ?? 25;
    const rng = mulberry32(hashStr(scian));
    for (let i = 0; i < total; i++) {
      // Selección de zona ponderada (Centro y Norte concentran más)
      const zonaPick = rng();
      const zona =
        zonaPick < 0.32 ? ZONAS[0] : // Centro
        zonaPick < 0.55 ? ZONAS[1] : // Norte
        zonaPick < 0.72 ? ZONAS[2] : // Sur
        zonaPick < 0.87 ? ZONAS[3] : // Oriente
                          ZONAS[4];  // Poniente

      // Dispersión gaussiana ~2km
      const dLat = (rng() - 0.5) * 0.045;
      const dLng = (rng() - 0.5) * 0.055;

      list.push({
        id: `${scian}-${i}`,
        nombre_establecimiento: generateName(scian, rng),
        scian,
        scian_nombre: idx[scian].scianNombre,
        latitud: zona.lat + dLat,
        longitud: zona.lng + dLng,
        colonia: zona.colonias[Math.floor(rng() * zona.colonias.length)],
        zona: zona.zona,
        empleados: EMPLEADOS_BANDS[Math.floor(rng() * EMPLEADOS_BANDS.length)],
        importancia: Math.round(rng() * 100),
      });
    }
  }
  cache = list;
  cacheByScian = new Map();
  for (const n of list) {
    const arr = cacheByScian.get(n.scian) ?? [];
    arr.push(n);
    cacheByScian.set(n.scian, arr);
  }
  return cache;
}

export function getDenueByScian(scian: string): DenueNegocio[] {
  if (!cacheByScian) getDenueDataset();
  return cacheByScian!.get(scian) ?? [];
}

// Distancia haversine (m)
export function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// Devuelve la zona Mexicali más cercana a un punto
export function zonaDeCoordenada(lat: number, lng: number): ZonaMexicali {
  let best: ZonaMexicali = "Centro";
  let bestD = Infinity;
  for (const z of ZONAS) {
    const d = haversine(lat, lng, z.lat, z.lng);
    if (d < bestD) { bestD = d; best = z.zona; }
  }
  return best;
}

export { MEXICALI_CENTER, ZONAS };
