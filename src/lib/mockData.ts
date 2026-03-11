export interface NegocioCercano {
  nombre: string;
  tipo: string;
  lat: number;
  lng: number;
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

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function offsetCoord(base: number, meters: number): number {
  return base + (Math.random() - 0.5) * (meters / 111320) * 2;
}

export function generateMockData(lat: number, lng: number): AnalysisData {
  const restaurantes = rand(3, 8);
  const tiendas = rand(2, 6);
  const farmacias = rand(1, 4);
  const bancos = rand(1, 3);
  const totalNegocios = restaurantes + tiendas + farmacias + bancos;
  const puntuacion = Math.min(10, Math.max(1, rand(5, 10)));
  const nivelActividad = puntuacion >= 8 ? "Alto" : puntuacion >= 5 ? "Medio" : "Bajo";

  const negocios: NegocioCercano[] = [];
  const addNegocios = (tipo: string, count: number) => {
    const nombres = NOMBRES_NEGOCIOS[tipo] || [];
    for (let i = 0; i < count; i++) {
      negocios.push({
        nombre: nombres[i % nombres.length],
        tipo,
        lat: offsetCoord(lat, 450),
        lng: offsetCoord(lng, 450),
      });
    }
  };
  addNegocios("Restaurante", Math.min(restaurantes, 4));
  addNegocios("Tienda", Math.min(tiendas, 3));
  addNegocios("Farmacia", Math.min(farmacias, 2));
  addNegocios("Banco", Math.min(bancos, 2));

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
    negocios,
    distribucion: [
      { nombre: "Restaurantes", cantidad: restaurantes },
      { nombre: "Tiendas", cantidad: tiendas },
      { nombre: "Farmacias", cantidad: farmacias },
      { nombre: "Bancos", cantidad: bancos },
    ],
  };
}
