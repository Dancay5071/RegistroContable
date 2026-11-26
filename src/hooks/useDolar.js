import { useState, useEffect, useCallback } from "react";
import { getDolarRates, getRateForCurrency, DEFAULT_RATES_LATAM } from "../services/dolarService";

export function useDolar() {
  const [rates, setRates] = useState(null);
  const [ratesLatam, setRatesLatam] = useState(DEFAULT_RATES_LATAM);
  const [loading, setLoading] = useState(true);
  const [isStale, setIsStale] = useState(false);
  const [timestamp, setTimestamp] = useState(null);

  const cargarCotizaciones = useCallback(async (force = false) => {
    try {
      const res = await getDolarRates(force);
      setRates(res.rates);
      if (res.ratesLatam) {
        setRatesLatam(res.ratesLatam);
      }
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

  const blue = rates?.blue || { compra: 1530, venta: 1550, nombre: "Dólar Blue" };
  const oficial = rates?.oficial || { compra: 1510, venta: 1560, nombre: "Dólar Oficial" };
  const mep = rates?.bolsa || { compra: 1550, venta: 1580, nombre: "Dólar MEP" };

  const getRate = useCallback((currencyCode) => {
    return getRateForCurrency(currencyCode, rates, ratesLatam);
  }, [rates, ratesLatam]);

  const convertirUSDaARS = useCallback((montoUSD, tipo = "blue") => {
    const cotizacion = rates?.[tipo]?.venta || blue?.venta || DEFAULT_RATES_LATAM.ARS;
    return Number(montoUSD || 0) * cotizacion;
  }, [rates, blue]);

  const convertirARSaUSD = useCallback((montoARS, tipo = "blue") => {
    const cotizacion = rates?.[tipo]?.venta || blue?.venta || DEFAULT_RATES_LATAM.ARS;
    return cotizacion > 0 ? Number(montoARS || 0) / cotizacion : 0;
  }, [rates, blue]);

  const convertirUSDaMoneda = useCallback((montoUSD, targetCurrency = "ARS") => {
    const r = getRate(targetCurrency);
    return Number(montoUSD || 0) * r;
  }, [getRate]);

  return {
    rates,
    ratesLatam,
    blue,
    oficial,
    mep,
    loading,
    isStale,
    timestamp,
    getRate,
    convertirUSDaMoneda,
    refresh: () => cargarCotizaciones(true),
    convertirUSDaARS,
    convertirARSaUSD
  };
}
