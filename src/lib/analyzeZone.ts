/**
 * Builds an AnalysisData object combining INEGI DENUE + Overpass data.
 * INEGI is the primary source; Overpass is fallback.
 */

import type { AnalysisData, TipoNegocio, NegocioCercano, FlujoSemanal } from "./mockData";
import { ANALISIS_POR_TIPO, RECOMENDACIONES } from "./mockData";
import { fetchNearbyPOIs, categoriseNode, getNodeName, getCompetitionCategory, type OverpassNode } from "./overpassApi";
import { fetchDenueBusinesses, categoriseDenue, getDenueName, type DenueEstablishment } from "./inegiApi";

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Simple in-memory cache ────────────────────────────────────────
interface CacheEntry {
  data: AnalysisData;
  ts: number;
}
const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function cacheKey(lat: number, lng: number, tipo: TipoNegocio, radius: number) {
  return `${lat.toFixed(4)},${lng.toFixed(4)},${tipo},${radius}`;
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
  tipo: TipoNegocio,
  radius: number = 500,
  signal?: AbortSignal
): Promise<AnalysisData> {
  // Check cache
  const key = cacheKey(lat, lng, tipo, radius);
  const cached = cache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.data;
  }

  // Try INEGI DENUE first, fallback to Overpass
  let negocios: NegocioCercano[] = [];
  let counts = { Restaurante: 0, Tienda: 0, Farmacia: 0, Banco: 0, Cafetería: 0, Gimnasio: 0, Barbería: 0, Otro: 0 };
  let source: "inegi" | "overpass" | "fallback" = "fallback";

  // Abort check helper
  const checkAbort = () => {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
  };

  try {
    checkAbort();
    const denueData = await fetchDenueBusinesses(lat, lng, radius);
    checkAbort();

    if (denueData.length > 0) {
      source = "inegi";
      denueData.forEach((est) => {
        const cat = categoriseDenue(est);
        if (cat in counts) (counts as any)[cat]++;
      });
      negocios = denueData
        .filter((est) => categoriseDenue(est) !== "Otro")
        .slice(0, 20)
        .map((est) => ({
          nombre: getDenueName(est),
          tipo: categoriseDenue(est),
          lat: parseFloat(est.Latitud),
          lng: parseFloat(est.Longitud),
        }));
    }
  } catch (err: any) {
    if (err?.name === "AbortError") throw err;
    console.warn("INEGI DENUE failed, trying Overpass", err);
  }

  // Fallback to Overpass if INEGI returned nothing
  if (source === "fallback") {
    try {
      checkAbort();
      const nodes = await fetchNearbyPOIs(lat, lng, radius);
      checkAbort();

      if (nodes.length > 0) {
        source = "overpass";
        nodes.forEach((n) => {
          const cat = categoriseNode(n);
          if (cat in counts) (counts as any)[cat]++;
        });
        negocios = nodes
          .filter((n) => categoriseNode(n) !== "Otro")
          .slice(0, 20)
          .map((n) => ({
            nombre: getNodeName(n),
            tipo: categoriseNode(n),
            lat: n.lat,
            lng: n.lon,
          }));
      }
    } catch (err: any) {
      if (err?.name === "AbortError") throw err;
      console.warn("Overpass also failed, using empty data", err);
    }
  }

  const restaurantes = counts.Restaurante + counts.Cafetería;
  const tiendas = counts.Tienda;
  const farmacias = counts.Farmacia;
  const bancos = counts.Banco;
  const totalNegocios = Object.values(counts).reduce((a, b) => a + b, 0) - counts.Otro;

  const competitionCat = getCompetitionCategory(tipo);
  const competitionCount = (counts as any)[competitionCat] ?? 0;

  const puntuacion = computeScore(totalNegocios, competitionCount);
  const nivelActividad: AnalysisData["nivelActividad"] = puntuacion >= 7.5 ? "Alto" : puntuacion >= 5 ? "Medio" : "Bajo";

  // Simulated traffic proportional to activity
  const basePeatones = totalNegocios >= 15 ? rand(2500, 5000) : totalNegocios >= 8 ? rand(1200, 3000) : rand(400, 1500);
  const baseVehicular = rand(Math.round(basePeatones * 0.8), Math.round(basePeatones * 2.5));

  const dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
  const weekdayMultipliers = [0.9, 0.85, 0.95, 1.0, 1.15, 1.3, 0.7];
  const flujoSemanal: FlujoSemanal[] = dias.map((dia, i) => ({
    dia,
    vehiculos: Math.round(baseVehicular * weekdayMultipliers[i] * (0.85 + Math.random() * 0.3)),
    peatones: Math.round(basePeatones * weekdayMultipliers[i] * (0.85 + Math.random() * 0.3)),
  }));

  const analisisPool = puntuacion >= 6 ? ANALISIS_POR_TIPO[tipo].positivo : ANALISIS_POR_TIPO[tipo].negativo;

  const result: AnalysisData = {
    lat,
    lng,
    puntuacion,
    totalNegocios,
    restaurantes,
    tiendas,
    farmacias,
    bancos,
    nivelActividad,
    recomendacion: pick(RECOMENDACIONES),
    analisisNegocio: pick(analisisPool),
    tipoSeleccionado: tipo,
    promedioPeatones: basePeatones,
    flujoVehicular: baseVehicular,
    flujoSemanal,
    negocios,
    distribucion: [
      { nombre: "Restaurantes", cantidad: restaurantes },
      { nombre: "Tiendas", cantidad: tiendas },
      { nombre: "Farmacias", cantidad: farmacias },
      { nombre: "Bancos", cantidad: bancos },
    ],
  };

  // Store in cache
  cache.set(key, { data: result, ts: Date.now() });

  return result;
}
