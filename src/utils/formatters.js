export const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export const DIAS_SEMANA = [
  "Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"
];

export const MONEDAS = [
  { id: "ARS", simbolo: "$", nombre: "Pesos Argentinos (ARS)", flag: "🇦🇷" },
  { id: "USD", simbolo: "US$", nombre: "Dólares Estadounidenses (USD)", flag: "🇺🇸" },
  { id: "EUR", simbolo: "€", nombre: "Euros (EUR)", flag: "🇪🇺" },
  { id: "USDT", simbolo: "₮", nombre: "Tether / Crypto (USDT)", flag: "🪙" }
];

export function formatoNumber(number) {
  if (number === undefined || number === null || isNaN(number)) return "0,00";
  const [integerPart, decimalPart] = Number(number).toFixed(2).split('.');
  const integerFormatted = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${integerFormatted},${decimalPart}`;
}

export function formatoMoneda(number, moneda = "ARS") {
  const m = MONEDAS.find((item) => item.id === moneda) || MONEDAS[0];
  return `${m.simbolo}${formatoNumber(number)}`;
}

export function getFechaHoy(esCorto = false) {
  const d = new Date();
  if (esCorto) {
    return `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
  }
  return `${DIAS_SEMANA[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]} del ${d.getFullYear()}`;
}

export function sanitizeTextInput(input, maxLength = 150) {
  if (typeof input !== "string") return "";
  return input
    .replace(/[<>]/g, "")
    .replace(/javascript:/gi, "")
    .replace(/data:/gi, "")
    .trim()
    .slice(0, maxLength);
}

export function getFechaHoyISO() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getDiasRestantes(fechaStr) {
  if (!fechaStr) return null;
  const partes = fechaStr.split("-");
  if (partes.length !== 3) return null;
  const vencimiento = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  vencimiento.setHours(0, 0, 0, 0);
  const diffTiempo = vencimiento.getTime() - hoy.getTime();
  return Math.round(diffTiempo / (1000 * 60 * 60 * 24));
}

export function formatoFechaVencimiento(fechaStr) {
  if (!fechaStr) return "";
  const partes = fechaStr.split("-");
  if (partes.length !== 3) return fechaStr;
  const mesNombre = MESES[Number(partes[1]) - 1] ? MESES[Number(partes[1]) - 1].substring(0, 3) : partes[1];
  return `${Number(partes[2])} ${mesNombre} ${partes[0]}`;
}
