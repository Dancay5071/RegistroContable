import { useState, useEffect, useCallback } from "react";
import { getDolarRates } from "../services/dolarService";

export function useDolar() {
  const [rates, setRates] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isStale, setIsStale] = useState(false);
  const [timestamp, setTimestamp] = useState(null);

  const cargarCotizaciones = useCallback(async (force = false) => {
    try {
      const res = await getDolarRates(force);
      setRates(res.rates);
      setIsStale(res.isStale);
      setTimestamp(res.timestamp);
    } catch (err) {
      console.error("Error en useDolar:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarCotizaciones(false);

    const interval = setInterval(() => {
      cargarCotizaciones(false);
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [cargarCotizaciones]);

  const blue = rates?.blue || { compra: 0, venta: 0, nombre: "Dólar Blue" };
  const oficial = rates?.oficial || { compra: 0, venta: 0, nombre: "Dólar Oficial" };
  const mep = rates?.bolsa || { compra: 0, venta: 0, nombre: "Dólar MEP" };

  const convertirUSDaARS = useCallback((montoUSD, tipo = "blue") => {
    const cotizacion = rates?.[tipo]?.venta || blue?.venta || 0;
    return Number(montoUSD || 0) * cotizacion;
  }, [rates, blue]);

  const convertirARSaUSD = useCallback((montoARS, tipo = "blue") => {
    const cotizacion = rates?.[tipo]?.venta || blue?.venta || 1;
    return cotizacion > 0 ? Number(montoARS || 0) / cotizacion : 0;
  }, [rates, blue]);

  return {
    rates,
    blue,
    oficial,
    mep,
    loading,
    isStale,
    timestamp,
    refresh: () => cargarCotizaciones(true),
    convertirUSDaARS,
    convertirARSaUSD
  };
}
