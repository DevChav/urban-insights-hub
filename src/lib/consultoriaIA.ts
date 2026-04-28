/** Simulated AI business consultant for Mexicali, MX. */

import { SECTORES, type Subcategoria } from "./businessCategories";
import type { ConsultoriaResult, TamanoEmpresa } from "./auth";

export interface ConsultoriaContext {
  tamano?: TamanoEmpresa;
  presupuestoMin?: number;
  presupuestoMax?: number;
}

interface CostProfile {
  base: [number, number];
  desglose: { concepto: string; pct: number }[];
  criticos: { item: string; descripcion: string }[];
}

const PROFILES: Record<string, CostProfile> = {
  alimentos: {
    base: [180_000, 650_000],
    desglose: [
      { concepto: "Equipo de cocina y refrigeración", pct: 0.32 },
      { concepto: "Mobiliario y adecuación del local", pct: 0.22 },
      { concepto: "Inventario inicial de insumos", pct: 0.12 },
      { concepto: "Permisos y licencias", pct: 0.08 },
      { concepto: "Renta y depósito (3 meses)", pct: 0.18 },
      { concepto: "Marketing de apertura", pct: 0.08 },
    ],
    criticos: [
      { item: "Aviso de Funcionamiento COFEPRIS", descripcion: "Obligatorio para manejo de alimentos en BC." },
      { item: "Licencia de uso de suelo comercial", descripcion: "Tramitada en el Ayuntamiento de Mexicali." },
      { item: "Curso de manejo higiénico de alimentos", descripcion: "Distintivo H recomendado para diferenciación." },
      { item: "Constancia de situación fiscal SAT", descripcion: "Régimen RESICO sugerido para PyMEs." },
      { item: "Sistema POS y facturación CFDI 4.0", descripcion: "Indispensable para operación formal." },
    ],
  },
  comercio: {
    base: [120_000, 450_000],
    desglose: [
      { concepto: "Inventario inicial de mercancía", pct: 0.42 },
      { concepto: "Adecuación y exhibidores", pct: 0.18 },
      { concepto: "Renta y depósito (3 meses)", pct: 0.18 },
      { concepto: "Permisos y constitución legal", pct: 0.07 },
      { concepto: "Sistema de punto de venta", pct: 0.06 },
      { concepto: "Marketing y señalización", pct: 0.09 },
    ],
    criticos: [
      { item: "Licencia de uso de suelo comercial", descripcion: "Verificar zonificación en Mexicali." },
      { item: "Alta en SAT y cédula RFC", descripcion: "Persona física o moral según volumen." },
      { item: "Sistema de inventario y POS", descripcion: "Control de stock crítico para retail." },
      { item: "Anuncios exteriores con permiso", descripcion: "Trámite ante Desarrollo Urbano municipal." },
    ],
  },
  "servicios-personales": {
    base: [90_000, 380_000],
    desglose: [
      { concepto: "Equipo especializado del rubro", pct: 0.35 },
      { concepto: "Adecuación del local", pct: 0.20 },
      { concepto: "Insumos y consumibles iniciales", pct: 0.10 },
      { concepto: "Renta y depósito (3 meses)", pct: 0.20 },
      { concepto: "Permisos y certificaciones", pct: 0.08 },
      { concepto: "Marketing local", pct: 0.07 },
    ],
    criticos: [
      { item: "Licencia sanitaria estatal", descripcion: "Aplica para salud, belleza y estética." },
      { item: "Cédulas profesionales del personal", descripcion: "Obligatorio para servicios médicos." },
      { item: "Seguro de responsabilidad civil", descripcion: "Protección ante incidentes con clientes." },
      { item: "Protocolo de bioseguridad", descripcion: "Norma vigente post-pandemia en BC." },
    ],
  },
  "otros-sectores": {
    base: [150_000, 800_000],
    desglose: [
      { concepto: "Infraestructura y equipo", pct: 0.30 },
      { concepto: "Adecuación del inmueble", pct: 0.20 },
      { concepto: "Capital de trabajo", pct: 0.20 },
      { concepto: "Permisos y trámites", pct: 0.10 },
      { concepto: "Renta y depósito", pct: 0.12 },
      { concepto: "Lanzamiento y promoción", pct: 0.08 },
    ],
    criticos: [
      { item: "Constitución legal ante notario", descripcion: "Persona moral recomendada." },
      { item: "Permisos sectoriales específicos", descripcion: "Variables según giro (CNBV, etc)." },
      { item: "Apertura de cuenta bancaria empresarial", descripcion: "Para operación formal." },
    ],
  },
};

