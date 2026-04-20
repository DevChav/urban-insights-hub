/** Hierarchical business categories for Mexicali - Updated with SCIAN codes */

export interface Subcategoria {
  id: string;
  scian?: string; // Nuevo campo para match exacto con DB
  nombre: string;
  keywords: string[]; 
}

export interface Categoria {
  id: string;
  nombre: string;
  subcategorias: Subcategoria[];
}

export interface Sector {
  id: string;
  nombre: string;
  categorias: Categoria[];
}

export const SECTORES: Sector[] = [
  {
    id: "alimentos",
    nombre: "Sector Alimentos y Bebidas",
    categorias: [
      {
        id: "restaurantes",
        nombre: "Restaurantes y Comida Preparada",
        subcategorias: [
          { id: "a-la-carta", scian: "722511", nombre: "Restaurantes a la carta / Comida corrida", keywords: ["carta", "comida corrida", "menú"] },
          { id: "taqueria", scian: "722514", nombre: "Tacos y Tortas", keywords: ["tacos", "tortas", "taquería"] },
          { id: "antojitos", scian: "722513", nombre: "Antojitos Mexicanos", keywords: ["antojitos", "garnachas", "cenaduría"] },
          { id: "fast-food", scian: "722517", nombre: "Pizzas, Hamburguesas y Pollos", keywords: ["pizza", "hamburguesa", "hot dog", "pollo rostizado"] },
          { id: "cafeterias-snack", scian: "722515", nombre: "Cafeterías y Fuentes de Sodas", keywords: ["café", "nieve", "refresquería", "snack"] },
        ],
      },
    ],
  },
  {
    id: "comercio",
    nombre: "Sector Comercio Minorista",
    categorias: [
      {
        id: "abarrotes-retail",
        nombre: "Abarrotes y Alimentos",
        subcategorias: [
          { id: "tienda-abarrotes", scian: "461110", nombre: "Tiendas de Abarrotes y Misceláneas", keywords: ["tiendita", "abarrotes", "miscelánea"] },
          { id: "minisuper", scian: "462112", nombre: "Minisupers", keywords: ["minisuper", "oxxo", "7-eleven"] },
          { id: "cerveceria", scian: "461212", nombre: "Depósitos de Cerveza", keywords: ["cerveza", "six", "expendio"] },
        ],
      },
      {
        id: "articulos-diversos",
        nombre: "Artículos para el Hogar y Personales",
        subcategorias: [
          { id: "ropa-retail", scian: "463211", nombre: "Tiendas de Ropa", keywords: ["ropa", "boutique", "vestir"] },
          { id: "articulos-usados", scian: "466410", nombre: "Artículos Usados / Bazares", keywords: ["segunda", "usado", "bazar", "thrift"] },
          { id: "papeleria", scian: "465311", nombre: "Papelerías", keywords: ["papelería", "útiles", "copias"] },
          { id: "ferreteria", scian: "467111", nombre: "Ferreterías y Tlapalerías", keywords: ["ferretería", "herramientas", "tlapalería"] },
        ],
      },
    ],
  },
  {
    id: "servicios-personales",
    nombre: "Sector Servicios",
    categorias: [
      {
        id: "salud-privada",
        nombre: "Salud y Bienestar",
        subcategorias: [
          { id: "clinica-belleza", scian: "812110", nombre: "Salones y Clínicas de Belleza", keywords: ["estética", "peluquería", "barbería"] },
          { id: "consultorio-dental", scian: "621211", nombre: "Consultorios Dentales", keywords: ["dentista", "dental", "odontólogo"] },
          { id: "medico-especialista", scian: "621113", nombre: "Médicos Especialistas", keywords: ["especialista", "doctor", "clínica"] },
          { id: "farmacia-simple", scian: "464111", nombre: "Farmacias (sin minisúper)", keywords: ["farmacia", "medicamentos"] },
        ],
      },
      {
        id: "automotriz-serv",
        nombre: "Servicios Automotrices",
        subcategorias: [
          { id: "mecanica-gral", scian: "811111", nombre: "Reparación Mecánica General", keywords: ["taller", "mecánico", "motor"] },
          { id: "hojalateria-pintura", scian: "811121", nombre: "Hojalatería y Pintura", keywords: ["pintura", "choque", "carrocería"] },
        ],
      },
    ],
  },
  {
    id: "otros-sectores",
    nombre: "Otros Sectores",
    categorias: [
      {
        id: "financiero-social",
        nombre: "Finanzas y Sociedad",
        subcategorias: [
          { id: "banca-multiple", scian: "522110", nombre: "Banca Múltiple / Bancos", keywords: ["banco", "cajero", "financiera"] },
          { id: "org-religiosas", scian: "813210", nombre: "Organizaciones Religiosas", keywords: ["iglesia", "templo", "parroquia"] },
        ],
      },
    ],
  },
];
