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
