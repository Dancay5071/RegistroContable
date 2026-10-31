// src/utils/categories.js
/**
 * Catálogo centralizado de categorías con iconos de Bootstrap Icons y colores pastel.
 */

export const CATEGORIAS_GASTO = [
  { id: "Supermercado", nombre: "Supermercado", icon: "bi-cart3", color: "#166534", bg: "#e2f2e5", border: "#b3dfbb" },
  { id: "Vivienda", nombre: "Vivienda & Alquiler", icon: "bi-house-door", color: "#1e40af", bg: "#ddeaf6", border: "#b8d3ee" },
  { id: "Servicios", nombre: "Servicios & Impuestos", icon: "bi-lightning-charge", color: "#854d0e", bg: "#fef0cd", border: "#fae09c" },
  { id: "Transporte", nombre: "Transporte & Auto", icon: "bi-car-front", color: "#334155", bg: "#e2e8f0", border: "#cbd5e1" },
  { id: "Salud", nombre: "Salud & Farmacia", icon: "bi-heart-pulse", color: "#991b1b", bg: "#fbe5e3", border: "#f4b8b3" },
  { id: "Comida", nombre: "Restaurantes & Salidas", icon: "bi-cup-hot", color: "#c2410c", bg: "#ffedd5", border: "#fed7aa" },
  { id: "Ocio", nombre: "Ocio & Entretenimiento", icon: "bi-film", color: "#6b21a8", bg: "#f3e8ff", border: "#e9d5ff" },
  { id: "Compras", nombre: "Ropa & Tiendas", icon: "bi-bag-check", color: "#9d174d", bg: "#fce7f3", border: "#fbcfe8" },
  { id: "Educacion", nombre: "Educación & Cursos", icon: "bi-book", color: "#0f766e", bg: "#ccfbf1", border: "#99f6e4" },
  { id: "Otros", nombre: "Otros Gastos", icon: "bi-tags", color: "#475569", bg: "#f1f5f9", border: "#cbd5e1" }
];

export const CATEGORIAS_INGRESO = [
  { id: "Sueldo", nombre: "Sueldo / Salario", icon: "bi-briefcase", color: "#166534", bg: "#e2f2e5", border: "#b3dfbb" },
  { id: "Freelance", nombre: "Trabajo Freelance", icon: "bi-laptop", color: "#1e40af", bg: "#ddeaf6", border: "#b8d3ee" },
  { id: "Ventas", nombre: "Ventas / Comercio", icon: "bi-shop", color: "#c2410c", bg: "#ffedd5", border: "#fed7aa" },
  { id: "Inversiones", nombre: "Inversiones / Rendimientos", icon: "bi-graph-up-arrow", color: "#0f766e", bg: "#ccfbf1", border: "#99f6e4" },
  { id: "Regalo", nombre: "Regalo / Extra", icon: "bi-gift", color: "#6b21a8", bg: "#f3e8ff", border: "#e9d5ff" },
  { id: "Otros", nombre: "Otros Ingresos", icon: "bi-cash-coin", color: "#475569", bg: "#f1f5f9", border: "#cbd5e1" }
];

export const CATEGORIAS_AHORRO = [
  { id: "Emergencia", nombre: "Fondo de Emergencia", icon: "bi-shield-check", color: "#15803d", bg: "#dcfce7", border: "#bbf7d0" },
  { id: "Vacaciones", nombre: "Vacaciones & Viajes", icon: "bi-airplane", color: "#0369a1", bg: "#e0f2fe", border: "#bae6fd" },
  { id: "Vehiculo", nombre: "Auto / Vehículo", icon: "bi-car-front", color: "#b45309", bg: "#fef3c7", border: "#fde68a" },
  { id: "Vivienda", nombre: "Vivienda / Hogar", icon: "bi-house-heart", color: "#4338ca", bg: "#e0e7ff", border: "#c7d2fe" },
  { id: "Inversiones", nombre: "Inversión / Futuro", icon: "bi-graph-up-arrow", color: "#047857", bg: "#d1fae5", border: "#a7f3d0" },
  { id: "Tecnologia", nombre: "Tecnología / Herramientas", icon: "bi-laptop", color: "#6d28d9", bg: "#ede9fe", border: "#ddd6fe" },
  { id: "Metas", nombre: "Meta Personal / General", icon: "bi-bullseye", color: "#be185d", bg: "#fce7f3", border: "#fbcfe8" }
];

export function getCategoriaAhorro(nombreOId) {
  if (!nombreOId) return CATEGORIAS_AHORRO.find((c) => c.id === "Metas");
  const encontrada = CATEGORIAS_AHORRO.find(
    (c) => c.id.toLowerCase() === nombreOId.toLowerCase() || c.nombre.toLowerCase() === nombreOId.toLowerCase()
  );
  return encontrada || {
    id: "Metas",
    nombre: nombreOId,
    icon: "bi-piggy-bank",
    color: "#b45309",
    bg: "#fef3c7",
    border: "#fde68a"
  };
}

export function getCategoriaGasto(nombreOId) {
  if (!nombreOId) return CATEGORIAS_GASTO.find((c) => c.id === "Otros");
  const encontrada = CATEGORIAS_GASTO.find(
    (c) => c.id.toLowerCase() === nombreOId.toLowerCase() || c.nombre.toLowerCase() === nombreOId.toLowerCase()
  );
  return encontrada || {
    id: "Otros",
    nombre: nombreOId,
    icon: "bi-tag",
    color: "#475569",
    bg: "#f1f5f9",
    border: "#cbd5e1"
  };
}

export function getCategoriaIngreso(nombreOId) {
  if (!nombreOId) return CATEGORIAS_INGRESO.find((c) => c.id === "Otros");
  const encontrada = CATEGORIAS_INGRESO.find(
    (c) => c.id.toLowerCase() === nombreOId.toLowerCase() || c.nombre.toLowerCase() === nombreOId.toLowerCase()
  );
  return encontrada || {
    id: "Otros",
    nombre: nombreOId,
    icon: "bi-cash",
    color: "#166534",
    bg: "#e2f2e5",
    border: "#b3dfbb"
  };
}

