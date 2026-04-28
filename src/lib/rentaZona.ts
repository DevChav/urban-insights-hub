/**
 * Mapa de calor de rentas comerciales en Mexicali, B.C.
 * Genera un costo estimado de renta mensual (MXN) según la zona/colonia
 * más cercana al punto consultado. Datos simulados realistas.
 */

import type { ZonaMexicali } from "./mockData";

export interface RentaEstimada {
  min: number;
  max: number;
  promedio: number;
  nivel: "Alta" | "Media-Alta" | "Media" | "Baja";
  zonaComercial: string;
  descripcion: string;
}

interface ZonaRenta {
  nombre: string;
  zona: ZonaMexicali;
  lat: number;
  lng: number;
  min: number;
  max: number;
  nivel: RentaEstimada["nivel"];
  descripcion: string;
}

// Centroides aproximados de zonas comerciales clave en Mexicali
const ZONAS_RENTA: ZonaRenta[] = [
  {
    nombre: "Justo Sierra / Aviación",
    zona: "Norte",
    lat: 32.6510,
    lng: -115.4670,
    min: 25_000,
    max: 45_000,
    nivel: "Alta",
    descripcion: "Corredor comercial premium con plazas, restaurantes y oficinas corporativas.",
  },
  {
    nombre: "Calzada Independencia",
    zona: "Norte",
    lat: 32.6420,
    lng: -115.4580,
    min: 22_000,
    max: 40_000,
    nivel: "Alta",
    descripcion: "Avenida principal con alto tráfico comercial y franquicias nacionales.",
  },
  {
    nombre: "Centro / Reforma",
    zona: "Centro",
    lat: 32.6245,
    lng: -115.4523,
    min: 15_000,
    max: 25_000,
    nivel: "Media-Alta",
    descripcion: "Zona centro histórico-comercial con flujo peatonal denso y servicios públicos.",
  },
  {
    nombre: "Novena / Río Nuevo",
    zona: "Norte",
    lat: 32.6360,
    lng: -115.4680,
    min: 15_000,
    max: 24_000,
    nivel: "Media-Alta",
    descripcion: "Corredor consolidado con comercio mixto y buena conectividad vial.",
  },
  {
    nombre: "Calafia / González Ortega",
    zona: "Sur",
    lat: 32.5800,
    lng: -115.4420,
    min: 9_000,
    max: 16_000,
    nivel: "Media",
    descripcion: "Zona residencial-comercial con demanda local estable.",
  },
  {
    nombre: "Xochimilco / Oriente",
    zona: "Oriente",
    lat: 32.6100,
    lng: -115.4050,
    min: 8_000,
    max: 14_000,
    nivel: "Media",
    descripcion: "Comercio de barrio con espacios amplios y rentas accesibles.",
  },
  {
    nombre: "Alamitos / Misiones",
    zona: "Poniente",
    lat: 32.6300,
    lng: -115.5050,
    min: 7_000,
    max: 13_000,
    nivel: "Media",
    descripcion: "Zona en crecimiento con desarrollos habitacionales recientes.",
  },
  {
    nombre: "Periferia Sur",
    zona: "Sur",
    lat: 32.5650,
    lng: -115.4250,
    min: 5_000,
    max: 10_000,
    nivel: "Baja",
    descripcion: "Zona periférica con rentas bajas, ideal para naves y comercio de paso.",
  },
  {
    nombre: "Periferia Oriente",
    zona: "Oriente",
    lat: 32.6000,
    lng: -115.3850,
    min: 5_000,
    max: 12_000,
    nivel: "Baja",
    descripcion: "Comercio popular con costo de operación bajo y mercado local.",
  },
];

function distanciaKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const lat1 = (aLat * Math.PI) / 180;
  const lat2 = (bLat * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

// PRNG determinista por punto
function pointSeed(lat: number, lng: number): number {
  const k = `${lat.toFixed(4)}|${lng.toFixed(4)}`;
  let h = 2166136261;
  for (let i = 0; i < k.length; i++) {
    h ^= k.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}

export function estimarRenta(lat: number, lng: number): RentaEstimada {
  // Encuentra la zona comercial más cercana
  let closest = ZONAS_RENTA[0];
  let minD = Infinity;
  for (const z of ZONAS_RENTA) {
    const d = distanciaKm(lat, lng, z.lat, z.lng);
    if (d < minD) {
      minD = d;
      closest = z;
    }
  }

  // Si está muy lejos de cualquier zona definida (>4 km), trátalo como periferia
  if (minD > 4) {
    const seed = pointSeed(lat, lng);
    const min = 4_000 + Math.round(seed * 3_000);
    const max = min + 4_000 + Math.round(seed * 3_000);
    return {
      min,
      max,
      promedio: Math.round((min + max) / 2),
      nivel: "Baja",
      zonaComercial: "Periferia / zona rural",
      descripcion: "Ubicación alejada de corredores comerciales; renta muy accesible pero menor flujo.",
    };
  }

  // Variación pequeña dentro del rango de la zona
  const seed = pointSeed(lat, lng);
  const min = Math.round((closest.min + (closest.max - closest.min) * 0.05 * seed) / 500) * 500;
  const max = Math.round((closest.max - (closest.max - closest.min) * 0.05 * (1 - seed)) / 500) * 500;
  const promedio = Math.round((min + max) / 2 / 500) * 500;

  return {
    min,
    max,
    promedio,
    nivel: closest.nivel,
    zonaComercial: closest.nombre,
    descripcion: closest.descripcion,
  };
}
