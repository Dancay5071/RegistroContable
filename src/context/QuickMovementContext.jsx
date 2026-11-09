import React, { createContext, useContext, useState } from "react";

const QuickMovementContext = createContext();

export function QuickMovementProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("gasto"); // "gasto" | "ingreso" | "ahorro"
  const [movementCounter, setMovementCounter] = useState(0);

  const openQuickModal = (tab = "gasto") => {
    setActiveTab(tab);
    setIsOpen(true);
  };

  const closeQuickModal = () => {
    setIsOpen(false);
  };

  const notifyMovementSaved = () => {
    setMovementCounter((prev) => prev + 1);
  };

  return (
    <QuickMovementContext.Provider
      value={{
        isOpen,
        activeTab,
        setActiveTab,
        openQuickModal,
        closeQuickModal,
        notifyMovementSaved,
        movementCounter
      }}
    >
      {children}
    </QuickMovementContext.Provider>
  );
}

export function useQuickMovement() {
  const context = useContext(QuickMovementContext);
  if (!context) {
    throw new Error("useQuickMovement debe usarse dentro de un QuickMovementProvider");
  }
  return context;
}

