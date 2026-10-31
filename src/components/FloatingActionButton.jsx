// src/components/FloatingActionButton.jsx
import React from "react";
import { useAuth } from "../context/AuthContext";
import { useQuickMovement } from "../context/QuickMovementContext";

export default function FloatingActionButton() {
  const { user } = useAuth();
  const { openQuickModal } = useQuickMovement();

  if (!user) return null;

  return (
    <button
      type="button"
      className="btn btn-success btn-fab shadow-lg rounded-circle d-flex align-items-center justify-content-center"
      onClick={() => openQuickModal("gasto")}
      title="Nuevo movimiento rápido"
      aria-label="Nuevo movimiento"
    >
      <i className="bi bi-plus-lg fs-4"></i>
    </button>
  );
}

