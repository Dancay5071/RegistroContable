globalThis.window = {
  dispatchEvent: () => true,
  addEventListener: () => {},
  removeEventListener: () => {}
};
globalThis.CustomEvent = class CustomEvent {
  constructor(name, opts) {
    this.name = name;
    this.detail = opts?.detail;
  }
};
const memoryStorage = {};
globalThis.localStorage = {
  getItem: (key) => memoryStorage[key] || null,
  setItem: (key, val) => { memoryStorage[key] = String(val); },
  removeItem: (key) => { delete memoryStorage[key]; },
  clear: () => { Object.keys(memoryStorage).forEach((k) => delete memoryStorage[k]); }
};

import { 
  formatoNumber, 
  formatoMoneda, 
  formatoCompacto, 
  sanitizeTextInput, 
  getDiasRestantes, 
  MESES, 
  MONEDAS,
  MONEDAS_LATAM,
  MONEDAS_GLOBAL,
  getMonedaInfo
} from "../src/utils/formatters.js";
import { 
  getCategoriaGasto, 
  getCategoriaIngreso, 
  getCategoriaAhorro, 
  CATEGORIAS_GASTO, 
  CATEGORIAS_INGRESO, 
  CATEGORIAS_AHORRO 
} from "../src/utils/categories.js";
import { 
  normalizeTransactions, 
  generatePowerBiFlatCSV, 
  generateStarSchemaFactCSV, 
  generateStarSchemaDimCategoriasCSV, 
  generateStarSchemaDimTiempoCSV, 
  DAX_MEASURES, 
  POWER_QUERY_M_TEMPLATE 
} from "../src/utils/powerBiExport.js";
import { 
  getDemoStore, 
  getDemoResumenAnual, 
  getDemoBalances, 
  getDemoGastosPendientes, 
  getDemoUltimasTransacciones, 
  getDemoAllTransacciones, 
  getDemoGastos, 
  getDemoIngresos, 
  getDemoAhorrosPorMes 
} from "../src/services/demoData.js";

let passed = 0;
let failed = 0;
const results = [];

function assert(condition, testName, details = "") {
  if (condition) {
    passed++;
    results.push({ status: "PASS", name: testName });
  } else {
    failed++;
    results.push({ status: "FAIL", name: testName, details });
    console.error(`[FAIL] ${testName} - ${details}`);
  }
}

