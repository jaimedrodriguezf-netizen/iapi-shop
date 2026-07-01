import fs from "fs";
import crypto from "crypto";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Eliminar acentos
    .replace(/[^a-z0-9]+/g, "-") // Reemplazar caracteres no alfanuméricos con guiones
    .replace(/(^-|-$)+/g, ""); // Eliminar guiones al inicio o final
}

const taxonomy = [
  {
    name: "Electrónica y Tecnología",
    description: "Todo en dispositivos electrónicos, computación y gadgets",
    subcategories: [
      {
        name: "Celulares y Smartphones",
        description: "Equipos móviles y accesorios",
        subcategories: ["Smartphones", "Accesorios para Celulares", "Smartwatches"],
      },
      {
        name: "Computación",
        description: "Laptops, PCs y accesorios",
        subcategories: ["Laptops", "Componentes de PC", "Accesorios de Computación"],
      },
      {
        name: "Audio y Video",
        description: "Sonido y entretenimiento visual",
        subcategories: ["Auriculares", "Parlantes", "Televisores"],
      },
    ],
  },
  {
    name: "Hogar y Muebles",
    description: "Todo para amueblar y decorar tu casa",
    subcategories: [
      {
        name: "Muebles",
        description: "Muebles para salas, habitaciones y más",
        subcategories: ["Salas y Sofás", "Dormitorio", "Comedor"],
      },
      {
        name: "Electrodomésticos",
        description: "Línea blanca y electrodomésticos menores",
        subcategories: ["Refrigeración", "Lavado", "Pequeños Electrodomésticos"],
      },
      {
        name: "Decoración",
        description: "Artículos decorativos e iluminación",
        subcategories: ["Iluminación", "Alfombras", "Cuadros y Espejos"],
      },
    ],
  },
  {
    name: "Moda y Accesorios",
    description: "Ropa, calzado y complementos",
    subcategories: [
      {
        name: "Ropa de Hombre",
        description: "Vestimenta masculina casual y formal",
        subcategories: ["Camisetas y Polos", "Pantalones y Jeans", "Abrigos y Chaquetas"],
      },
      {
        name: "Ropa de Mujer",
        description: "Vestimenta femenina para toda ocasión",
        subcategories: ["Vestidos", "Blusas y Camisas", "Zapatos de Mujer"],
      },
      {
        name: "Accesorios",
        description: "Complementos de vestir",
        subcategories: ["Relojes", "Lentes de Sol", "Joyería"],
      },
    ],
  },
  {
    name: "Deportes y Aire Libre",
    description: "Artículos para entrenamiento y actividades exteriores",
    subcategories: [
      {
        name: "Fitness",
        description: "Entrenamiento y gimnasio",
        subcategories: ["Máquinas de Ejercicio", "Ropa Deportiva", "Suplementos"],
      },
      {
        name: "Deportes de Equipo",
        description: "Fútbol, baloncesto y más",
        subcategories: ["Fútbol", "Baloncesto", "Voleibol"],
      },
      {
        name: "Camping y Pesca",
        description: "Equipamiento para exteriores",
        subcategories: ["Tiendas de Campaña", "Mochilas", "Accesorios de Camping"],
      },
    ],
  },
  {
    name: "Salud y Belleza",
    description: "Cuidado personal, maquillaje y bienestar",
    subcategories: [
      {
        name: "Cuidado Personal",
        description: "Productos para higiene y cuidado de la piel",
        subcategories: ["Cuidado de la Piel", "Cuidado del Cabello", "Perfumes"],
      },
      {
        name: "Maquillaje",
        description: "Cosméticos",
        subcategories: ["Rostro", "Ojos", "Labios"],
      },
      {
        name: "Bienestar",
        description: "Salud general",
        subcategories: ["Vitaminas", "Masajeadores", "Cuidado Dental"],
      },
    ],
  },
];

let sql = `-- Seed file para popular las categorías globales
-- Generado automáticamente

`;

for (const [indexL1, l1] of taxonomy.entries()) {
  const l1Id = crypto.randomUUID();
  const l1Slug = generateSlug(l1.name);
  sql += `INSERT INTO public.categories (id, name, slug, description) VALUES ('${l1Id}', '${l1.name}', '${l1Slug}', '${l1.description}');\n`;

  for (const [indexL2, l2] of l1.subcategories.entries()) {
    const l2Id = crypto.randomUUID();
    const l2Slug = generateSlug(`${l1.name}-${l2.name}`);
    sql += `INSERT INTO public.categories (id, name, slug, description, parent_id) VALUES ('${l2Id}', '${l2.name}', '${l2Slug}', '${l2.description}', '${l1Id}');\n`;

    for (const [indexL3, l3Name] of l2.subcategories.entries()) {
      const l3Id = crypto.randomUUID();
      const l3Slug = generateSlug(`${l2.name}-${l3Name}`);
      sql += `INSERT INTO public.categories (id, name, slug, description, parent_id) VALUES ('${l3Id}', '${l3Name}', '${l3Slug}', 'Subcategoría de ${l2.name}', '${l2Id}');\n`;
    }
  }
}

fs.writeFileSync("supabase/migrations/20260701000001_seed_categories.sql", sql);
console.log("Archivo SQL generado: supabase/migrations/20260701000001_seed_categories.sql");
