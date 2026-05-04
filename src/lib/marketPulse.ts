/**
 * Market Pulse · Mexicali
 * Genera un feed diario de noticias/tendencias, recomendación del día,
 * misiones de emprendimiento y actividad económica horaria.
 *
 * Se persiste en localStorage por día (clave incluye fecha) para que el
 * contenido sea estable durante el día y rote al día siguiente.
 */

import type { ZonaMexicali } from "./mockData";
import { ZONAS } from "./denueData";
import { getEstadisticasCiudad } from "./cityStats";

export type PulseTipo = "oportunidad" | "tendencia" | "alerta" | "insumo" | "evento";

export interface PulseNoticia {
  id: string;
  tipo: PulseTipo;
  titulo: string;
  descripcion: string;
  zona: ZonaMexicali;
  lat: number;
  lng: number;
  delta: number;          // variación porcentual asociada
  timestamp: number;      // hora simulada del día
  relevante: boolean;     // true si afecta directamente al SCIAN del usuario
  scian?: string;
}

export interface PulseActividadHora {
  hora: string;           // "00", "01", ...
  flujo: number;          // 0-100 índice
}

export interface PulseMision {
  id: string;
  zona: ZonaMexicali;
  lat: number;
  lng: number;
  titulo: string;
  descripcion: string;
  potencial: number;      // 0-100
}

export interface PulseRecomendacion {
  titulo: string;
  texto: string;
  cta: string;
}

export interface MarketPulse {
  fecha: string;          // YYYY-MM-DD
  noticias: PulseNoticia[];
  actividad: PulseActividadHora[];
  misiones: PulseMision[];
  recomendacion: PulseRecomendacion;
}

const PULSE_KEY = "geomarket_market_pulse";

// PRNG determinista
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

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ── Plantillas de noticias por tipo ─────────────────────────────
const PLANTILLAS_GLOBAL: { tipo: PulseTipo; tpl: (z: string, d: number) => { t: string; desc: string } }[] = [
  {
    tipo: "oportunidad",
    tpl: (z, d) => ({
      t: `¡Oportunidad! Flujo peatonal en ${z} subió ${d}%`,
      desc: `Evento masivo y clima favorable dispararon la afluencia hoy. Locales con vitrina en ${z} registran picos de tráfico.`,
    }),
  },
  {
    tipo: "tendencia",
    tpl: (z, d) => ({
      t: `Tendencia de Renta: locales en ${z} bajaron ${d}%`,
      desc: `El precio promedio del m² comercial en ${z} se ajustó a la baja este mes. Buen momento para renegociar contratos.`,
    }),
  },
  {
    tipo: "alerta",
    tpl: (z, d) => ({
      t: `Alerta: saturación comercial en ${z} sube ${d}%`,
      desc: `Aumento sostenido de aperturas en ${z}. Validar competencia antes de invertir en esa zona.`,
    }),
  },
  {
    tipo: "evento",
    tpl: (z, d) => ({
      t: `Evento en ${z} mueve ${d}k personas este fin de semana`,
      desc: `Activaciones culturales y conciertos atraerán visitantes de toda la ciudad. Aprovecha con promociones express.`,
    }),
  },
];

const PLANTILLAS_SCIAN: Record<string, { tipo: PulseTipo; t: string; desc: string; delta: number }[]> = {
  // Restaurantes / Cafeterías
  "722515": [
    { tipo: "tendencia", t: "Cafeterías de especialidad: interés +15% en el Valle", desc: "Búsquedas de 'café de especialidad Mexicali' al alza. Considera lanzamiento de cold brew en temporada.", delta: 15 },
    { tipo: "insumo", t: "Café arábica sube 4% esta semana", desc: "Importadores reportan ajuste por logística. Asegura inventario para mantener margen.", delta: 4 },
  ],
  "722517": [
    { tipo: "insumo", t: "Queso mozzarella: +6% en el mayoreo", desc: "Aumento por transporte refrigerado. Renegocia con proveedor o ajusta carta de combos.", delta: 6 },
    { tipo: "oportunidad", t: "Pizzerías locales: pedidos delivery +22%", desc: "App agregadora reporta crecimiento sostenido en zona Norte y Centro.", delta: 22 },
  ],
  "722514": [
    { tipo: "tendencia", t: "Taquerías: tickets promedio suben 8%", desc: "Mayor consumo nocturno post-eventos deportivos en Mexicali.", delta: 8 },
    { tipo: "insumo", t: "Tortilla y carne al pastor: precios estables", desc: "Buen mes para mantener promociones 2x1 sin afectar margen.", delta: 0 },
  ],
  "722511": [
    { tipo: "evento", t: "Restaurantes formales: reservas fin de semana +18%", desc: "Convenciones empresariales en Centro impulsan demanda gastronómica.", delta: 18 },
  ],
  "461110": [
    { tipo: "tendencia", t: "Abarrotes: ticket promedio +5% mensual", desc: "Consumo de hogar al alza. Surte productos básicos premium.", delta: 5 },
  ],
  "464111": [
    { tipo: "alerta", t: "Farmacias: nueva regulación COFEPRIS publicada", desc: "Revisar cumplimiento de aviso de funcionamiento antes del próximo trimestre.", delta: 0 },
  ],
  "812110": [
    { tipo: "tendencia", t: "Estéticas: reservas online +28% este mes", desc: "El uso de WhatsApp Business para citas se vuelve diferenciador.", delta: 28 },
  ],
};

