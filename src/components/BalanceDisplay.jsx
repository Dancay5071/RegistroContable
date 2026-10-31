// src/components/BalanceDisplay.jsx
import React from "react";
import { useBalance } from "../context/BalanceContext";
import { formatoMoneda } from "../utils/formatters";

export default function BalanceDisplay({ showAhorro = false, className = "float-xl-end" }) {
  const { montoActual, totalAhorros } = useBalance();

  return (
    <div className={className}>
      <div className="text-bg-dark p-3 rounded shadow-sm d-flex gap-3 align-items-center">
        <div>
          <strong>Monto actual:</strong> {formatoMoneda(montoActual)}
        </div>
        {showAhorro && (
          <div>
            <strong>Ahorros:</strong> {formatoMoneda(totalAhorros)}
          </div>
        )}
      </div>
    </div>
  );
}

