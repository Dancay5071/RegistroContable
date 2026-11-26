const CACHE_KEY = "fintrack_dolar_cache";
const TTL_MS = 10 * 60 * 1000;

export const DEFAULT_RATES_LATAM = {
  ARS: 1550,
  BRL: 5.85,
  MXN: 19.60,
  CLP: 1030,
  COP: 3600,
  PEN: 3.48,
  UYU: 40.50,
  EUR: 0.91,
  USD: 1.00,
  USDT: 1.00
};

const DEFAULT_RATES = {
  blue: { compra: 1530, venta: 1550, nombre: "Dólar Blue" },
  oficial: { compra: 1510, venta: 1560, nombre: "Dólar Oficial" },
  bolsa: { compra: 1550, venta: 1580, nombre: "Dólar MEP" }
};

export function getRateForCurrency(currencyCode, rates, ratesLatam) {
  if (!currencyCode || currencyCode === "USD" || currencyCode === "USDT") return 1;
  if (currencyCode === "ARS") {
    return Number(rates?.blue?.venta || ratesLatam?.ARS || DEFAULT_RATES_LATAM.ARS);
  }
  return Number(ratesLatam?.[currencyCode] || DEFAULT_RATES_LATAM[currencyCode] || 1);
}

export async function getDolarRates(forceRefresh = false) {
  let cachedPayload = null;

  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      cachedPayload = JSON.parse(raw);
    }
  } catch (err) {
    console.warn("No se pudo leer la caché local de cotizaciones:", err);
  }

  const now = Date.now();
  const isFresh = cachedPayload && (now - cachedPayload.timestamp < TTL_MS);

  if (isFresh && !forceRefresh) {
    return {
      rates: cachedPayload.rates,
      ratesLatam: cachedPayload.ratesLatam || DEFAULT_RATES_LATAM,
      rawList: cachedPayload.rawList || [],
      timestamp: cachedPayload.timestamp,
      isStale: false
    };
  }

  try {
    const [dolarRes, erRes] = await Promise.allSettled([
      fetch("https://dolarapi.com/v1/dolares", { headers: { Accept: "application/json" } }).then((r) => r.ok ? r.json() : null),
      fetch("https://open.er-api.com/v6/latest/USD", { headers: { Accept: "application/json" } }).then((r) => r.ok ? r.json() : null)
    ]);

    const byCasa = {};
    let rawList = [];
    if (dolarRes.status === "fulfilled" && Array.isArray(dolarRes.value)) {
      rawList = dolarRes.value;
      rawList.forEach((item) => {
        byCasa[item.casa] = {
          compra: Number(item.compra),
          venta: Number(item.venta),
          nombre: item.nombre,
          fechaActualizacion: item.fechaActualizacion
        };
      });
    }

    const latamRates = { ...DEFAULT_RATES_LATAM };
    if (erRes.status === "fulfilled" && erRes.value?.rates) {
      const r = erRes.value.rates;
      if (r.BRL) latamRates.BRL = Number(r.BRL);
      if (r.MXN) latamRates.MXN = Number(r.MXN);
      if (r.CLP) latamRates.CLP = Number(r.CLP);
      if (r.COP) latamRates.COP = Number(r.COP);
      if (r.PEN) latamRates.PEN = Number(r.PEN);
      if (r.UYU) latamRates.UYU = Number(r.UYU);
      if (r.EUR) latamRates.EUR = Number(r.EUR);
    }

    if (byCasa.blue?.venta) {
      latamRates.ARS = byCasa.blue.venta;
    }

    const finalRates = Object.keys(byCasa).length > 0 ? byCasa : (cachedPayload?.rates || DEFAULT_RATES);

    const payload = {
      timestamp: now,
      rates: finalRates,
      ratesLatam: latamRates,
      rawList
    };

    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
    } catch (saveErr) {
      console.warn("No se pudo guardar la cotización en localStorage:", saveErr);
    }

    return {
      rates: finalRates,
      ratesLatam,
      rawList,
      timestamp: now,
      isStale: false
    };
  } catch (error) {
    console.warn("Fallo al consultar cotizaciones, aplicando fallback:", error.message);

    if (cachedPayload && cachedPayload.rates) {
      return {
        rates: cachedPayload.rates,
        ratesLatam: cachedPayload.ratesLatam || DEFAULT_RATES_LATAM,
        rawList: cachedPayload.rawList || [],
        timestamp: cachedPayload.timestamp,
        isStale: true
      };
    }

    return {
      rates: DEFAULT_RATES,
      ratesLatam: DEFAULT_RATES_LATAM,
      rawList: [],
      timestamp: now,
      isStale: true
    };
  }
}
