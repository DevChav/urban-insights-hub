// ── Compat con DENUE (SQL Server) ───────────────────────────────
// Campos alineados con el dataset oficial del INEGI.
export interface DenueNegocio {
  id: string;
  nombre_establecimiento: string;
  scian: string;          // Código SCIAN (clase)
  scian_nombre: string;   // Nombre humano del SCIAN
  latitud: number;
  longitud: number;
  colonia: string;
  zona: ZonaMexicali;     // Norte | Sur | Oriente | Poniente | Centro
  empleados: string;      // Rango "0 a 5", "6 a 10", etc. (DENUE)
  importancia: number;    // 0-100, simulado para ranking
}

export type ZonaMexicali = "Norte" | "Sur" | "Oriente" | "Poniente" | "Centro";

// Vista ligera para UI (compat con código previo)
export interface NegocioCercano {
  nombre: string;
  tipo: string;
  lat: number;
  lng: number;
}

export interface FlujoSemanal {
  dia: string;
  vehiculos: number;
  peatones: number;
}

// ── Demografía simulada de la zona ──────────────────────────────
export interface DemografiaZona {
  poblacionTotal: number;
  porGenero: { hombres: number; mujeres: number };
  porEdad: { rango: string; cantidad: number }[];
  ingresoPromedioMensual: number; // MXN
}

// ── Costo de renta estimado ─────────────────────────────────────
export interface RentData {
  min: number;
  max: number;
  promedio: number;
  nivel: "Alta" | "Media-Alta" | "Media" | "Baja";
  zonaComercial: string;
  descripcion: string;
}

export interface AnalysisData {
  lat: number;
  lng: number;
  radio: number;
  puntuacion: number;
  totalNegocios: number;
  competidoresDirectos: number;
  nivelActividad: "Alto" | "Medio" | "Bajo";
  recomendacion: string;
  analisisNegocio: string;
  subcategoriaLabel: string;
  scian?: string;
  zona: ZonaMexicali;
  promedioPeatones: number;
  flujoVehicular: number;
  flujoSemanal: FlujoSemanal[];
  negocios: NegocioCercano[];
  distribucion: { nombre: string; cantidad: number }[];
  demografia: DemografiaZona;
  renta: RentData;
  desgloseScore: ScoreBreakdown;
  timestamp: number;
}

export interface ScoreBreakdown {
  flujo: number;        // 0-10
  competencia: number;  // 0-10 (mayor = mejor, menos competencia)
  densidad: number;     // 0-10
  accesibilidad: number;// 0-10
  explicacion: string;
}

// ── Presupuesto detallado para Dashboard ────────────────────────
export interface Presupuesto {
  total: { min: number; max: number };
  rubros: PresupuestoRubro[];
}

export interface PresupuestoRubro {
  concepto: "Local" | "Permisos" | "Equipamiento" | "Marketing" | "Inventario" | "Otros";
  monto: number;
  detalle: string;
}

// ── Estadísticas agregadas de Mexicali ──────────────────────────
export interface EstadisticasCiudad {
  scian: string;
  scianNombre: string;
  totalEnCiudad: number;
  porZona: { zona: ZonaMexicali; cantidad: number }[];
  topCompetidores: DenueNegocio[];
  saturacionPromedio: number; // 0-100
}
