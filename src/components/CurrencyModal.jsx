import React from "react";
import { useCurrency } from "../context/CurrencyContext";
import { useToast } from "../context/ToastContext";
import { useFocusTrap } from "../hooks/useFocusTrap";
import { formatoMoneda } from "../utils/formatters";

export default function CurrencyModal() {
  const {
    monedaPrincipal,
    setMonedaPrincipal,
    isCurrencyModalOpen,
    closeCurrencyModal,
    MONEDAS_LATAM,
    MONEDAS_GLOBAL
  } = useCurrency();

  const { showToast } = useToast();
  const modalRef = useFocusTrap(isCurrencyModalOpen);

  if (!isCurrencyModalOpen) return null;

  const handleSelect = (m) => {
    setMonedaPrincipal(m.id);
    showToast(`Moneda principal configurada en ${m.nombre}`, "success");
    closeCurrencyModal();
  };

  return (
    <div
      ref={modalRef}
      className="modal fade show d-block"
      tabIndex="-1"
      role="dialog"
      aria-modal="true"
      aria-labelledby="currency-modal-title"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.65)", zIndex: 1060 }}
    >
      <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
        <div className="modal-content shadow-lg border-0 rounded-4">
          <div className="modal-header border-bottom pb-3">
            <div className="d-flex align-items-center gap-2">
              <div className="p-2 rounded-circle bg-success bg-opacity-10 text-success">
                <i className="bi bi-cash-coin fs-4"></i>
              </div>
              <div>
                <h5 className="modal-title fw-bold mb-0 text-dark" id="currency-modal-title">
                  Configuración de Moneda y Divisas
                </h5>
                <span className="text-muted small">
                  Selecciona tu moneda principal de LATAM o internacional para registrar tus movimientos
                </span>
              </div>
            </div>
            <button
              type="button"
              className="btn-close"
              onClick={closeCurrencyModal}
              aria-label="Cerrar modal de moneda"
            ></button>
          </div>

          <div className="modal-body p-4">
            <div className="p-3 rounded-3 mb-4 border d-flex align-items-center justify-content-between flex-wrap gap-2" style={{ backgroundColor: "var(--bg-card-alt)", borderColor: "var(--border-subtle)" }}>
              <div>
                <span className="text-muted small d-block">Moneda Principal Actual:</span>
                <strong className="fs-6 text-dark d-flex align-items-center gap-2">
                  <span>{MONEDAS_LATAM.concat(MONEDAS_GLOBAL).find((m) => m.id === monedaPrincipal)?.flag}</span>
                  <span>{MONEDAS_LATAM.concat(MONEDAS_GLOBAL).find((m) => m.id === monedaPrincipal)?.nombre}</span>
                </strong>
              </div>
              <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-3 py-2 rounded-pill fw-semibold">
                Activa en todo el sistema
              </span>
            </div>

            <div className="mb-4">
              <div className="d-flex align-items-center gap-2 mb-3">
                <span className="badge bg-primary bg-opacity-10 text-primary border px-2 py-1 rounded-pill small">
                  🌎 Región
                </span>
                <h6 className="fw-bold mb-0 text-uppercase tracking-wider small text-muted">
                  Monedas de Latinoamérica (LATAM)
                </h6>
              </div>

              <div className="row g-2">
                {MONEDAS_LATAM.map((m) => {
                  const isSelected = monedaPrincipal === m.id;
                  return (
                    <div className="col-12 col-md-6" key={m.id}>
                      <button
                        type="button"
                        className={`w-100 text-start p-3 rounded-3 border transition-all d-flex align-items-center justify-content-between ${
                          isSelected ? "border-success bg-success bg-opacity-10 shadow-sm" : "border-light-subtle bg-white hover-shadow"
                        }`}
                        onClick={() => handleSelect(m)}
                        style={{ cursor: "pointer" }}
                      >
                        <div className="d-flex align-items-center gap-3">
                          <span className="fs-3">{m.flag}</span>
                          <div>
                            <div className="fw-bold text-dark d-flex align-items-center gap-2">
                              <span>{m.id}</span>
                              <span className="text-muted small fw-normal">({m.simbolo})</span>
                              {isSelected && (
                                <span className="badge bg-success rounded-pill" style={{ fontSize: "0.65rem" }}>
                                  ACTIVA
                                </span>
                              )}
                            </div>
                            <div className="text-muted small">{m.nombre.split(" (")[0]} • {m.pais}</div>
                          </div>
                        </div>
                        <div className="text-end">
                          <span className="badge bg-light text-secondary border small">
                            {formatoMoneda(1500, m.id)}
                          </span>
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mb-2">
              <div className="d-flex align-items-center gap-2 mb-3">
                <span className="badge bg-info bg-opacity-10 text-info border px-2 py-1 rounded-pill small">
                  🌐 Internacional
                </span>
                <h6 className="fw-bold mb-0 text-uppercase tracking-wider small text-muted">
                  Monedas Globales y Reserva
                </h6>
              </div>

              <div className="row g-2">
                {MONEDAS_GLOBAL.map((m) => {
                  const isSelected = monedaPrincipal === m.id;
                  return (
                    <div className="col-12 col-md-6" key={m.id}>
                      <button
                        type="button"
                        className={`w-100 text-start p-3 rounded-3 border transition-all d-flex align-items-center justify-content-between ${
                          isSelected ? "border-success bg-success bg-opacity-10 shadow-sm" : "border-light-subtle bg-white hover-shadow"
                        }`}
                        onClick={() => handleSelect(m)}
                        style={{ cursor: "pointer" }}
                      >
                        <div className="d-flex align-items-center gap-3">
                          <span className="fs-3">{m.flag}</span>
                          <div>
                            <div className="fw-bold text-dark d-flex align-items-center gap-2">
                              <span>{m.id}</span>
                              <span className="text-muted small fw-normal">({m.simbolo})</span>
                              {isSelected && (
                                <span className="badge bg-success rounded-pill" style={{ fontSize: "0.65rem" }}>
                                  ACTIVA
                                </span>
                              )}
                            </div>
                            <div className="text-muted small">{m.nombre.split(" (")[0]}</div>
                          </div>
                        </div>
                        <div className="text-end">
                          <span className="badge bg-light text-secondary border small">
                            {formatoMoneda(1500, m.id)}
                          </span>
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="modal-footer border-top pt-2">
            <button
              type="button"
              className="btn btn-secondary btn-sm px-4 rounded-pill"
              onClick={closeCurrencyModal}
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
