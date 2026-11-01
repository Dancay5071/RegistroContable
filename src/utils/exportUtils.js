// src/utils/exportUtils.js
import { MESES, formatoMoneda, formatoNumber } from "./formatters";

/**
 * Escapa un valor para formato CSV estándar (RFC 4180).
 */
function escapeCSV(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Descarga una cadena CSV como archivo con codificación UTF-8 BOM.
 * El prefijo \uFEFF garantiza que Excel reconozca tildes y caracteres en español.
 */
export function downloadCSV(filename, csvContent) {
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename.endsWith(".csv") ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exporta el listado de Gastos de un mes/año a formato CSV.
 */
export function exportGastosToCSV(gastos, mes, anio) {
  const headers = ["Período", "Categoría", "Descripción", "Monto ($)"];
  let total = 0;

  const rows = (gastos || []).map((g) => {
    const monto = Number(g.monto) || 0;
    total += monto;
    return [
      escapeCSV(`${mes} ${anio}`),
      escapeCSV(g.categoria || "Sin categoría"),
      escapeCSV(g.descripcion || ""),
      escapeCSV(monto.toFixed(2))
    ].join(",");
  });

  // Fila de total
  rows.push(["", "", escapeCSV("TOTAL:"), escapeCSV(total.toFixed(2))].join(","));

  const csvContent = [headers.map(escapeCSV).join(","), ...rows].join("\r\n");
  const filename = `Gastos_${mes}_${anio}.csv`;
  downloadCSV(filename, csvContent);
}

/**
 * Exporta el listado de Ingresos de un mes/año a formato CSV.
 */
export function exportIngresosToCSV(ingresos, mes, anio) {
  const headers = ["Período", "Categoría", "Descripción", "Monto ($)"];
  let total = 0;

  const rows = (ingresos || []).map((i) => {
    const monto = Number(i.monto) || 0;
    total += monto;
    return [
      escapeCSV(`${mes} ${anio}`),
      escapeCSV(i.categoria || "Sin categoría"),
      escapeCSV(i.descripcion || ""),
      escapeCSV(monto.toFixed(2))
    ].join(",");
  });

  rows.push(["", "", escapeCSV("TOTAL:"), escapeCSV(total.toFixed(2))].join(","));

  const csvContent = [headers.map(escapeCSV).join(","), ...rows].join("\r\n");
  const filename = `Ingresos_${mes}_${anio}.csv`;
  downloadCSV(filename, csvContent);
}

/**
 * Exporta el historial de movimientos de Ahorros a formato CSV.
 */
export function exportAhorrosToCSV(ahorros) {
  const headers = ["Fecha", "Moneda", "Tipo", "Categoría", "Descripción", "Monto"];

  const rows = (ahorros || []).map((a) => {
    const tipo = a.tipo === "extraccion" ? "Extracción" : "Depósito";
    const signo = a.tipo === "extraccion" ? "-" : "+";
    const fecha = a.fecha || `${a.mes || ""} ${a.anio || ""}`.trim() || "-";
    return [
      escapeCSV(fecha),
      escapeCSV(a.moneda || "ARS"),
      escapeCSV(tipo),
      escapeCSV(a.categoria || "Ahorro General"),
      escapeCSV(a.descripcion || ""),
      escapeCSV(`${signo}${Number(a.monto || 0).toFixed(2)}`)
    ].join(",");
  });

  const csvContent = [headers.map(escapeCSV).join(","), ...rows].join("\r\n");
  const filename = `Historial_Ahorros_${new Date().getFullYear()}.csv`;
  downloadCSV(filename, csvContent);
}

/**
 * Exporta la matriz anual de 12 meses a formato CSV para Excel.
 */
export function exportResumenAnualToCSV(resumenData, anio) {
  if (!resumenData) return;

  const headers = ["Concepto", ...MESES.map((m) => m.substring(0, 3)), "Total Anual"];

  const buildRow = (label, dataArray, totalVal) => {
    const values = (dataArray || []).map((v) => escapeCSV(Number(v || 0).toFixed(2)));
    const totalStr = totalVal !== undefined ? escapeCSV(Number(totalVal).toFixed(2)) : escapeCSV("-");
    return [escapeCSV(label), ...values, totalStr].join(",");
  };

  const rows = [
    buildRow("Resto Mes Anterior", resumenData.restosMesAnterior || []),
    buildRow("Ingresos (+)", resumenData.ingresosMensuales || [], resumenData.totalAnualIngresos),
    buildRow("Gastos (-)", resumenData.gastosMensuales || [], resumenData.totalAnualGastos),
    buildRow("Ahorros (Fondo)", resumenData.ahorrosMensuales || [], resumenData.totalAnualAhorros),
    buildRow("Resto Neto Final", resumenData.restosTotales || [], resumenData.totalAnualResto)
  ];

  const csvContent = [headers.map(escapeCSV).join(","), ...rows].join("\r\n");
  const filename = `Resumen_Anual_${anio}.csv`;
  downloadCSV(filename, csvContent);
}

/**
 * Dispara la vista de impresión del navegador formateada para PDF.
 */
export function printFinancialReport() {
  window.print();
}

