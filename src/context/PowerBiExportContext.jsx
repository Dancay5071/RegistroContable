import React, { createContext, useContext, useState, useCallback } from "react";

const PowerBiExportContext = createContext();

export function PowerBiExportProvider({ children }) {
  const [isExportOpen, setIsExportOpen] = useState(false);

  const openPowerBiExport = useCallback(() => {
    setIsExportOpen(true);
  }, []);

  const closePowerBiExport = useCallback(() => {
    setIsExportOpen(false);
  }, []);

  return (
    <PowerBiExportContext.Provider
      value={{
        isExportOpen,
        openPowerBiExport,
        closePowerBiExport
      }}
    >
      {children}
    </PowerBiExportContext.Provider>
  );
}

export function usePowerBiExport() {
  const context = useContext(PowerBiExportContext);
  if (!context) {
    throw new Error("usePowerBiExport debe ser utilizado dentro de un PowerBiExportProvider");
  }
  return context;
}