// ── Generador principal ─────────────────────────────────────────
export function getMarketPulse(scian: string | undefined, opts?: { force?: boolean }): MarketPulse {
  const fecha = todayKey();
  if (!opts?.force) {
    try {
      const raw = localStorage.getItem(PULSE_KEY);
      if (raw) {
        const cached: MarketPulse = JSON.parse(raw);
        if (cached.fecha === fecha) return cached;
      }
    } catch { /* ignore */ }
  }

  const seed = hashStr(`${fecha}::${scian ?? "global"}`);
  const rng = mulberry32(seed);

  // Noticias globales (rotando 4 zonas)
  const noticias: PulseNoticia[] = [];
  const zonasShuffled = [...ZONAS].sort(() => rng() - 0.5).slice(0, 4);
  zonasShuffled.forEach((zinfo, i) => {
    const tpl = PLANTILLAS_GLOBAL[Math.floor(rng() * PLANTILLAS_GLOBAL.length)];
    const delta = Math.round(5 + rng() * 25);
    const { t, desc } = tpl.tpl(zinfo.zona, delta);
    noticias.push({
      id: `g-${fecha}-${i}`,
      tipo: tpl.tipo,
      titulo: t,
      descripcion: desc,
      zona: zinfo.zona,
      lat: zinfo.lat + (rng() - 0.5) * 0.01,
      lng: zinfo.lng + (rng() - 0.5) * 0.01,
      delta,
      timestamp: Date.now() - Math.floor(rng() * 8 * 3600 * 1000),
      relevante: false,
    });
  });

  // Noticias específicas del SCIAN (relevantes y priorizadas)
  if (scian && PLANTILLAS_SCIAN[scian]) {
    PLANTILLAS_SCIAN[scian].forEach((p, i) => {
      const zinfo = zonasShuffled[i % zonasShuffled.length];
      noticias.unshift({
        id: `s-${fecha}-${scian}-${i}`,
        tipo: p.tipo,
        titulo: p.t,
        descripcion: p.desc,
        zona: zinfo.zona,
        lat: zinfo.lat + (rng() - 0.5) * 0.008,
        lng: zinfo.lng + (rng() - 0.5) * 0.008,
        delta: p.delta,
        timestamp: Date.now() - Math.floor(rng() * 4 * 3600 * 1000),
        relevante: true,
        scian,
      });
    });
  }

  // Actividad económica horaria (curva tipo retail con doble pico)
  const actividad: PulseActividadHora[] = Array.from({ length: 24 }, (_, h) => {
    const base = 30
      + 35 * Math.exp(-Math.pow((h - 13) / 3.2, 2))
      + 45 * Math.exp(-Math.pow((h - 19) / 2.4, 2));
    const noise = (rng() - 0.5) * 12;
    return { hora: String(h).padStart(2, "0"), flujo: Math.max(5, Math.round(base + noise)) };
  });

  // Misiones: zonas con menos competencia para el SCIAN del usuario
  const misiones: PulseMision[] = [];
  const stats = getEstadisticasCiudad(scian);
  if (stats) {
    const ordenadas = [...stats.porZona].sort((a, b) => a.cantidad - b.cantidad).slice(0, 3);
    ordenadas.forEach((z, i) => {
      const zinfo = ZONAS.find((zz) => zz.zona === z.zona)!;
      const potencial = Math.max(40, 100 - z.cantidad * 4 - i * 5);
      misiones.push({
        id: `m-${fecha}-${z.zona}`,
        zona: z.zona,
        lat: zinfo.lat,
        lng: zinfo.lng,
        titulo: `Zona ${z.zona} desatendida`,
        descripcion: `Solo ${z.cantidad} negocios de tu giro operan aquí. Validar abre ventana de captura de mercado temprana.`,
        potencial,
      });
    });
  } else {
    // Fallback genérico
    ZONAS.slice(0, 3).forEach((zinfo, i) => {
      misiones.push({
        id: `m-${fecha}-${zinfo.zona}`,
        zona: zinfo.zona,
        lat: zinfo.lat,
        lng: zinfo.lng,
        titulo: `Zona ${zinfo.zona} con potencial`,
        descripcion: "Demanda creciente y baja densidad comercial específica del giro.",
        potencial: 70 + i * 5,
      });
    });
  }

  // Recomendación del día
  const horaPico = actividad.reduce((a, b) => (b.flujo > a.flujo ? b : a));
  const noticiaTop = noticias[0];
  const recomendacion: PulseRecomendacion = {
    titulo: "Recomendación del día",
    texto: noticiaTop?.relevante
      ? `${noticiaTop.titulo}. Aprovecha con una promoción dirigida hoy entre las ${horaPico.hora}:00 y ${String((Number(horaPico.hora) + 2) % 24).padStart(2, "0")}:00, cuando se concentra el mayor flujo en tu zona.`
      : `Hoy el flujo peatonal pico será a las ${horaPico.hora}:00 hrs. Lanza una promoción 2x1 o early-bird para capturar el mayor tráfico del día en Mexicali.`,
    cta: "Ver detalle en el mapa",
  };

  const pulse: MarketPulse = { fecha, noticias, actividad, misiones, recomendacion };
  try { localStorage.setItem(PULSE_KEY, JSON.stringify(pulse)); } catch { /* ignore */ }
  return pulse;
}

export function clearMarketPulse() {
  try { localStorage.removeItem(PULSE_KEY); } catch { /* ignore */ }
}
