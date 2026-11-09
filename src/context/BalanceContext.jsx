import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { getDemoBalances } from "../services/demoData";
import { listenUserBalances } from "../services/dbService";

const BalanceContext = createContext({
  montoActual: 0,
  totalAhorros: 0,
  totalAhorrosUSD: 0,
  totalAhorrosEUR: 0,
  loadingBalances: true
});

export function BalanceProvider({ children }) {
  const { user, isDemo } = useAuth();
  const [montoActual, setMontoActual] = useState(0);
  const [totalAhorros, setTotalAhorros] = useState(0);
  const [totalAhorrosUSD, setTotalAhorrosUSD] = useState(0);
  const [totalAhorrosEUR, setTotalAhorrosEUR] = useState(0);
  const [loadingBalances, setLoadingBalances] = useState(true);

  useEffect(() => {
    if (isDemo) {
      const updateFromDemo = () => {
        const bal = getDemoBalances();
        setMontoActual(bal.montoActual || 0);
        setTotalAhorros(bal.totalAhorros || 0);
        setTotalAhorrosUSD(bal.totalAhorrosUSD || 0);
        setTotalAhorrosEUR(bal.totalAhorrosEUR || 0);
        setLoadingBalances(false);
      };

      updateFromDemo();
      window.addEventListener("demo-store-updated", updateFromDemo);

      return () => {
        window.removeEventListener("demo-store-updated", updateFromDemo);
      };
    }

    if (user && user.uid) {
      setLoadingBalances(true);
      const unsubscribe = listenUserBalances(user.uid, (balances) => {
        setMontoActual(balances.montoActual);
        setTotalAhorros(balances.totalAhorros);
        setTotalAhorrosUSD(balances.totalAhorrosUSD || 0);
        setTotalAhorrosEUR(balances.totalAhorrosEUR || 0);
        setLoadingBalances(false);
      });

      return () => unsubscribe();
    }

    setMontoActual(0);
    setTotalAhorros(0);
    setTotalAhorrosUSD(0);
    setTotalAhorrosEUR(0);
    setLoadingBalances(false);
  }, [user, isDemo]);

  return (
    <BalanceContext.Provider value={{ 
      montoActual, 
      totalAhorros, 
      totalAhorrosUSD, 
      totalAhorrosEUR, 
      loadingBalances 
    }}>
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
