/**
 * Builds an AnalysisData object combining INEGI DENUE + Overpass data.
 * Now uses the hierarchical subcategory system with keyword-based matching.
 */

import type { AnalysisData, NegocioCercano, FlujoSemanal } from "./mockData";
import { getCompetitionKeywords, getAnalisisTexts, findSubcategoria } from "./businessCategories";
import { fetchNearbyPOIs, getNodeName, type OverpassNode } from "./overpassApi";
import { fetchDenueBusinesses, getDenueName, type DenueEstablishment } from "./inegiApi";

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
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

/** Check if a business matches the selected subcategory keywords */
function matchesKeywords(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((kw) => lower.includes(kw.toLowerCase()));
}

/** Broad category label from DENUE or Overpass text */
function broadCategory(text: string): string {
  const lower = text.toLowerCase();
  if (["restaurant", "comida", "taco", "mariscos", "sushi", "alimento", "cocina", "food"].some(k => lower.includes(k))) return "Restaurantes";
  if (["café", "cafetería", "coffee"].some(k => lower.includes(k))) return "Cafeterías";
  if (["farmacia", "pharmacy", "medicamento"].some(k => lower.includes(k))) return "Farmacias";
  if (["banco", "bank", "financier"].some(k => lower.includes(k))) return "Bancos";
  if (["tienda", "shop", "boutique", "ropa", "abarrot"].some(k => lower.includes(k))) return "Comercios";
  if (["gimnasio", "gym", "fitness"].some(k => lower.includes(k))) return "Fitness";
  if (["estética", "barbería", "salón", "belleza", "barber"].some(k => lower.includes(k))) return "Belleza";
  if (["escuela", "academia", "tutoría"].some(k => lower.includes(k))) return "Educación";
  if (["taller", "autolavado", "llanta", "mecánic"].some(k => lower.includes(k))) return "Automotriz";
  return "Otros";
}

// ── Scoring ───────────────────────────────────────────────────────
function computeScore(total: number, competitionCount: number): number {
  let score = 5;
  if (total >= 20) score += 2;
  else if (total >= 10) score += 1;
  if (competitionCount === 0) score += 2;
  else if (competitionCount <= 2) score += 1;
  else if (competitionCount >= 6) score -= 2;
  else if (competitionCount >= 4) score -= 1;
  score += (Math.random() - 0.5) * 1.5;
  return Math.min(10, Math.max(1, Math.round(score * 10) / 10));
}

// ── Main analysis function ────────────────────────────────────────
export async function analyzeZone(
  lat: number,
  lng: number,
  subcatId: string,
  radius: number = 500,
  signal?: AbortSignal
): Promise<AnalysisData> {
  const key = cacheKey(lat, lng, subcatId, radius);
  const cached = cache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;

  const subcatInfo = findSubcategoria(subcatId);
  const keywords = subcatInfo?.keywords ?? [];
  const subcatLabel = subcatInfo?.label ?? subcatId;

  const checkAbort = () => {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
  };

  let negocios: NegocioCercano[] = [];
  let allBusinessTexts: string[] = [];
  let source: "inegi" | "overpass" | "fallback" = "fallback";

  // Try INEGI first
  try {
    checkAbort();
    const denueData = await fetchDenueBusinesses(lat, lng, radius);
    checkAbort();
    if (denueData.length > 0) {
      source = "inegi";
      allBusinessTexts = denueData.map((est) => `${est.Clase_actividad} ${est.Nombre}`.toLowerCase());
      negocios = denueData
        .slice(0, 25)
        .map((est) => ({
          nombre: getDenueName(est),
          tipo: broadCategory(`${est.Clase_actividad} ${est.Nombre}`),
          lat: parseFloat(est.Latitud),
          lng: parseFloat(est.Longitud),
        }));
    }
  } catch (err: any) {
    if (err?.name === "AbortError") throw err;
    console.warn("INEGI DENUE failed, trying Overpass", err);
  }

  // Fallback to Overpass
  if (source === "fallback") {
    try {
      checkAbort();
      const nodes = await fetchNearbyPOIs(lat, lng, radius);
      checkAbort();
      if (nodes.length > 0) {
        source = "overpass";
        allBusinessTexts = nodes.map((n) => Object.values(n.tags || {}).join(" ").toLowerCase());
        negocios = nodes
          .slice(0, 25)
          .map((n) => ({
            nombre: getNodeName(n),
            tipo: broadCategory(Object.values(n.tags || {}).join(" ")),
            lat: n.lat,
            lng: n.lon,
          }));
      }
    } catch (err: any) {
      if (err?.name === "AbortError") throw err;
      console.warn("Overpass also failed", err);
    }
  }

  // Count competition (how many match selected subcategory keywords)
  const competidoresDirectos = allBusinessTexts.filter((t) => matchesKeywords(t, keywords)).length;
  const totalNegocios = negocios.length;

  // Build distribution from actual data
  const distMap = new Map<string, number>();
  negocios.forEach((n) => {
    distMap.set(n.tipo, (distMap.get(n.tipo) || 0) + 1);
  });
  const distribucion = Array.from(distMap.entries())
    .map(([nombre, cantidad]) => ({ nombre, cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 6);

  const puntuacion = computeScore(totalNegocios, competidoresDirectos);
  const nivelActividad: AnalysisData["nivelActividad"] = puntuacion >= 7.5 ? "Alto" : puntuacion >= 5 ? "Medio" : "Bajo";

  const basePeatones = totalNegocios >= 15 ? rand(2500, 5000) : totalNegocios >= 8 ? rand(1200, 3000) : rand(400, 1500);
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
    totalNegocios,
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
