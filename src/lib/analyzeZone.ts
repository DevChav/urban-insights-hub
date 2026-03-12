/**
 * Builds an AnalysisData object from real Overpass POI data + simulated traffic.
 */

import type { AnalysisData, TipoNegocio, NegocioCercano, FlujoSemanal } from "./mockData";
import { ANALISIS_POR_TIPO, RECOMENDACIONES } from "./mockData";
import { fetchNearbyPOIs, categoriseNode, getNodeName, getCompetitionCategory, type OverpassNode } from "./overpassApi";

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function countByCategory(nodes: OverpassNode[]) {
  const counts = { Restaurante: 0, Tienda: 0, Farmacia: 0, Banco: 0, Cafetería: 0, Gimnasio: 0, Barbería: 0, Otro: 0 };
  nodes.forEach((n) => {
    const cat = categoriseNode(n);
    if (cat in counts) (counts as any)[cat]++;
    else counts.Otro++;
  });
  return counts;
}

function computeScore(total: number, competitionCount: number, tipo: TipoNegocio): number {
  // Higher total nearby businesses → more foot traffic → good (up to a point)
  let score = 5;

  // Activity bonus: more businesses nearby = more active area
  if (total >= 20) score += 2;
  else if (total >= 10) score += 1;

  // Competition penalty
  if (competitionCount === 0) score += 2; // no competition = great
  else if (competitionCount <= 2) score += 1;
  else if (competitionCount >= 6) score -= 2;
  else if (competitionCount >= 4) score -= 1;

  // Slight randomness for realism
  score += (Math.random() - 0.5) * 1.5;

  return Math.min(10, Math.max(1, Math.round(score * 10) / 10));
}

export async function analyzeZone(lat: number, lng: number, tipo: TipoNegocio): Promise<AnalysisData> {
  let nodes: OverpassNode[] = [];

  try {
    nodes = await fetchNearbyPOIs(lat, lng, 500);
  } catch (err) {
    console.warn("Overpass API failed, using fallback data", err);
  }

  const counts = countByCategory(nodes);
  const restaurantes = counts.Restaurante + counts.Cafetería;
  const tiendas = counts.Tienda;
  const farmacias = counts.Farmacia;
  const bancos = counts.Banco;
  const totalNegocios = nodes.filter((n) => categoriseNode(n) !== "Otro").length;

  const competitionCat = getCompetitionCategory(tipo);
  const competitionCount = (counts as any)[competitionCat] ?? 0;

  const puntuacion = computeScore(totalNegocios, competitionCount, tipo);
  const nivelActividad: AnalysisData["nivelActividad"] = puntuacion >= 7.5 ? "Alto" : puntuacion >= 5 ? "Medio" : "Bajo";

  // Build nearby businesses list (real names from OSM)
  const negocios: NegocioCercano[] = nodes
    .filter((n) => categoriseNode(n) !== "Otro")
    .slice(0, 15)
    .map((n) => ({
      nombre: getNodeName(n),
      tipo: categoriseNode(n),
      lat: n.lat,
      lng: n.lon,
    }));

  // Simulated traffic (no free API for this)
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

  return {
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
}
