/**
 * Agregados de ciudad y construcción de presupuesto detallado
 * a partir del DENUE simulado y el resultado de consultoría IA.
 */

import type { EstadisticasCiudad, Presupuesto, PresupuestoRubro, ZonaMexicali } from "./mockData";
import type { ConsultoriaResult } from "./auth";
import { getDenueByScian } from "./denueData";
import { SECTORES } from "./businessCategories";

const ZONAS_LIST: ZonaMexicali[] = ["Norte", "Sur", "Oriente", "Poniente", "Centro"];

export function getEstadisticasCiudad(scian: string | undefined): EstadisticasCiudad | null {
  if (!scian) return null;
  const negocios = getDenueByScian(scian);
  if (!negocios.length) return null;

  // Distribución por zona
  const porZonaMap = new Map<ZonaMexicali, number>();
  for (const z of ZONAS_LIST) porZonaMap.set(z, 0);
  for (const n of negocios) porZonaMap.set(n.zona, (porZonaMap.get(n.zona) ?? 0) + 1);

  const top = [...negocios].sort((a, b) => b.importancia - a.importancia).slice(0, 5);

  // Saturación: % del SCIAN respecto a algo razonable (200 como referencia)
  const saturacion = Math.min(100, Math.round((negocios.length / 200) * 100));

  const scianNombre = negocios[0].scian_nombre;

  return {
    scian,
    scianNombre,
    totalEnCiudad: negocios.length,
    porZona: ZONAS_LIST.map((z) => ({ zona: z, cantidad: porZonaMap.get(z) ?? 0 })),
    topCompetidores: top,
    saturacionPromedio: saturacion,
  };
}

// ── Presupuesto detallado a partir de la consultoría IA ─────────
const RUBRO_MAP: { match: RegExp; concepto: PresupuestoRubro["concepto"] }[] = [
  { match: /renta|local|inmueble|dep[óo]sito/i, concepto: "Local" },
  { match: /permiso|licencia|cofepris|sat|constituci|notar|legal|sanitar/i, concepto: "Permisos" },
  { match: /equipo|equipamiento|mobiliario|adecuaci|exhibidor|infraestructura|cocina|refrigerac/i, concepto: "Equipamiento" },
  { match: /marketing|promoci|lanzamiento|señalizaci|publicidad/i, concepto: "Marketing" },
  { match: /inventario|insumo|mercanc|consumible|capital de trabajo/i, concepto: "Inventario" },
];

function clasificar(concepto: string): PresupuestoRubro["concepto"] {
  for (const r of RUBRO_MAP) if (r.match.test(concepto)) return r.concepto;
  return "Otros";
}

export function buildPresupuesto(c: ConsultoriaResult): Presupuesto {
  const acc = new Map<PresupuestoRubro["concepto"], { monto: number; detalles: string[] }>();
  for (const d of c.desglose) {
    const k = clasificar(d.concepto);
    const cur = acc.get(k) ?? { monto: 0, detalles: [] };
    cur.monto += d.monto;
    cur.detalles.push(d.concepto);
    acc.set(k, cur);
  }
  const orden: PresupuestoRubro["concepto"][] = ["Local", "Permisos", "Equipamiento", "Inventario", "Marketing", "Otros"];
  const rubros: PresupuestoRubro[] = orden
    .filter((k) => acc.has(k))
    .map((k) => {
      const v = acc.get(k)!;
      return { concepto: k, monto: v.monto, detalle: v.detalles.join(" · ") };
    });

  return {
    total: { min: c.inversionMin, max: c.inversionMax },
    rubros,
  };
}

// Helper: encuentra el SCIAN desde un subcatId
export function scianDeSubcat(subcatId: string | undefined): string | undefined {
  if (!subcatId) return undefined;
  for (const s of SECTORES) {
    for (const c of s.categorias) {
      const sub = c.subcategorias.find((x) => x.id === subcatId);
      if (sub) return sub.scian;
    }
  }
  return undefined;
}
