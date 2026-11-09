const CACHE_KEY = "fintrack_dolar_cache";
const TTL_MS = 10 * 60 * 1000;

const DEFAULT_RATES = {
  blue: { compra: 1530, venta: 1550, nombre: "Dólar Blue" },
  oficial: { compra: 1510, venta: 1560, nombre: "Dólar Oficial" },
  bolsa: { compra: 1550, venta: 1580, nombre: "Dólar MEP" }
};

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
      rawList: cachedPayload.rawList,
      timestamp: cachedPayload.timestamp,
      isStale: false
    };
  }

  try {
    const response = await fetch("https://dolarapi.com/v1/dolares", {
      headers: { Accept: "application/json" }
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const data = await response.json();

    const byCasa = {};
    data.forEach((item) => {
      byCasa[item.casa] = {
        compra: Number(item.compra),
        venta: Number(item.venta),
        nombre: item.nombre,
        fechaActualizacion: item.fechaActualizacion
      };
    });

    const payload = {
      timestamp: now,
      rates: byCasa,
      rawList: data
    };

    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
    } catch (saveErr) {
      console.warn("No se pudo guardar la cotización en localStorage:", saveErr);
    }

    return {
      rates: byCasa,
      rawList: data,
      timestamp: now,
      isStale: false
    };
  } catch (error) {
    console.warn("Fallo al consultar DolarApi, aplicando fallback Stale-While-Revalidate:", error.message);

    if (cachedPayload && cachedPayload.rates) {
      return {
        rates: cachedPayload.rates,
        rawList: cachedPayload.rawList || [],
        timestamp: cachedPayload.timestamp,
        isStale: true
      };
    }

    return {
      rates: DEFAULT_RATES,
      rawList: [],
      timestamp: now,
      isStale: true
    };
  }
}