try {
  assert(formatoNumber(0) === "0,00", "formatoNumber: valor 0 formatea como 0,00");
  assert(formatoNumber(1250) === "1.250,00", "formatoNumber: miles con punto y coma");
  assert(formatoNumber(154800.5) === "154.800,50", "formatoNumber: decimales correctos");
  assert(formatoNumber(null) === "0,00", "formatoNumber: manejo seguro de null");
  assert(formatoNumber(undefined) === "0,00", "formatoNumber: manejo seguro de undefined");
  assert(formatoNumber(NaN) === "0,00", "formatoNumber: manejo seguro de NaN");

  assert(formatoMoneda(100, "ARS") === "$100,00", "formatoMoneda: símbolo ARS");
  assert(formatoMoneda(100, "USD") === "US$100,00", "formatoMoneda: símbolo USD");
  assert(formatoMoneda(100, "EUR") === "€100,00", "formatoMoneda: símbolo EUR");
  assert(formatoMoneda(100, "BRL") === "R$100,00", "formatoMoneda: símbolo BRL");
  assert(formatoMoneda(100, "MXN") === "Mex$100,00", "formatoMoneda: símbolo MXN");
  assert(formatoMoneda(100, "CLP") === "CLP$100,00", "formatoMoneda: símbolo CLP");
  assert(formatoMoneda(100, "COP") === "COL$100,00", "formatoMoneda: símbolo COP");
  assert(formatoMoneda(100, "PEN") === "S/100,00", "formatoMoneda: símbolo PEN");
  assert(formatoMoneda(100, "UYU") === "$U100,00", "formatoMoneda: símbolo UYU");
  assert(MONEDAS.length >= 10, "MONEDAS: soporte completo de catálogo de divisas");
  assert(MONEDAS_LATAM.length >= 7, "MONEDAS_LATAM: al menos 7 monedas de Latinoamérica");
  assert(getMonedaInfo("CLP").flag === "🇨🇱", "getMonedaInfo: bandera de Chile");
  assert(getMonedaInfo("MXN").pais === "México", "getMonedaInfo: país México");
  assert(getMonedaInfo("BRL").pais === "Brasil", "getMonedaInfo: país Brasil");

  assert(formatoCompacto(0) === "$0", "formatoCompacto: 0 retorna $0");
  assert(formatoCompacto(500) === "$500", "formatoCompacto: 500 retorna $500");
  assert(formatoCompacto(1000) === "$1k", "formatoCompacto: 1000 retorna $1k");
  assert(formatoCompacto(500000) === "$500k", "formatoCompacto: 500000 retorna $500k");
  assert(formatoCompacto(1000000) === "$1M", "formatoCompacto: 1000000 retorna $1M");
  assert(formatoCompacto(2500000) === "$2,5M", "formatoCompacto: 2500000 retorna $2,5M");
  assert(formatoCompacto(-50000) === "-$50k", "formatoCompacto: números negativos");

  assert(sanitizeTextInput("<script>alert(1)</script>Hola") === "scriptalert(1)/scriptHola", "sanitizeTextInput: neutraliza tags");
  assert(sanitizeTextInput("javascript:test") === "test", "sanitizeTextInput: remueve javascript:");
  assert(sanitizeTextInput("data:text/html") === "text/html", "sanitizeTextInput: remueve data:");
  assert(sanitizeTextInput("   texto con espacios   ") === "texto con espacios", "sanitizeTextInput: trim correcto");
  assert(sanitizeTextInput("a".repeat(200), 50).length === 50, "sanitizeTextInput: recorte por maxLength");

  assert(getDiasRestantes(null) === null, "getDiasRestantes: null retorna null");
  assert(getDiasRestantes("invalid-date") === null, "getDiasRestantes: fecha inválida retorna null");
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];
  const diasManana = getDiasRestantes(tomorrowStr);
  assert(diasManana >= 0 && diasManana <= 2, "getDiasRestantes: fecha futura positiva");

  assert(CATEGORIAS_GASTO.length >= 10, "Categorias Gasto: mínimo 10 categorías");
  assert(CATEGORIAS_INGRESO.length >= 5, "Categorias Ingreso: mínimo 5 categorías");
  assert(CATEGORIAS_AHORRO.length >= 5, "Categorias Ahorro: mínimo 5 categorías");
  assert(getCategoriaGasto("Supermercado").id === "Supermercado", "getCategoriaGasto: búsqueda exacta");
  assert(getCategoriaGasto("inexistente_xyz").id === "Otros", "getCategoriaGasto: fallback a Otros");
  assert(getCategoriaIngreso("Sueldo").id === "Sueldo", "getCategoriaIngreso: búsqueda exacta");
  assert(getCategoriaAhorro("Emergencia").id === "Emergencia", "getCategoriaAhorro: búsqueda exacta");

  const sampleTransactions = [
    { id: "1", tipo: "gasto", monto: 50000, categoria: "Supermercado", mes: "Noviembre", anio: 2026, fecha: "2026-11-05", moneda: "ARS" },
    { id: "2", tipo: "ingreso", monto: 1200000, montoBruto: 1350000, ahorro: 150000, categoria: "Sueldo", mes: "Noviembre", anio: 2026, fecha: "2026-11-01", moneda: "ARS" },
    { id: "3", tipo: "ahorro", monto: 500, categoria: "Inversiones", mes: "Noviembre", anio: 2026, fecha: "2026-11-10", moneda: "USD" }
  ];

  const normalized = normalizeTransactions(sampleTransactions, 1550);
  assert(normalized.length === 3, "normalizeTransactions: cantidad de transacciones preservada");
  assert(normalized[0].montoARS === 50000, "normalizeTransactions: cálculo ARS en pesos");
  assert(normalized[2].montoARS === 500 * 1550, "normalizeTransactions: conversión USD a ARS");
  assert(normalized[0].tipoMovimiento === "Gasto", "normalizeTransactions: tipo Gasto");
  assert(normalized[1].tipoMovimiento === "Ingreso", "normalizeTransactions: tipo Ingreso");

  const flatCSV = generatePowerBiFlatCSV(sampleTransactions, 1550);
  assert(flatCSV.includes("ID_Transaccion") && flatCSV.includes("Monto_Original"), "generatePowerBiFlatCSV: encabezados válidos");
  assert(flatCSV.includes("Supermercado"), "generatePowerBiFlatCSV: datos presentes");

  const starFact = generateStarSchemaFactCSV(sampleTransactions, 1550);
  assert(starFact.includes("ID_Transaccion") && starFact.includes("Monto_ARS_Equivalente"), "generateStarSchemaFactCSV: encabezados fact table");

  const dimTiempo = generateStarSchemaDimTiempoCSV(sampleTransactions);
  assert(dimTiempo.includes("Fecha") && dimTiempo.includes("Mes_Nombre"), "generateStarSchemaDimTiempoCSV: encabezados tiempo");

  const dimCat = generateStarSchemaDimCategoriasCSV(sampleTransactions);
  assert(dimCat.includes("ID_Categoria") && dimCat.includes("Nombre_Categoria"), "generateStarSchemaDimCategoriasCSV: encabezados categoría");

  assert(Array.isArray(DAX_MEASURES) && DAX_MEASURES.length >= 8, "DAX_MEASURES: catálogo completo de medidas DAX");
  assert(DAX_MEASURES.some((m) => m.nombre.includes("Total Ingresos")), "DAX_MEASURES: contiene Total Ingresos");
  assert(DAX_MEASURES.some((m) => m.nombre.includes("Tasa de Ahorro")), "DAX_MEASURES: contiene Tasa Ahorro");
  assert(POWER_QUERY_M_TEMPLATE.includes("let") && POWER_QUERY_M_TEMPLATE.includes("in"), "POWER_QUERY_M_TEMPLATE: plantilla M válida");

  const store = getDemoStore();
  assert(Boolean(store), "getDemoStore: retorna store válido");
  assert(Boolean(store.gastosPorMes), "getDemoStore: contiene gastosPorMes");
  assert(Boolean(store.ingresosPorMes), "getDemoStore: contiene ingresosPorMes");
  assert(Boolean(store.ahorrosPorMes), "getDemoStore: contiene ahorrosPorMes");

  const curYear = new Date().getFullYear();
  const demoResumen = getDemoResumenAnual(curYear);
  assert(demoResumen.ingresosMensuales.length === 12, "getDemoResumenAnual: 12 meses de ingresos");
  assert(demoResumen.gastosMensuales.length === 12, "getDemoResumenAnual: 12 meses de gastos");
  assert(demoResumen.ahorrosMensuales.length === 12, "getDemoResumenAnual: 12 meses de ahorros");
  assert(demoResumen.totalAnualIngresos > 0, "getDemoResumenAnual: total ingresos mayor a 0");
  assert(demoResumen.totalAnualGastos > 0, "getDemoResumenAnual: total gastos mayor a 0");
  assert(demoResumen.totalAnualAhorros > 0, "getDemoResumenAnual: total ahorros mayor a 0");

  const demoBalances = getDemoBalances();
  assert(demoBalances.montoActual > 0, "getDemoBalances: saldo disponible positivo");
  assert(demoBalances.totalAhorros > 0, "getDemoBalances: ahorro ARS positivo");
  assert(demoBalances.totalAhorrosUSD > 0, "getDemoBalances: ahorro USD positivo");

  const demoPendientes = getDemoGastosPendientes();
  assert(demoPendientes.length > 0, "getDemoGastosPendientes: facturas pendientes presentes");

  const demoRecientes = getDemoUltimasTransacciones(5);
  assert(demoRecientes.length <= 5, "getDemoUltimasTransacciones: respeta límite");
  assert(demoRecientes.length > 0, "getDemoUltimasTransacciones: contiene movimientos");

  const allDemo = getDemoAllTransacciones();
  assert(allDemo.length > 20, "getDemoAllTransacciones: histórico completo con más de 20 movimientos");

  console.log(`\n========================================`);
  console.log(`TOTAL TESTS: ${passed + failed}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log(`STATUS: ${failed === 0 ? "ALL CHECKS PASSED SUCCESSFULLY" : "SOME CHECKS FAILED"}`);
  console.log(`========================================\n`);

  if (failed > 0) process.exit(1);
} catch (err) {
  console.error("Excepción crítica durante la ejecución del test runner:", err);
  process.exit(1);
}
