// src/utils/formatters.js

export const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export const DIAS_SEMANA = [
  "Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"
];

/**
 * Formatea un número al estilo local: miles con punto y decimales con coma (ej. 1.234,56)
 */
export function formatoNumber(number) {
  if (number === undefined || number === null || isNaN(number)) return "0,00";
  const [integerPart, decimalPart] = Number(number).toFixed(2).split('.');
  const integerFormatted = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${integerFormatted},${decimalPart}`;
}

/**
 * Formatea un número como dinero con signo peso: $1.234,56
 */
export function formatoMoneda(number) {
  return `$${formatoNumber(number)}`;
}

/**
 * Obtiene la fecha de hoy formateada completa o corta
 */
export function getFechaHoy(esCorto = false) {
  const d = new Date();
  if (esCorto) {
    return `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
  }
  return `${DIAS_SEMANA[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]} del ${d.getFullYear()}`;
}

