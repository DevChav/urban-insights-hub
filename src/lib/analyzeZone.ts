/**
 * Builds an AnalysisData object using simulated (mock) data.
 * Generates realistic random businesses based on the selected subcategory and radius.
 */

import type { AnalysisData, NegocioCercano, FlujoSemanal } from "./mockData";
import { findSubcategoria, getAnalisisTexts, SECTORES } from "./businessCategories";

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min: number, max: number) {
  return min + Math.random() * (max - min);
}

// ── Simple in-memory cache ────────────────────────────────────────
interface CacheEntry {
  data: AnalysisData;
  ts: number;
}
const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000;

function cacheKey(lat: number, lng: number, subcatId: string, radius: number) {
  return `${lat.toFixed(4)},${lng.toFixed(4)},${subcatId},${radius}`;
}

// ── Mock business name pools ──────────────────────────────────────
const MEXICALI_COLONIAS = [
  "Centro", "Nueva", "Río Nuevo", "Pro-Hogar", "Pueblo Nuevo", "Industrial",
  "Xochimilco", "González Ortega", "Ex-Ejido Coahuila", "Alamitos", "Calafia",
  "Los Pinos", "Baja California", "Orizaba", "Independencia", "El Dorado",
];

const NAME_PREFIXES: Record<string, string[]> = {
  "Restaurantes": ["La Cocina de", "El Rincón de", "Sabor", "Don", "Casa", "Taquería El", "Mariscos El"],
  "Cafeterías": ["Café", "Coffee Lab", "Aroma", "El Grano de", "Brew", "La Taza de"],
  "Postres y snacks": ["Dulce", "Nieves", "Helados", "La Paleta de", "Churros"],
  "Bares y vida nocturna": ["Bar", "La Cantina", "Pub", "Lounge", "Club"],
  "Ropa": ["Boutique", "Fashion", "Style", "Urban", "Moda"],
  "Tecnología": ["TechZone", "Digital", "CompuMax", "GameStore", "CelularFix"],
  "Tiendas especializadas": ["El Rincón del", "Colección", "Mundo", "La Tienda de"],
  "Belleza": ["Estética", "Barbería", "Salón", "Studio", "Beauty"],
  "Salud": ["Consultorio", "Clínica", "Farmacia", "Lab", "Dr."],
  "Fitness": ["Gym", "CrossFit", "Yoga Studio", "FitLife", "Power"],
  "Entretenimiento": ["Fun", "Play", "Zona", "Arena", "Game"],
  "Servicios automotrices": ["AutoService", "Taller", "Car Wash", "LlantaPro", "DetailMaster"],
  "Negocios fronterizos": ["Express", "Cambio", "Envíos", "Import", "Border"],
  "Servicios tecnológicos": ["DevLab", "TechSupport", "IT Solutions", "CyberSec", "AutoMex"],
  "Educación": ["Academia", "Escuela", "Instituto", "Learning", "Tutoring"],
};

const NAME_SUFFIXES = [
  "Mexicali", "Cachanilla", "del Valle", "Express", "Premium",
  "Plus", "Central", "del Norte", "Pro", "MXL",
];

const BROAD_CATEGORIES = [
  "Restaurantes", "Cafeterías", "Farmacias", "Comercios",
  "Fitness", "Belleza", "Educación", "Automotriz", "Servicios", "Otros",
];

function generateBusinessName(categoryName: string): string {
  const prefixes = NAME_PREFIXES[categoryName] || NAME_PREFIXES["Restaurantes"];
  const prefix = prefixes[rand(0, prefixes.length - 1)];
  const suffix = NAME_SUFFIXES[rand(0, NAME_SUFFIXES.length - 1)];
  return `${prefix} ${suffix}`;
}

function randomPointInRadius(lat: number, lng: number, radiusM: number): { lat: number; lng: number } {
  const r = radiusM / 111320;
  const angle = Math.random() * 2 * Math.PI;
  const dist = Math.sqrt(Math.random()) * r;
  return {
    lat: lat + dist * Math.cos(angle),
    lng: lng + dist * Math.sin(angle) / Math.cos(lat * Math.PI / 180),
  };
}

function getCategoryNameForSubcat(subcatId: string): string {
  for (const sector of SECTORES) {
    for (const cat of sector.categorias) {
      if (cat.subcategorias.some(s => s.id === subcatId)) {
        return cat.nombre;
      }
    }
  }
  return "Otros";
}

