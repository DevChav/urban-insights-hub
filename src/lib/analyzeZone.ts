/**
 * Analiza una zona usando el dataset DENUE simulado local.
 * No depende de ningún backend.
 */

import type { AnalysisData, FlujoSemanal, NegocioCercano, DemografiaZona } from "./mockData";
import { SECTORES } from "./businessCategories";
import { getDenueByScian, getDenueDataset, haversine, zonaDeCoordenada } from "./denueData";
import { estimarRenta } from "./rentaZona";

function findSubcat(subcatId: string) {
  for (const s of SECTORES) {
    for (const c of s.categorias) {
      const sub = c.subcategorias.find((x) => x.id === subcatId);
      if (sub) return { sub, sectorId: s.id, categoriaId: c.id };
    }
  }
  return null;
}

// PRNG determinista por punto
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pointSeed(lat: number, lng: number, subcatId: string, radius: number): number {
  const k = `${lat.toFixed(4)}|${lng.toFixed(4)}|${subcatId}|${radius}`;
  let h = 2166136261;
  for (let i = 0; i < k.length; i++) { h ^= k.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

function buildDemografia(rng: () => number, radius: number): DemografiaZona {
  // Densidad ~ 4500 hab/km² Mexicali
  const areaKm2 = Math.PI * (radius / 1000) ** 2;
  const poblacion = Math.round(areaKm2 * (3500 + rng() * 2500));
  const pctH = 0.47 + rng() * 0.06;
  const hombres = Math.round(poblacion * pctH);
  const mujeres = poblacion - hombres;

  const ranges = [
    { rango: "0-14", base: 0.24 },
    { rango: "15-29", base: 0.27 },
    { rango: "30-44", base: 0.23 },
    { rango: "45-59", base: 0.16 },
    { rango: "60+",   base: 0.10 },
  ];
  let acc = 0;
  const porEdad = ranges.map((r, i) => {
    const variation = (rng() - 0.5) * 0.04;
    const pct = Math.max(0.04, r.base + variation);
    const c = i === ranges.length - 1
      ? Math.max(0, poblacion - acc)
      : Math.round(poblacion * pct);
    acc += c;
    return { rango: r.rango, cantidad: c };
  });

  const ingreso = Math.round((9500 + rng() * 6500) / 100) * 100;

  return {
    poblacionTotal: poblacion,
    porGenero: { hombres, mujeres },
    porEdad,
    ingresoPromedioMensual: ingreso,
  };
}

const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function buildFlujoSemanal(rng: () => number, basePeat: number, baseVeh: number): FlujoSemanal[] {
  const factors = [0.9, 0.95, 1.0, 1.05, 1.25, 1.35, 0.85];
  return DIAS.map((d, i) => ({
    dia: d,
    peatones: Math.round(basePeat * factors[i] * (0.9 + rng() * 0.2)),
    vehiculos: Math.round(baseVeh * factors[i] * (0.9 + rng() * 0.2)),
  }));
}

function generarRecomendacion(comp: number, total: number, label: string): string {
  if (comp === 0)
    return `Excelente oportunidad: no hay ${label.toLowerCase()} en el radio. Mercado virgen, evalúa la demanda real con encuestas locales.`;
  if (comp <= 2)
    return `Competencia baja para ${label.toLowerCase()}. Posición favorable; enfócate en diferenciación de servicio y precio.`;
  if (comp <= 5)
    return `Competencia moderada. Hay demanda probada; necesitas una propuesta de valor clara para destacar.`;
  return `Zona saturada para ${label.toLowerCase()} (${comp} competidores). Considera otra ubicación o un nicho específico.`;
}

function generarAnalisisNegocio(label: string, total: number, comp: number, demo: DemografiaZona): string {
  const ing = demo.ingresoPromedioMensual.toLocaleString("es-MX");
  return `En esta zona viven ~${demo.poblacionTotal.toLocaleString("es-MX")} personas con ingreso promedio de $${ing} MXN/mes. Para ${label}, la mezcla demográfica favorece edades 15-44 (${Math.round(((demo.porEdad[1].cantidad + demo.porEdad[2].cantidad) / demo.poblacionTotal) * 100)}% de la población). Hay ${total} negocios totales y ${comp} competidores directos en el radio.`;
}

export async function analyzeZone(
  lat: number,
  lng: number,
  subcatId: string,
  radius: number = 500,
  _signal?: AbortSignal,
): Promise<AnalysisData> {
  // Pequeña espera para sentir procesamiento (UX)
  await new Promise((r) => setTimeout(r, 280));

  const found = findSubcat(subcatId);
  const label = found?.sub.nombre ?? "negocio";
  const scian = found?.sub.scian;

  const rng = mulberry32(pointSeed(lat, lng, subcatId, radius));
  const zona = zonaDeCoordenada(lat, lng);

  // ── Competidores directos (mismo SCIAN) dentro del radio ─────
  const denueScian = scian ? getDenueByScian(scian) : [];
  const competidores = denueScian.filter(
    (n) => haversine(lat, lng, n.latitud, n.longitud) <= radius,
  );

  // ── Negocios totales (cualquier SCIAN) dentro del radio ──────
  const all = getDenueDataset();
  const totales = all.filter(
    (n) => haversine(lat, lng, n.latitud, n.longitud) <= radius,
  );

  // ── Distribución por categoría amplia ────────────────────────
  const dist = new Map<string, number>();
  for (const n of totales) {
    const k = n.scian_nombre.length > 18 ? n.scian_nombre.slice(0, 16) + "…" : n.scian_nombre;
    dist.set(k, (dist.get(k) ?? 0) + 1);
  }
  const distribucion = Array.from(dist.entries())
    .map(([nombre, cantidad]) => ({ nombre, cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 6);

  // ── Marcadores para mapa (limitar a 25 más cercanos) ─────────
  const negocios: NegocioCercano[] = totales
    .map((n) => ({
      ...n,
      _d: haversine(lat, lng, n.latitud, n.longitud),
    }))
    .sort((a, b) => a._d - b._d)
    .slice(0, 25)
    .map((n) => ({
      nombre: n.nombre_establecimiento,
      tipo: n.scian_nombre,
      lat: n.latitud,
      lng: n.longitud,
    }));

  // ── Tráfico estimado (función del radio + densidad) ──────────
  const densidad = totales.length / Math.max(1, (radius / 100));
  const basePeat = Math.round(450 + densidad * 80 + rng() * 600);
  const baseVeh = Math.round(800 + densidad * 120 + rng() * 1200);
  const flujoSemanal = buildFlujoSemanal(rng, basePeat, baseVeh);
  const promedioPeatones = Math.round(flujoSemanal.reduce((a, x) => a + x.peatones, 0) / 7);
  const flujoVehicular = Math.round(flujoSemanal.reduce((a, x) => a + x.vehiculos, 0) / 7);

  // ── Puntuación 0-10 ──────────────────────────────────────────
  // Más tráfico ↑ y menos competencia ↑
  const trafScore = Math.min(10, (promedioPeatones / 1200) * 5 + (flujoVehicular / 6000) * 5);
  const compPenalty = Math.min(6, competidores.length * 0.6);
  const puntuacion = Math.max(1, Math.min(10, Math.round((trafScore - compPenalty + 4) * 10) / 10));

  const nivelActividad: AnalysisData["nivelActividad"] =
    promedioPeatones > 1800 ? "Alto" : promedioPeatones > 900 ? "Medio" : "Bajo";

  const demografia = buildDemografia(rng, radius);
  const renta = estimarRenta(lat, lng);

  return {
    lat,
    lng,
    radio: radius,
    puntuacion,
    totalNegocios: totales.length,
    competidoresDirectos: competidores.length,
    nivelActividad,
    recomendacion: generarRecomendacion(competidores.length, totales.length, label),
    analisisNegocio: generarAnalisisNegocio(label, totales.length, competidores.length, demografia),
    subcategoriaLabel: label,
    scian,
    zona,
    promedioPeatones,
    flujoVehicular,
    flujoSemanal,
    negocios,
    distribucion,
    demografia,
    timestamp: Date.now(),
  };
}
