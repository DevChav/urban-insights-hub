/**
 * Real data integration via OpenStreetMap Overpass API.
 * Fetches actual POIs (points of interest) within a radius of a given coordinate.
 */



const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

export interface OverpassNode {
  id: number;
  lat: number;
  lon: number;
  tags: Record<string, string>;
}

interface OverpassResponse {
  elements: OverpassNode[];
}

/**
 * Build an Overpass QL query to fetch amenities/shops within `radius` metres of (lat, lng).
 */
function buildQuery(lat: number, lng: number, radius = 500): string {
  return `
[out:json][timeout:15];
(
  node["amenity"](around:${radius},${lat},${lng});
  node["shop"](around:${radius},${lat},${lng});
  node["leisure"](around:${radius},${lat},${lng});
  node["healthcare"](around:${radius},${lat},${lng});
);
out body;
`;
}

export async function fetchNearbyPOIs(lat: number, lng: number, radius = 500): Promise<OverpassNode[]> {
  const query = buildQuery(lat, lng, radius);
  const res = await fetch(OVERPASS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!res.ok) {
    console.error("Overpass API error", res.status);
    return [];
  }

  const data: OverpassResponse = await res.json();
  return data.elements;
}

// ── Categorisation helpers ────────────────────────────────────────
type Categoria = "Restaurante" | "Tienda" | "Farmacia" | "Banco" | "Cafetería" | "Gimnasio" | "Barbería" | "Otro";

const AMENITY_MAP: Record<string, Categoria> = {
  restaurant: "Restaurante",
  fast_food: "Restaurante",
  food_court: "Restaurante",
  cafe: "Cafetería",
  pharmacy: "Farmacia",
  bank: "Banco",
  atm: "Banco",
  bar: "Restaurante",
  pub: "Restaurante",
};

const SHOP_MAP: Record<string, Categoria> = {
  supermarket: "Tienda",
  convenience: "Tienda",
  clothes: "Tienda",
  department_store: "Tienda",
  hairdresser: "Barbería",
  beauty: "Barbería",
  chemist: "Farmacia",
  bakery: "Restaurante",
  butcher: "Tienda",
  electronics: "Tienda",
  hardware: "Tienda",
  mobile_phone: "Tienda",
  shoes: "Tienda",
  variety_store: "Tienda",
};

const LEISURE_MAP: Record<string, Categoria> = {
  fitness_centre: "Gimnasio",
  gym: "Gimnasio",
  sports_centre: "Gimnasio",
};

export function categoriseNode(node: OverpassNode): Categoria {
  const amenity = node.tags?.amenity;
  const shop = node.tags?.shop;
  const leisure = node.tags?.leisure;
  const healthcare = node.tags?.healthcare;

  if (amenity && AMENITY_MAP[amenity]) return AMENITY_MAP[amenity];
  if (shop && SHOP_MAP[shop]) return SHOP_MAP[shop];
  if (leisure && LEISURE_MAP[leisure]) return LEISURE_MAP[leisure];
  if (healthcare === "pharmacy") return "Farmacia";
  if (shop) return "Tienda";
  if (amenity) return "Otro";
  return "Otro";
}

export function getNodeName(node: OverpassNode): string {
  return node.tags?.name || node.tags?.["name:es"] || node.tags?.brand || getCategoryLabel(categoriseNode(node));
}

function getCategoryLabel(cat: Categoria): string {
  return cat === "Otro" ? "Comercio" : cat;
}

// Competition category is now handled by businessCategories.ts
