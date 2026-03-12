/**
 * INEGI DENUE API integration.
 * Fetches real business data from Mexico's national business directory.
 * API docs: https://www.inegi.org.mx/servicios/api_denue.html
 *
 * NOTE: The DENUE API requires a free token from INEGI.
 * Register at: https://www.inegi.org.mx/app/api/denue/v1/tokenVerify.aspx
 */

// Default demo token — replace with your own from INEGI registration
const INEGI_TOKEN = "b77aebef-b797-4e47-93a6-4489ab498a11";

const DENUE_BASE = "https://www.inegi.org.mx/app/api/denue/v1/consulta";

export interface DenueEstablishment {
  id: string;
  Nombre: string;
  Razon_social: string;
  Clase_actividad: string;
  Estrato: string;
  Tipo_vialidad: string;
  Calle: string;
  Num_Exterior: string;
  Num_Interior: string;
  Colonia: string;
  CP: string;
  Localidad: string;
  Municipio: string;
  Entidad: string;
  Telefono: string;
  Correo_e: string;
  Sitio_internet: string;
  Tipo: string;
  Longitud: string;
  Latitud: string;
  CentroComercial: string;
  TipoCentroComercial: string;
  NumLocal: string;
}

/**
 * Search DENUE for businesses near a coordinate.
 * @param lat Latitude
 * @param lng Longitude
 * @param radius Radius in meters (max 5000)
 * @param keyword Search keyword ("todos" for all)
 */
export async function fetchDenueBusinesses(
  lat: number,
  lng: number,
  radius: number = 500,
  keyword: string = "todos"
): Promise<DenueEstablishment[]> {
  const url = `${DENUE_BASE}/Buscar/${encodeURIComponent(keyword)}/${lat},${lng}/${Math.min(radius, 5000)}/${INEGI_TOKEN}`;

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`DENUE API error: ${res.status}`);
  }

  const data = await res.json();

  // DENUE returns an array of establishments or an error object
  if (!Array.isArray(data)) {
    throw new Error("DENUE returned unexpected format");
  }

  return data;
}

// ── Category mapping from DENUE activity classes ──────────────────

type Categoria = "Restaurante" | "Tienda" | "Farmacia" | "Banco" | "Cafetería" | "Gimnasio" | "Barbería" | "Otro";

const ACTIVITY_KEYWORDS: Array<{ keywords: string[]; category: Categoria }> = [
  { keywords: ["restaurante", "alimento", "comida", "taco", "torta", "pizza", "hamburguesa", "sushi", "mariscos", "antojitos", "cocina"], category: "Restaurante" },
  { keywords: ["café", "cafetería", "coffee", "bebida"], category: "Cafetería" },
  { keywords: ["farmacia", "botica", "medicamento", "pharmaceutical"], category: "Farmacia" },
  { keywords: ["banco", "financier", "crédito", "bancari"], category: "Banco" },
  { keywords: ["gimnasio", "gym", "fitness", "deport", "ejercicio"], category: "Gimnasio" },
  { keywords: ["estética", "barbería", "peluquería", "salón de belleza", "corte de cabello", "barber"], category: "Barbería" },
  { keywords: ["tienda", "abarrot", "comercio", "minisuper", "supermercado", "ropa", "calzado", "zapato", "boutique", "papelería", "ferretería", "mueble", "electrónic"], category: "Tienda" },
];

export function categoriseDenue(est: DenueEstablishment): Categoria {
  const activity = (est.Clase_actividad || "").toLowerCase();
  const name = (est.Nombre || "").toLowerCase();
  const combined = `${activity} ${name}`;

  for (const { keywords, category } of ACTIVITY_KEYWORDS) {
    if (keywords.some((kw) => combined.includes(kw))) {
      return category;
    }
  }
  return "Otro";
}

export function getDenueName(est: DenueEstablishment): string {
  return est.Nombre || est.Razon_social || "Comercio";
}
