/**
 * Builds an AnalysisData object using simulated (mock) data.
 * Generates realistic random businesses based on the selected subcategory and radius.
 */

import type { AnalysisData } from "./mockData";
import { SECTORES } from "./businessCategories";

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min: number, max: number) {
  return min + Math.random() * (max - min);
}

// ── Simple in-memory cache ────────────────────────────────────────
interface CacheEntry {
  data: AnalysisData;
  ts: number;
}
const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000;

function cacheKey(lat: number, lng: number, subcatId: string, radius: number) {
  return `${lat.toFixed(4)},${lng.toFixed(4)},${subcatId},${radius}`;
}

// ── Mock business name pools ──────────────────────────────────────
const MEXICALI_COLONIAS = [
  "Centro", "Nueva", "Río Nuevo", "Pro-Hogar", "Pueblo Nuevo", "Industrial",
  "Xochimilco", "González Ortega", "Ex-Ejido Coahuila", "Alamitos", "Calafia",
  "Los Pinos", "Baja California", "Orizaba", "Independencia", "El Dorado",
];

const NAME_PREFIXES: Record<string, string[]> = {
  "Restaurantes": ["La Cocina de", "El Rincón de", "Sabor", "Don", "Casa", "Taquería El", "Mariscos El"],
  "Cafeterías": ["Café", "Coffee Lab", "Aroma", "El Grano de", "Brew", "La Taza de"],
  "Postres y snacks": ["Dulce", "Nieves", "Helados", "La Paleta de", "Churros"],
  "Bares y vida nocturna": ["Bar", "La Cantina", "Pub", "Lounge", "Club"],
  "Ropa": ["Boutique", "Fashion", "Style", "Urban", "Moda"],
  "Tecnología": ["TechZone", "Digital", "CompuMax", "GameStore", "CelularFix"],
  "Tiendas especializadas": ["El Rincón del", "Colección", "Mundo", "La Tienda de"],
  "Belleza": ["Estética", "Barbería", "Salón", "Studio", "Beauty"],
  "Salud": ["Consultorio", "Clínica", "Farmacia", "Lab", "Dr."],
  "Fitness": ["Gym", "CrossFit", "Yoga Studio", "FitLife", "Power"],
  "Entretenimiento": ["Fun", "Play", "Zona", "Arena", "Game"],
  "Servicios automotrices": ["AutoService", "Taller", "Car Wash", "LlantaPro", "DetailMaster"],
  "Negocios fronterizos": ["Express", "Cambio", "Envíos", "Import", "Border"],
  "Servicios tecnológicos": ["DevLab", "TechSupport", "IT Solutions", "CyberSec", "AutoMex"],
  "Educación": ["Academia", "Escuela", "Instituto", "Learning", "Tutoring"],
};

const NAME_SUFFIXES = [
  "Mexicali", "Cachanilla", "del Valle", "Express", "Premium",
  "Plus", "Central", "del Norte", "Pro", "MXL",
];

const BROAD_CATEGORIES = [
  "Restaurantes", "Cafeterías", "Farmacias", "Comercios",
  "Fitness", "Belleza", "Educación", "Automotriz", "Servicios", "Otros",
];

function generateBusinessName(categoryName: string): string {
  const prefixes = NAME_PREFIXES[categoryName] || NAME_PREFIXES["Restaurantes"];
  const prefix = prefixes[rand(0, prefixes.length - 1)];
  const suffix = NAME_SUFFIXES[rand(0, NAME_SUFFIXES.length - 1)];
  return `${prefix} ${suffix}`;
}

function randomPointInRadius(lat: number, lng: number, radiusM: number): { lat: number; lng: number } {
  const r = radiusM / 111320;
  const angle = Math.random() * 2 * Math.PI;
  const dist = Math.sqrt(Math.random()) * r;
  return {
    lat: lat + dist * Math.cos(angle),
    lng: lng + dist * Math.sin(angle) / Math.cos(lat * Math.PI / 180),
  };
}

function getCategoryNameForSubcat(subcatId: string): string {
  for (const sector of SECTORES) {
    for (const cat of sector.categorias) {
      if (cat.subcategorias.some(s => s.id === subcatId)) {
        return cat.nombre;
      }
    }
  }
  return "Otros";
}

// ── Main analysis function ────────────────────────────────────────
export async function analyzeZone(
  lat: number,
  lng: number,
  subcatId: string,
  radius: number = 500,
  _signal?: AbortSignal
) {

  if (!subcatId) {
    return {
      lat,
      lng,
      puntuacion: 0,
      totalNegocios: 0,
      competidoresDirectos: 0,
      nivelActividad: "Bajo",
      recomendacion: "Selecciona una subcategoría",
      analisisNegocio: "",
      subcategoriaLabel: "",
      promedioPeatones: 0,
      flujoVehicular: 0,
      flujoSemanal: [],
      negocios: [],
      distribucion: []
    };
  }

  const res = await fetch("http://localhost:3001/analizar", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ lat, lng, subcatId, radius })
  });

  const data = await res.json();

  return data;
}
