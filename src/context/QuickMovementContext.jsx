import React, { createContext, useContext, useState } from "react";
import { useSubscription } from "./SubscriptionContext";
import { useToast } from "./ToastContext";

const QuickMovementContext = createContext();

export function QuickMovementProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("gasto");
  const [movementCounter, setMovementCounter] = useState(0);
  const { subscription, openSubscriptionModal } = useSubscription();
  const { showToast } = useToast();

  const openQuickModal = (tab = "gasto") => {
    if (subscription?.isExpired) {
      showToast("Tu periodo de prueba ha finalizado. Suscríbete para agregar nuevos movimientos.", "warning");
      openSubscriptionModal();
      return;
    }
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

