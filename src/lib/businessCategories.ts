/** Hierarchical business categories for Mexicali */

export interface Subcategoria {
  id: string;
  nombre: string;
  keywords: string[]; // for DENUE/Overpass matching
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
        nombre: "Restaurantes",
        subcategorias: [
          { id: "mexicano", nombre: "Mexicano tradicional", keywords: ["mexicano", "antojitos", "comida mexicana", "mole", "pozole"] },
          { id: "taqueria", nombre: "Taquería", keywords: ["taco", "taquería", "tacos", "taqueria"] },
          { id: "chino", nombre: "Restaurante chino", keywords: ["chino", "china", "chinese", "wok", "cantonés"] },
          { id: "japones", nombre: "Restaurante japonés / sushi", keywords: ["japonés", "sushi", "ramen", "japanese", "teriyaki"] },
          { id: "coreano", nombre: "Restaurante coreano", keywords: ["coreano", "korean", "kimchi", "bbq coreano"] },
          { id: "mariscos", nombre: "Mariscos", keywords: ["mariscos", "pescado", "ceviche", "camarón", "seafood"] },
          { id: "vegano", nombre: "Vegano / saludable", keywords: ["vegano", "vegetariano", "saludable", "vegan", "orgánico", "ensalada"] },
          { id: "familiar", nombre: "Restaurante familiar", keywords: ["familiar", "buffet", "family", "cocina económica", "comida corrida"] },
          { id: "gourmet", nombre: "Restaurante gourmet", keywords: ["gourmet", "fine dining", "autor", "premium"] },
          { id: "foodtruck", nombre: "Food truck", keywords: ["food truck", "carreta", "puesto", "ambulante"] },
        ],
      },
      {
        id: "cafeterias",
        nombre: "Cafeterías",
        subcategorias: [
          { id: "cafe-trad", nombre: "Cafetería tradicional", keywords: ["café", "cafetería", "coffee"] },
          { id: "cafe-hipster", nombre: "Cafetería hipster / especialidad", keywords: ["especialidad", "specialty", "artesanal", "third wave"] },
          { id: "cafe-cowork", nombre: "Cafetería coworking", keywords: ["coworking", "cowork", "workspace"] },
          { id: "cafe-tematica", nombre: "Cafetería temática", keywords: ["temática", "themed", "cat café", "board game"] },
          { id: "cafe-drive", nombre: "Cafetería drive-thru", keywords: ["drive", "auto", "drive-thru"] },
          { id: "cafe-reposteria", nombre: "Cafetería con repostería artesanal", keywords: ["repostería", "pastel", "panadería", "bakery", "pan"] },
        ],
      },
      {
        id: "postres",
        nombre: "Postres y snacks",
        subcategorias: [
          { id: "neveria", nombre: "Nevería / paletería", keywords: ["nieve", "nevería", "paleta", "paletería", "helado"] },
          { id: "heladeria", nombre: "Heladería artesanal", keywords: ["helado", "heladería", "ice cream", "gelato"] },
          { id: "donas", nombre: "Donas gourmet", keywords: ["dona", "donut", "doughnut"] },
          { id: "churros", nombre: "Churros", keywords: ["churro", "churros", "churrería"] },
          { id: "reposteria", nombre: "Repostería fina", keywords: ["repostería", "pastelería", "cupcake", "pastel", "cake"] },
          { id: "snacks", nombre: "Snacks mexicanos", keywords: ["snack", "botana", "elote", "esquite", "chicharrón", "dulce"] },
        ],
      },
      {
        id: "bares",
        nombre: "Bares y vida nocturna",
        subcategorias: [
          { id: "bar-deportivo", nombre: "Bar deportivo", keywords: ["sports bar", "bar deportivo", "pantalla"] },
          { id: "cerveza-artesanal", nombre: "Bar de cerveza artesanal", keywords: ["cerveza artesanal", "craft beer", "brewery", "cervecería"] },
          { id: "bar-lounge", nombre: "Bar lounge", keywords: ["lounge", "cocktail", "cóctel", "mixología"] },
          { id: "antro", nombre: "Antro / club nocturno", keywords: ["antro", "club", "discoteca", "nightclub", "disco"] },
          { id: "cantina", nombre: "Cantina tradicional", keywords: ["cantina", "pulquería", "mezcalería"] },
          { id: "karaoke", nombre: "Karaoke bar", keywords: ["karaoke"] },
        ],
      },
    ],
  },
  {
    id: "comercio",
    nombre: "Sector Comercio minorista",
    categorias: [
      {
        id: "ropa",
        nombre: "Ropa",
        subcategorias: [
          { id: "boutique", nombre: "Boutique", keywords: ["boutique", "ropa", "moda", "fashion"] },
          { id: "streetwear", nombre: "Ropa urbana / streetwear", keywords: ["streetwear", "urbana", "urban", "sneaker"] },
          { id: "thrift", nombre: "Thrift shop", keywords: ["thrift", "segunda mano", "ropa usada", "vintage"] },
          { id: "deportiva", nombre: "Ropa deportiva", keywords: ["deportiva", "sport", "athletic", "gym wear"] },
          { id: "infantil", nombre: "Ropa infantil", keywords: ["infantil", "niño", "bebé", "children", "kids"] },
        ],
      },
      {
        id: "tecnologia",
        nombre: "Tecnología",
        subcategorias: [
          { id: "electronicos", nombre: "Electrónicos", keywords: ["electrónic", "electronic", "gadget"] },
          { id: "videojuegos", nombre: "Videojuegos", keywords: ["videojuego", "video game", "gaming", "consola", "playstation", "xbox"] },
          { id: "celulares", nombre: "Celulares y accesorios", keywords: ["celular", "móvil", "phone", "smartphone", "accesorio"] },
          { id: "computacion", nombre: "Computación", keywords: ["computadora", "laptop", "pc", "cómputo", "computer"] },
          { id: "gamer", nombre: "Tienda gamer", keywords: ["gamer", "gaming", "esports", "stream"] },
        ],
      },
      {
        id: "especializadas",
        nombre: "Tiendas especializadas",
        subcategorias: [
          { id: "libreria", nombre: "Librería", keywords: ["librería", "libro", "book", "lectura"] },
          { id: "comics", nombre: "Tienda de cómics", keywords: ["cómic", "comic", "historieta"] },
          { id: "anime", nombre: "Anime / manga", keywords: ["anime", "manga", "otaku", "japonés"] },
          { id: "coleccionables", nombre: "Coleccionables", keywords: ["coleccionable", "collectible", "figurin", "funko"] },
        ],
      },
    ],
  },
  {
    id: "servicios-personales",
    nombre: "Sector Servicios personales",
    categorias: [
      {
        id: "belleza",
        nombre: "Belleza",
        subcategorias: [
          { id: "barberia-moderna", nombre: "Barbería moderna", keywords: ["barbería", "barber", "fade", "corte"] },
          { id: "barberia-clasica", nombre: "Barbería clásica", keywords: ["barbería", "barber", "clásic"] },
          { id: "estetica-unisex", nombre: "Estética unisex", keywords: ["estética", "salón", "peluquería", "unisex", "hair"] },
          { id: "salon-unas", nombre: "Salón de uñas", keywords: ["uñas", "nail", "manicur", "pedicur"] },
          { id: "spa", nombre: "Spa", keywords: ["spa", "masaje", "massage", "relajación"] },
          { id: "clinica-estetica", nombre: "Clínica estética", keywords: ["clínica estética", "botox", "dermatolog", "facial"] },
        ],
      },
      {
        id: "salud",
        nombre: "Salud",
        subcategorias: [
          { id: "consultorio-medico", nombre: "Consultorio médico", keywords: ["consultorio", "médico", "doctor", "clínica", "medicina"] },
          { id: "consultorio-dental", nombre: "Consultorio dental", keywords: ["dental", "dentist", "odontolog"] },
          { id: "laboratorio", nombre: "Laboratorio clínico", keywords: ["laboratorio", "análisis", "clinical lab"] },
          { id: "farmacia", nombre: "Farmacia", keywords: ["farmacia", "pharmacy", "medicamento"] },
          { id: "farmacia-consultorio", nombre: "Farmacia con consultorio", keywords: ["farmacia", "similares", "consultorio", "genéric"] },
        ],
      },
      {
        id: "fitness",
        nombre: "Fitness",
        subcategorias: [
          { id: "gimnasio", nombre: "Gimnasio", keywords: ["gimnasio", "gym", "fitness"] },
          { id: "crossfit", nombre: "Crossfit", keywords: ["crossfit", "functional", "box"] },
          { id: "yoga", nombre: "Yoga", keywords: ["yoga", "meditación", "mindfulness"] },
          { id: "pilates", nombre: "Pilates", keywords: ["pilates", "reformer"] },
          { id: "box-fitness", nombre: "Box fitness", keywords: ["boxeo", "box", "kickbox", "mma"] },
          { id: "entrenamiento-personal", nombre: "Entrenamiento personal", keywords: ["personal trainer", "entrenamiento personal", "coaching"] },
        ],
      },
    ],
  },
  {
    id: "entretenimiento",
    nombre: "Sector Entretenimiento",
    categorias: [
      {
        id: "entretenimiento-general",
        nombre: "Entretenimiento",
        subcategorias: [
          { id: "arcade", nombre: "Arcade", keywords: ["arcade", "maquinita", "videojuego"] },
          { id: "boliche", nombre: "Boliche", keywords: ["boliche", "bowling"] },
          { id: "escape-room", nombre: "Escape room", keywords: ["escape room", "escape"] },
          { id: "mini-golf", nombre: "Mini golf", keywords: ["mini golf", "minigolf", "golf"] },
          { id: "cine", nombre: "Cine independiente", keywords: ["cine", "cinema", "película", "film"] },
          { id: "vr", nombre: "Realidad virtual", keywords: ["realidad virtual", "vr", "virtual reality"] },
          { id: "billar", nombre: "Billar", keywords: ["billar", "pool", "snooker"] },
          { id: "bar-videojuegos", nombre: "Bar con videojuegos", keywords: ["bar gamer", "gaming bar", "videojuego"] },
        ],
      },
    ],
  },
  {
    id: "automotriz",
    nombre: "Sector Servicios automotrices",
    categorias: [
      {
        id: "automotriz-general",
        nombre: "Servicios automotrices",
        subcategorias: [
          { id: "autolavado", nombre: "Autolavado", keywords: ["autolavado", "car wash", "lavado de auto"] },
          { id: "detailing", nombre: "Autolavado premium / detailing", keywords: ["detailing", "premium", "pulido", "encerado"] },
          { id: "taller-mecanico", nombre: "Taller mecánico", keywords: ["taller", "mecánico", "reparación", "mechanic"] },
          { id: "taller-electrico", nombre: "Taller eléctrico automotriz", keywords: ["eléctrico", "electromecánic", "alternador"] },
          { id: "autopartes", nombre: "Venta de autopartes", keywords: ["autopart", "refaccion", "repuesto", "auto part"] },
          { id: "llantera", nombre: "Llantera", keywords: ["llanta", "tire", "neumático", "llantera"] },
          { id: "polarizado", nombre: "Polarizado de vidrios", keywords: ["polarizado", "tint", "vidrio", "película"] },
        ],
      },
    ],
  },
  {
    id: "fronterizo",
    nombre: "Sector Negocios fronterizos",
    categorias: [
      {
        id: "fronterizo-general",
        nombre: "Negocios fronterizos",
        subcategorias: [
          { id: "casa-cambio", nombre: "Casa de cambio", keywords: ["casa de cambio", "cambio", "exchange", "divisa"] },
          { id: "importacion", nombre: "Importación de productos", keywords: ["importa", "import", "aduana"] },
          { id: "paqueteria", nombre: "Paquetería internacional", keywords: ["paquetería", "envío", "courier", "shipping"] },
          { id: "envios-usa", nombre: "Envíos a Estados Unidos", keywords: ["envío", "usa", "estados unidos", "cross-border"] },
          { id: "productos-americanos", nombre: "Tienda de productos americanos", keywords: ["american", "americano", "import", "usa product"] },
        ],
      },
    ],
  },
  {
    id: "tecnologicos",
    nombre: "Sector Servicios tecnológicos",
    categorias: [
      {
        id: "tech-general",
        nombre: "Servicios tecnológicos",
        subcategorias: [
          { id: "desarrollo-sw", nombre: "Desarrollo de software", keywords: ["software", "desarrollo", "programación", "developer"] },
          { id: "soporte-tecnico", nombre: "Soporte técnico", keywords: ["soporte", "reparación", "técnico", "support"] },
          { id: "consultoria-it", nombre: "Consultoría IT", keywords: ["consultoría", "it", "tecnología", "consulting"] },
          { id: "automatizacion", nombre: "Automatización industrial", keywords: ["automatización", "industrial", "plc", "robótic"] },
          { id: "ciberseguridad", nombre: "Ciberseguridad", keywords: ["ciberseguridad", "seguridad", "security", "cyber"] },
        ],
      },
    ],
  },
  {
    id: "educacion",
    nombre: "Sector Educación",
    categorias: [
      {
        id: "educacion-general",
        nombre: "Educación",
        subcategorias: [
          { id: "idiomas", nombre: "Academia de idiomas", keywords: ["idioma", "inglés", "language", "english", "francés"] },
          { id: "programacion", nombre: "Academia de programación", keywords: ["programación", "coding", "bootcamp", "code"] },
          { id: "musica", nombre: "Escuela de música", keywords: ["música", "music", "instrumento", "guitarra", "piano"] },
          { id: "arte", nombre: "Escuela de arte", keywords: ["arte", "art", "pintura", "dibujo", "escultura"] },
          { id: "tutorias", nombre: "Tutorías académicas", keywords: ["tutoría", "tutoring", "regularización", "asesoría", "clases"] },
        ],
      },
    ],
  },
];

