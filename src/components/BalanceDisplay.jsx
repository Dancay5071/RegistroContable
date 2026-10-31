// src/components/BalanceDisplay.jsx
import React from "react";
import { useBalance } from "../context/BalanceContext";
import { formatoMoneda } from "../utils/formatters";

// Ya no flota sobre los botones, ahora es una pequeña tira informativa integrada
export default function BalanceDisplay({ showAhorro = true }) {
  const { montoActual, totalAhorros } = useBalance();

  return (
    <div className="d-flex justify-content-center w-100 mt-4 mb-2">
      <div className="d-inline-flex align-items-center gap-3 px-3 py-2 rounded-pill bg-dark bg-opacity-50 border border-secondary border-opacity-25 shadow-sm small">
        <span className="text-muted">
          Saldo Disponible: <strong className="text-success">{formatoMoneda(montoActual)}</strong>
        </span>
        {showAhorro && (
          <>
            <span className="text-secondary opacity-50">|</span>
            <span className="text-muted">
              Ahorros: <strong className="text-info">{formatoMoneda(totalAhorros)}</strong>
            </span>
          </>
        )}
      </div>
    </div>
  );
}
