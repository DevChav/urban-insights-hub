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

export interface AnalysisData {
  lat: number;
  lng: number;
  puntuacion: number;
  totalNegocios: number;
  competidoresDirectos: number;
  nivelActividad: "Alto" | "Medio" | "Bajo";
  recomendacion: string;
  analisisNegocio: string;
  subcategoriaLabel: string;
  promedioPeatones: number;
  flujoVehicular: number;
  flujoSemanal: FlujoSemanal[];
  negocios: NegocioCercano[];
  distribucion: { nombre: string; cantidad: number }[];
}