// ── Main analysis function ────────────────────────────────────────
export async function analyzeZone(
  lat: number,
  lng: number,
  subcatId: string,
  radius: number = 500,
  _signal?: AbortSignal
): Promise<AnalysisData> {
  const key = cacheKey(lat, lng, subcatId, radius);
  const cached = cache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;

  const subcatInfo = findSubcategoria(subcatId);
  const subcatLabel = subcatInfo?.label ?? subcatId;
  const categoryName = getCategoryNameForSubcat(subcatId);

  // Simulate a tiny delay for realism (50-150ms)
  await new Promise(r => setTimeout(r, rand(50, 150)));

  // Generate mock businesses scaled by radius
  const scaleFactor = radius / 500;
  const totalCount = rand(Math.round(8 * scaleFactor), Math.round(30 * scaleFactor));
  const competidoresDirectos = rand(0, Math.min(totalCount, Math.round(6 * scaleFactor)));

  const negocios: NegocioCercano[] = [];

  // Add direct competitors
  for (let i = 0; i < Math.min(competidoresDirectos, 15); i++) {
    const pos = randomPointInRadius(lat, lng, radius);
    negocios.push({
      nombre: generateBusinessName(categoryName),
      tipo: categoryName,
      lat: pos.lat,
      lng: pos.lng,
    });
  }

  // Add other businesses (non-competitors)
  const otherCount = Math.min(totalCount - competidoresDirectos, 15);
  for (let i = 0; i < otherCount; i++) {
    const pos = randomPointInRadius(lat, lng, radius);
    const randomCat = BROAD_CATEGORIES[rand(0, BROAD_CATEGORIES.length - 1)];
    negocios.push({
      nombre: generateBusinessName(randomCat !== categoryName ? randomCat : "Comercios"),
      tipo: randomCat,
      lat: pos.lat,
      lng: pos.lng,
    });
  }

  // Build distribution
  const distMap = new Map<string, number>();
  negocios.forEach((n) => {
    distMap.set(n.tipo, (distMap.get(n.tipo) || 0) + 1);
  });
  const distribucion = Array.from(distMap.entries())
    .map(([nombre, cantidad]) => ({ nombre, cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 6);

  // Scoring
  let score = 5;
  if (totalCount >= 20) score += 2;
  else if (totalCount >= 10) score += 1;
  if (competidoresDirectos === 0) score += 2;
  else if (competidoresDirectos <= 2) score += 1;
  else if (competidoresDirectos >= 6) score -= 2;
  else if (competidoresDirectos >= 4) score -= 1;
  score += (Math.random() - 0.5) * 1.5;
  const puntuacion = Math.min(10, Math.max(1, Math.round(score * 10) / 10));

  const nivelActividad: AnalysisData["nivelActividad"] =
    puntuacion >= 7.5 ? "Alto" : puntuacion >= 5 ? "Medio" : "Bajo";

  const basePeatones = totalCount >= 15 ? rand(2500, 5000) : totalCount >= 8 ? rand(1200, 3000) : rand(400, 1500);
  const baseVehicular = rand(Math.round(basePeatones * 0.8), Math.round(basePeatones * 2.5));

  const dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
  const weekdayMultipliers = [0.9, 0.85, 0.95, 1.0, 1.15, 1.3, 0.7];
  const flujoSemanal: FlujoSemanal[] = dias.map((dia, i) => ({
    dia,
    vehiculos: Math.round(baseVehicular * weekdayMultipliers[i] * (0.85 + Math.random() * 0.3)),
    peatones: Math.round(basePeatones * weekdayMultipliers[i] * (0.85 + Math.random() * 0.3)),
  }));

  const { analisis, recomendacion } = getAnalisisTexts(subcatLabel, puntuacion);

  const result: AnalysisData = {
    lat,
    lng,
    puntuacion,
    totalNegocios: totalCount,
    competidoresDirectos,
    nivelActividad,
    recomendacion,
    analisisNegocio: analisis,
    subcategoriaLabel: subcatLabel,
    promedioPeatones: basePeatones,
    flujoVehicular: baseVehicular,
    flujoSemanal,
    negocios,
    distribucion,
  };

  cache.set(key, { data: result, ts: Date.now() });
  return result;
}
