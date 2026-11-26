import React, { createContext, useContext, useState, useEffect } from "react";
import { MONEDAS, MONEDAS_LATAM, MONEDAS_GLOBAL, getMonedaInfo, formatoMoneda, formatoNumber } from "../utils/formatters";

const CurrencyContext = createContext(null);

const STORAGE_KEY = "fintrack_currency";
const STORAGE_COMPARISON_KEY = "fintrack_currency_comparison";

export function CurrencyProvider({ children }) {
  const [monedaPrincipal, setMonedaState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && MONEDAS.some((m) => m.id === saved)) {
        return saved;
      }
    } catch (e) {
      console.warn("No se pudo leer la preferencia de moneda:", e);
    }
    return "ARS";
  });

  const [monedaComparativa, setMonedaComparativaState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_COMPARISON_KEY);
      if (saved && (saved === "AUTO" || MONEDAS.some((m) => m.id === saved))) {
        return saved;
      }
    } catch (e) {
      console.warn("No se pudo leer la preferencia de comparación:", e);
    }
    return "AUTO";
  });

  const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState("principal");

  const setMonedaPrincipal = (monedaId) => {
    if (!monedaId || !MONEDAS.some((m) => m.id === monedaId)) return;
    setMonedaState(monedaId);
    try {
      localStorage.setItem(STORAGE_KEY, monedaId);
    } catch (e) {
      console.warn("No se pudo guardar la preferencia de moneda:", e);
    }
    window.dispatchEvent(new CustomEvent("fintrack-currency-changed", { detail: { moneda: monedaId } }));
  };

  const setMonedaComparativa = (monedaId) => {
    if (!monedaId || (monedaId !== "AUTO" && !MONEDAS.some((m) => m.id === monedaId))) return;
    setMonedaComparativaState(monedaId);
    try {
      localStorage.setItem(STORAGE_COMPARISON_KEY, monedaId);
    } catch (e) {
      console.warn("No se pudo guardar la preferencia de comparación:", e);
    }
    window.dispatchEvent(new CustomEvent("fintrack-comparison-currency-changed", { detail: { moneda: monedaId } }));
  };

  const openCurrencyModal = (tab = "principal") => {
    setActiveModalTab(tab);
    setIsCurrencyModalOpen(true);
  };

  const closeCurrencyModal = () => setIsCurrencyModalOpen(false);

  const monedaInfo = getMonedaInfo(monedaPrincipal);

  const activeComparisonCurrency = monedaComparativa === "AUTO" ? monedaPrincipal : monedaComparativa;
  const comparisonCurrencyInfo = getMonedaInfo(activeComparisonCurrency);

  const formatearMonto = (amount, monedaOverride) => {
    return formatoMoneda(amount, monedaOverride || monedaPrincipal);
  };

  return (
    <CurrencyContext.Provider
      value={{
        monedaPrincipal,
        monedaInfo,
        setMonedaPrincipal,
        monedaComparativa,
        setMonedaComparativa,
        activeComparisonCurrency,
        comparisonCurrencyInfo,
        isCurrencyModalOpen,
        activeModalTab,
        setActiveModalTab,
        openCurrencyModal,
        closeCurrencyModal,
        formatearMonto,
        MONEDAS,
        MONEDAS_LATAM,
        MONEDAS_GLOBAL
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    return {
      monedaPrincipal: "ARS",
      monedaInfo: getMonedaInfo("ARS"),
      setMonedaPrincipal: () => {},
      monedaComparativa: "AUTO",
      setMonedaComparativa: () => {},
      activeComparisonCurrency: "ARS",
      comparisonCurrencyInfo: getMonedaInfo("ARS"),
      isCurrencyModalOpen: false,
      activeModalTab: "principal",
      setActiveModalTab: () => {},
      openCurrencyModal: () => {},
      closeCurrencyModal: () => {},
      formatearMonto: (val) => formatoMoneda(val, "ARS"),
      MONEDAS,
      MONEDAS_LATAM,
      MONEDAS_GLOBAL
    };
  }
  return context;
}
