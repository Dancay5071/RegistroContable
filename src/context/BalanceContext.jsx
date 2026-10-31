// src/context/BalanceContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { getDemoBalances } from "../services/demoData";
import { listenUserBalances } from "../services/dbService";

const BalanceContext = createContext({
  montoActual: 0,
  totalAhorros: 0,
  loadingBalances: true
});

export function BalanceProvider({ children }) {
  const { user, isDemo } = useAuth();
  const [montoActual, setMontoActual] = useState(0);
  const [totalAhorros, setTotalAhorros] = useState(0);
  const [loadingBalances, setLoadingBalances] = useState(true);

  useEffect(() => {
    // 1. Modo Demo
    if (isDemo) {
      const updateFromDemo = () => {
        const bal = getDemoBalances();
        setMontoActual(bal.montoActual || 0);
        setTotalAhorros(bal.totalAhorros || 0);
        setLoadingBalances(false);
      };

      updateFromDemo();
      window.addEventListener("demo-store-updated", updateFromDemo);

      return () => {
        window.removeEventListener("demo-store-updated", updateFromDemo);
      };
    }

    // 2. Usuario Autenticado en Firebase (Aislamiento por User ID)
    if (user && user.uid) {
      setLoadingBalances(true);
      const unsubscribe = listenUserBalances(user.uid, (balances) => {
        setMontoActual(balances.montoActual);
        setTotalAhorros(balances.totalAhorros);
        setLoadingBalances(false);
      });

      return () => unsubscribe();
    }

    // 3. Sin usuario
    setMontoActual(0);
    setTotalAhorros(0);
    setLoadingBalances(false);
  }, [user, isDemo]);

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
