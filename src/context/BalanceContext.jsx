// src/context/BalanceContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { onSnapshot } from "firebase/firestore";
import { settingsDoc, settingDoc } from "../services/firebase";

const BalanceContext = createContext({
  montoActual: 0,
  totalAhorros: 0,
  loadingBalances: true
});

export function BalanceProvider({ children }) {
  const [montoActual, setMontoActual] = useState(0);
  const [totalAhorros, setTotalAhorros] = useState(0);
  const [loadingBalances, setLoadingBalances] = useState(true);

  useEffect(() => {
    // Escuchar monto actual
    const unsubMonto = onSnapshot(settingsDoc, (docSnap) => {
      if (docSnap.exists()) {
        const val = docSnap.data().montoActual;
        setMontoActual(isNaN(val) ? 0 : Number(val));
      } else {
        setMontoActual(0);
      }
    }, (error) => {
      console.error("Error al escuchar montoActual:", error);
    });

    // Escuchar ahorros
    const unsubAhorro = onSnapshot(settingDoc, (docSnap) => {
      if (docSnap.exists()) {
        const val = docSnap.data().totalAhorros;
        setTotalAhorros(isNaN(val) ? 0 : Number(val));
      } else {
        setTotalAhorros(0);
      }
      setLoadingBalances(false);
    }, (error) => {
      console.error("Error al escuchar totalAhorros:", error);
      setLoadingBalances(false);
    });

    return () => {
      unsubMonto();
      unsubAhorro();
    };
  }, []);

  return (
    <BalanceContext.Provider value={{ montoActual, totalAhorros, loadingBalances }}>
      {children}
    </BalanceContext.Provider>
  );
}

export function useBalance() {
  const context = useContext(BalanceContext);
  if (!context) {
    throw new Error("useBalance debe usarse dentro de un BalanceProvider");
  }
  return context;
}

