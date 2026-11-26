export const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export const DIAS_SEMANA = [
  "Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"
];

export const MONEDAS = [
  { id: "ARS", simbolo: "$", nombre: "Pesos Argentinos (ARS)", flag: "🇦🇷", pais: "Argentina", region: "LATAM" },
  { id: "USD", simbolo: "US$", nombre: "Dólares Estadounidenses (USD)", flag: "🇺🇸", pais: "Estados Unidos", region: "GLOBAL" },
  { id: "EUR", simbolo: "€", nombre: "Euros (EUR)", flag: "🇪🇺", pais: "Unión Europea", region: "GLOBAL" },
  { id: "BRL", simbolo: "R$", nombre: "Reales Brasileños (BRL)", flag: "🇧🇷", pais: "Brasil", region: "LATAM" },
  { id: "MXN", simbolo: "Mex$", nombre: "Pesos Mexicanos (MXN)", flag: "🇲🇽", pais: "México", region: "LATAM" },
  { id: "CLP", simbolo: "CLP$", nombre: "Pesos Chilenos (CLP)", flag: "🇨🇱", pais: "Chile", region: "LATAM" },
  { id: "COP", simbolo: "COL$", nombre: "Pesos Colombianos (COP)", flag: "🇨🇴", pais: "Colombia", region: "LATAM" },
  { id: "PEN", simbolo: "S/", nombre: "Soles Peruanos (PEN)", flag: "🇵🇪", pais: "Perú", region: "LATAM" },
  { id: "UYU", simbolo: "$U", nombre: "Pesos Uruguayos (UYU)", flag: "🇺🇾", pais: "Uruguay", region: "LATAM" },
  { id: "USDT", simbolo: "₮", nombre: "Tether / Crypto (USDT)", flag: "🪙", pais: "Cripto", region: "CRYPTO" }
];

export const MONEDAS_LATAM = MONEDAS.filter((m) => m.region === "LATAM");
export const MONEDAS_GLOBAL = MONEDAS.filter((m) => m.region === "GLOBAL" || m.region === "CRYPTO");

export function getMonedaInfo(moneda = "ARS") {
  return MONEDAS.find((item) => item.id === moneda) || MONEDAS[0];
}

export function formatoNumber(number) {
  if (number === undefined || number === null || isNaN(number)) return "0,00";
  const [integerPart, decimalPart] = Number(number).toFixed(2).split('.');
  const integerFormatted = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${integerFormatted},${decimalPart}`;
}

export function formatoMoneda(number, moneda = "ARS") {
  const m = getMonedaInfo(moneda);
  return `${m.simbolo}${formatoNumber(number)}`;
}

export function formatoCompacto(number, moneda = "ARS") {
  if (number === undefined || number === null || isNaN(number)) return "$0";
  const num = Number(number);
  const m = getMonedaInfo(moneda);
  const symb = m.simbolo;
  if (num === 0) return `${symb}0`;
  const abs = Math.abs(num);
  const sign = num < 0 ? "-" : "";
  if (abs >= 1000000) {
    const val = abs / 1000000;
    const formatted = val % 1 === 0 ? val.toFixed(0) : val.toFixed(1).replace(".", ",");
    return `${sign}${symb}${formatted}M`;
  }
  if (abs >= 1000) {
    const val = abs / 1000;
    const formatted = val % 1 === 0 ? val.toFixed(0) : val.toFixed(1).replace(".", ",");
    return `${sign}${symb}${formatted}k`;
  }
  return `${sign}${symb}${Math.round(abs)}`;
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

export function getDiasEnMes(mesIndex, anio) {
  return new Date(anio, mesIndex + 1, 0).getDate();
}

export function getPrimerDiaSemana(mesIndex, anio) {
  return (new Date(anio, mesIndex, 1).getDay() + 6) % 7;
}

export function formatoFechaLarga(fechaStr) {
  if (!fechaStr) return "";
  const partes = fechaStr.split("-");
  if (partes.length !== 3) return fechaStr;
  const fecha = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
  const diaSemana = DIAS_SEMANA[fecha.getDay()];
  const diaMes = Number(partes[2]);
  const mesNombre = MESES[Number(partes[1]) - 1];
  const anio = partes[0];
  return `${diaSemana}, ${diaMes} de ${mesNombre} de ${anio}`;
}
