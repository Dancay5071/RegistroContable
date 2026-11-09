import React from "react";
import { useSecurity } from "../context/SecurityContext";

export default function SecurityConfirmModal() {
  const { confirmModalConfig, closeConfirmation } = useSecurity();

  if (!confirmModalConfig) return null;

  const { title, message, impact, confirmText = "Confirmar", danger = true, onConfirm } = confirmModalConfig;

  const handleConfirm = async () => {
    try {
      if (onConfirm) await onConfirm();
    } finally {
      closeConfirmation();
    }
  };

  return (
    <div 
      className="modal fade show d-block" 
      tabIndex="-1" 
      role="dialog" 
      style={{ backgroundColor: "rgba(0, 0, 0, 0.7)", zIndex: 1090 }}
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: "440px" }}>
        <div className="modal-content border-0 rounded-4 shadow-lg p-2">
          <div className="modal-header border-bottom-0 pb-1">
            <h5 className="modal-title fw-bold fs-6 d-flex align-items-center gap-2">
              <i className={`bi ${danger ? "bi-shield-exclamation text-danger" : "bi-shield-check text-success"} fs-5`}></i>
              <span>{title || "Confirmación Requerida"}</span>
            </h5>
            <button 
              type="button" 
              className="btn-close" 
              onClick={closeConfirmation}
              aria-label="Cancelar"
            ></button>
          </div>

          <div className="modal-body py-2">
            <p className="text-muted small mb-3">{message}</p>

            {impact && (
              <div className="p-3 rounded-3 mb-2 border" style={{ backgroundColor: "var(--bg-card-alt)", borderColor: "var(--border-subtle)" }}>
                <div className="d-flex align-items-center gap-2 mb-1">
                  <i className="bi bi-info-circle-fill text-primary small"></i>
                  <strong className="small">Impacto en tus Balances:</strong>
                </div>
                <div className="small text-muted ps-3 border-start border-2 border-primary">
                  {impact}
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer border-top-0 pt-2 gap-2">
            <button 
              type="button" 
              className="btn btn-sm btn-outline-secondary rounded-pill px-3 py-1"
              onClick={closeConfirmation}
            >
              Cancelar
            </button>
            <button 
              type="button" 
              className={`btn btn-sm ${danger ? "btn-danger" : "btn-primary"} rounded-pill px-4 py-1 fw-semibold shadow-sm`}
              onClick={handleConfirm}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