function findSubcat(subcatId: string): { sub: Subcategoria; sectorId: string } | null {
  for (const sector of SECTORES) {
    for (const cat of sector.categorias) {
      const sub = cat.subcategorias.find((s) => s.id === subcatId);
      if (sub) return { sub, sectorId: sector.id };
    }
  }
  return null;
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export async function generarConsultoria(
  subcatId: string,
  ideaNegocio: string,
  ctx: ConsultoriaContext = {},
): Promise<ConsultoriaResult> {
  // Simulate processing time
  await new Promise((r) => setTimeout(r, 1400 + Math.random() * 800));

  const found = findSubcat(subcatId);
  const sectorId = found?.sectorId ?? "otros-sectores";
  const profile = PROFILES[sectorId] ?? PROFILES["otros-sectores"];

  // Tamaño multiplica la inversión base
  const tamanoFactor = ctx.tamano === "mediana" ? 2.4 : ctx.tamano === "pequena" ? 1.5 : 1;
  const variation = rand(0.85, 1.15);
  let inversionMin = Math.round((profile.base[0] * variation * tamanoFactor) / 1000) * 1000;
  let inversionMax = Math.round((profile.base[1] * variation * tamanoFactor) / 1000) * 1000;

  // Si hay presupuesto, ajusta el resultado para mantenerlo dentro del rango realista
  if (ctx.presupuestoMin && ctx.presupuestoMax) {
    inversionMin = Math.max(inversionMin, Math.round(ctx.presupuestoMin * 0.9));
    inversionMax = Math.min(Math.max(inversionMax, ctx.presupuestoMax), Math.round(ctx.presupuestoMax * 1.15));
    if (inversionMax < inversionMin) inversionMax = Math.round(inversionMin * 1.3);
  }
  const promedio = (inversionMin + inversionMax) / 2;

  const desglose = profile.desglose.map((d) => ({
    concepto: d.concepto,
    monto: Math.round((promedio * d.pct) / 1000) * 1000,
  }));

  const subcatNombre = found?.sub.nombre ?? "tu negocio";
  const palabras = ideaNegocio.trim().split(/\s+/).filter(Boolean).length;
  const enfoque =
    palabras > 30
      ? "Tu propuesta es detallada, lo que facilita identificar diferenciadores claros frente a la competencia local."
      : palabras > 10
      ? "Tu idea tiene una base sólida; conviene reforzar el diferenciador competitivo en Mexicali."
      : "Recomendamos ampliar la descripción del concepto para evaluar mejor el posicionamiento.";

  const tamanoLabel =
    ctx.tamano === "mediana" ? "mediana empresa (51+ empleados)" :
    ctx.tamano === "pequena" ? "pequeña empresa (11–50 empleados)" :
    ctx.tamano ? "microempresa (1–10 empleados)" : null;

  const presupuestoFrase = ctx.presupuestoMin && ctx.presupuestoMax
    ? ` Tu presupuesto declarado ($${ctx.presupuestoMin.toLocaleString("es-MX")}–$${ctx.presupuestoMax.toLocaleString("es-MX")} MXN) ${ctx.presupuestoMax < inversionMax ? "queda por debajo del promedio del sector; será necesario optimizar costos o buscar financiamiento" : "es competitivo para el sector"}.`
    : "";

  const resumen = `Para ${tamanoLabel ? `una ${tamanoLabel} del rubro` : "abrir un negocio del rubro"} "${subcatNombre}" en Mexicali, B.C., se estima una inversión inicial entre $${inversionMin.toLocaleString("es-MX")} y $${inversionMax.toLocaleString("es-MX")} MXN.${presupuestoFrase} ${enfoque} Considera el clima extremo de la región (impacto en climatización) y la dinámica fronteriza al definir horarios y estrategia de precios.`;

  return {
    inversionMin,
    inversionMax,
    desglose,
    criticos: profile.criticos,
    resumen,
    generadoEn: new Date().toISOString(),
  };
}
