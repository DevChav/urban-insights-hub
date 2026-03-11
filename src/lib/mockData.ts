export const TIPOS_NEGOCIO = [
  "Restaurante",
  "Cafetería",
  "Tienda de ropa",
  "Farmacia",
  "Tienda de conveniencia",
  "Barbería",
  "Gimnasio",
] as const;

export type TipoNegocio = (typeof TIPOS_NEGOCIO)[number];

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
  restaurantes: number;
  tiendas: number;
  farmacias: number;
  bancos: number;
  nivelActividad: "Alto" | "Medio" | "Bajo";
  recomendacion: string;
  analisisNegocio: string;
  tipoSeleccionado: TipoNegocio;
  promedioPeatones: number;
  flujoVehicular: number;
  flujoSemanal: FlujoSemanal[];
  negocios: NegocioCercano[];
  distribucion: { nombre: string; cantidad: number }[];
}

const NOMBRES_NEGOCIOS: Record<string, string[]> = {
  Restaurante: ["Tacos El Patrón", "Mariscos La Costa", "Pollos Asados Don Luis", "Café Central", "Pizzería Roma", "Sushi Mexicali", "La Taquería del Norte"],
  Tienda: ["Abarrotes Lupita", "Mini Super 24h", "Papelería El Lápiz", "Ferretería Juárez", "Boutique Moda", "Electrónica MXL"],
  Farmacia: ["Farmacia Guadalajara", "Farmacias Similares", "Farmacia del Ahorro", "Benavides"],
  Banco: ["BBVA", "Banorte", "Banco Azteca", "HSBC", "Santander"],
};

const RECOMENDACIONES = [
  "Zona con buena actividad comercial y potencial para nuevos negocios.",
  "Área con alta densidad de comercios; ideal para servicios complementarios.",
  "Zona en desarrollo con oportunidades de crecimiento comercial.",
  "Excelente ubicación con tráfico peatonal constante.",
  "Área competitiva; se recomienda un concepto diferenciador.",
];

const ANALISIS_POR_TIPO: Record<TipoNegocio, { positivo: string[]; negativo: string[] }> = {
  Restaurante: {
    positivo: [
      "La zona presenta alto flujo peatonal y pocos restaurantes directos, lo que representa una oportunidad para captar clientes.",
      "Existen comercios complementarios (bancos, farmacias) que generan tráfico constante favorable para un restaurante.",
    ],
    negativo: [
      "La alta concentración de restaurantes en la zona indica competencia fuerte. Se recomienda un concepto diferenciador.",
      "El flujo peatonal es moderado, lo que podría limitar la afluencia de clientes en horarios no pico.",
    ],
  },
  Cafetería: {
    positivo: [
      "Zona con oficinas y comercios cercanos que generan demanda constante de café y alimentos ligeros.",
      "No se detectan cafeterías especializadas en el área, lo que representa un nicho disponible.",
    ],
    negativo: [
      "Existen varias tiendas de conveniencia que ofrecen café a bajo precio, lo que representa competencia indirecta.",
      "El flujo vehicular es alto pero el peatonal es bajo, lo que podría requerir estacionamiento propio.",
    ],
  },
  "Tienda de ropa": {
    positivo: [
      "La zona tiene alto tráfico peatonal y comercios de servicios pero pocas tiendas de ropa, ideal para este giro.",
      "Proximidad a bancos y farmacias genera flujo constante que beneficiaría una tienda de ropa.",
    ],
    negativo: [
      "Existen tiendas de ropa establecidas en la zona que podrían dificultar la captación de clientes nuevos.",
      "El perfil comercial de la zona es más orientado a servicios que a retail de moda.",
    ],
  },
  Farmacia: {
    positivo: [
      "La densidad poblacional de la zona es favorable y hay pocas farmacias, lo que indica demanda insatisfecha.",
      "Ubicación cercana a consultorios y clínicas que generarían clientes recurrentes para una farmacia.",
    ],
    negativo: [
      "Ya existen farmacias de cadena en la zona con precios competitivos difíciles de igualar.",
      "La zona está saturada de farmacias; se recomienda explorar áreas residenciales cercanas.",
    ],
  },
  "Tienda de conveniencia": {
    positivo: [
      "Zona residencial con poca oferta de tiendas de conveniencia y alto flujo peatonal nocturno.",
      "No hay tiendas 24 horas en un radio de 500m, lo que representa una oportunidad clara.",
    ],
    negativo: [
      "La presencia de tiendas de conveniencia de cadena reduce el margen de diferenciación.",
      "El costo de renta en la zona es elevado para el margen típico de una tienda de conveniencia.",
    ],
  },
  Barbería: {
    positivo: [
      "Zona con alto flujo masculino por cercanía a gimnasios y comercios, ideal para una barbería moderna.",
      "No se detectan barberías especializadas en la zona; hay demanda potencial insatisfecha.",
    ],
    negativo: [
      "Existen salones de belleza que ofrecen servicios similares, lo que genera competencia directa.",
      "El flujo peatonal es bajo en horarios de la mañana, lo que podría afectar las citas tempranas.",
    ],
  },
  Gimnasio: {
    positivo: [
      "Zona residencial y de oficinas sin gimnasios cercanos; ideal para captar membresías recurrentes.",
      "Alta densidad de comercios complementarios (tiendas de suplementos, ropa deportiva) genera sinergia.",
    ],
    negativo: [
      "Ya existe al menos un gimnasio establecido en la zona, lo que requeriría una propuesta diferente.",
      "El costo de renta por metro cuadrado en la zona es alto para la superficie que requiere un gimnasio.",
    ],
  },
};

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function offsetCoord(base: number, meters: number): number {
  return base + (Math.random() - 0.5) * (meters / 111320) * 2;
}

export function generateMockData(lat: number, lng: number, tipo: TipoNegocio): AnalysisData {
  const restaurantes = rand(3, 8);
  const tiendas = rand(2, 6);
  const farmacias = rand(1, 4);
  const bancos = rand(1, 3);
  const totalNegocios = restaurantes + tiendas + farmacias + bancos;
  const puntuacion = Math.min(10, Math.max(1, rand(5, 10)));
  const nivelActividad = puntuacion >= 8 ? "Alto" : puntuacion >= 5 ? "Medio" : "Bajo";

  const negocios: NegocioCercano[] = [];
  const addNegocios = (tipoN: string, count: number) => {
    const nombres = NOMBRES_NEGOCIOS[tipoN] || [];
    for (let i = 0; i < count; i++) {
      negocios.push({
        nombre: nombres[i % nombres.length],
        tipo: tipoN,
        lat: offsetCoord(lat, 450),
        lng: offsetCoord(lng, 450),
      });
    }
  };
  addNegocios("Restaurante", Math.min(restaurantes, 4));
  addNegocios("Tienda", Math.min(tiendas, 3));
  addNegocios("Farmacia", Math.min(farmacias, 2));
  addNegocios("Banco", Math.min(bancos, 2));

  const promedioPeatones = rand(800, 4500);
  const flujoVehicular = rand(1200, 8000);

  const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
  const flujoSemanal: FlujoSemanal[] = diasSemana.map((dia) => ({
    dia,
    vehiculos: rand(800, 9000),
    peatones: rand(500, 5000),
  }));

  // Pick analysis based on score
  const analisisPool = puntuacion >= 7 ? ANALISIS_POR_TIPO[tipo].positivo : ANALISIS_POR_TIPO[tipo].negativo;
  const analisisNegocio = pick(analisisPool);

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
    analisisNegocio,
    tipoSeleccionado: tipo,
    promedioPeatones,
    flujoVehicular,
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