// ── Flat lookup helpers ──────────────────────────────────────────

export interface SelectedBusiness {
  sectorId: string;
  categoriaId: string;
  subcategoriaId: string;
  /** Display name shown in UI */
  label: string;
  /** Keywords used for DENUE/Overpass matching */
  keywords: string[];
}

export function findSubcategoria(subcatId: string): SelectedBusiness | null {
  for (const sector of SECTORES) {
    for (const cat of sector.categorias) {
      const sub = cat.subcategorias.find((s) => s.id === subcatId);
      if (sub) {
        return {
          sectorId: sector.id,
          categoriaId: cat.id,
          subcategoriaId: sub.id,
          label: sub.nombre,
          keywords: sub.keywords,
        };
      }
    }
  }
  return null;
}

/** Get all keywords for matching competition in DENUE / Overpass */
export function getCompetitionKeywords(subcatId: string): string[] {
  const found = findSubcategoria(subcatId);
  return found ? found.keywords : [];
}

/** Build analysis texts based on subcategory */
export function getAnalisisTexts(subcatLabel: string, score: number): { analisis: string; recomendacion: string } {
  if (score >= 7) {
    const positivos = [
      `La zona muestra condiciones favorables para abrir un negocio de tipo "${subcatLabel}". El flujo peatonal y la actividad comercial cercana generan un entorno propicio para captar clientes.`,
      `Existen pocos competidores directos de "${subcatLabel}" en esta área, lo que representa una oportunidad de mercado significativa.`,
      `La combinación de tráfico peatonal constante y comercios complementarios hace de esta zona una ubicación estratégica para "${subcatLabel}".`,
      `El perfil comercial de la zona es compatible con "${subcatLabel}". Se recomienda aprovechar la demanda insatisfecha en el área.`,
    ];
    return {
      analisis: positivos[Math.floor(Math.random() * positivos.length)],
      recomendacion: "Zona con buena viabilidad. Se recomienda actuar pronto para aprovechar la oportunidad antes que la competencia.",
    };
  }
  if (score >= 4) {
    const medios = [
      `La zona tiene potencial moderado para "${subcatLabel}". Hay competencia existente, pero un concepto diferenciador podría destacar.`,
      `El flujo de personas es aceptable para "${subcatLabel}", aunque se recomienda analizar horarios pico y estrategias de atracción de clientes.`,
      `Existen algunos competidores de "${subcatLabel}" en la zona. Un enfoque de especialización o nicho podría marcar la diferencia.`,
    ];
    return {
      analisis: medios[Math.floor(Math.random() * medios.length)],
      recomendacion: "Zona con potencial moderado. Se sugiere diferenciarse y enfocarse en un nicho específico.",
    };
  }
  const negativos = [
    `La alta concentración de negocios similares a "${subcatLabel}" en esta zona representa un riesgo de saturación del mercado.`,
    `El flujo peatonal en esta zona es bajo para el tipo de negocio "${subcatLabel}". Se recomienda considerar ubicaciones alternativas.`,
    `Las condiciones comerciales de la zona no son ideales para "${subcatLabel}". La competencia es fuerte y el tráfico es limitado.`,
  ];
  return {
    analisis: negativos[Math.floor(Math.random() * negativos.length)],
    recomendacion: "Zona de alto riesgo. Se recomienda explorar otras ubicaciones con menor competencia.",
  };
}
