import React, { useState } from "react";
import { useVencimientos } from "../context/VencimientosContext";
import { usePrivacy } from "../context/PrivacyContext";
import { useQuickMovement } from "../context/QuickMovementContext";
import { useSecurity } from "../context/SecurityContext";
import { formatoMoneda, formatoFechaVencimiento, getDiasRestantes } from "../utils/formatters";
import { getCategoriaGasto } from "../utils/categories";

export default function VencimientosModal() {
  const {
    vencimientos,
    vencidos,
    porVencer,
    totalPendiente,
    totalVencido,
    totalPorVencer,
    isVencimientosModalOpen,
    closeVencimientosModal,
    marcarComoPagado
  } = useVencimientos();

  const { isPrivate, maskAmount } = usePrivacy();
  const { openQuickModal } = useQuickMovement();
  const { requestConfirmation } = useSecurity();

  const [filtro, setFiltro] = useState("todos");
  const [pagandoId, setPagandoId] = useState(null);

  if (!isVencimientosModalOpen) return null;

  const itemsMostrados = vencimientos.filter((item) => {
    const dias = getDiasRestantes(item.fechaVencimiento);
    if (filtro === "vencidos") return dias !== null && dias < 0;
    if (filtro === "proximos") return dias !== null && dias >= 0 && dias <= 7;
    return true;
  });

  const handlePagarConConfirmacion = (gasto) => {
    requestConfirmation({
      title: "¿Confirmar pago de servicio?",
      message: `Estás por registrar el pago de "${gasto.descripcion}" por ${formatoMoneda(gasto.monto)}.`,
      impact: `Se descontará ${formatoMoneda(gasto.monto)} de tu balance disponible en efectivo.`,
      confirmText: "Sí, registrar pago",
      danger: false,
      onConfirm: async () => {
        setPagandoId(gasto.id || gasto.index);
        try {
          await marcarComoPagado(gasto);
        } finally {
          setPagandoId(null);
        }
      }
    });
  };

  const handleNuevoVencimiento = () => {
    closeVencimientosModal();
    openQuickModal("gasto");
  };

  return (
    <div 
      className="modal fade show d-block" 
      tabIndex="-1" 
      role="dialog"
      style={{ backgroundColor: "rgba(15, 23, 42, 0.72)", zIndex: 1060 }}
    >
      <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
        <div className="modal-content shadow-lg border-0 rounded-4" style={{ backgroundColor: "var(--bg-card)" }}>
          
          <div className="modal-header border-bottom pb-3">
            <div className="d-flex align-items-center gap-2">
              <div 
                className="rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: "40px", height: "40px", backgroundColor: "var(--badge-warning-bg)", color: "var(--accent-warning)" }}
              >
                <i className="bi bi-bell-fill fs-5"></i>
              </div>
              <div>
                <h5 className="modal-title fw-bold text-dark mb-0 fs-6">
                  Vencimientos y Pagos Pendientes
                </h5>
                <span className="text-muted small">
                  Monitorea facturas, impuestos y servicios antes de su fecha límite.
                </span>
              </div>
            </div>
            <button 
              type="button" 
              className="btn-close" 
              onClick={closeVencimientosModal}
              aria-label="Cerrar modal de vencimientos"
            ></button>
          </div>

          <div className="modal-body py-3">
            <div className="row g-2 mb-3">
              <div className="col-12 col-md-4">
                <div className="p-3 rounded-3 border" style={{ backgroundColor: "var(--bg-card-alt)", borderColor: "var(--border-subtle)" }}>
                  <span className="small text-muted d-block mb-1">Total a Pagar</span>
                  <div className={`h5 fw-bold mb-0 text-dark ${isPrivate ? "privacy-masked" : ""}`}>
                    {maskAmount(formatoMoneda(totalPendiente))}
                  </div>
                  <span className="text-muted" style={{ fontSize: "0.72rem" }}>
                    {vencimientos.length} compromisos pendientes
                  </span>
                </div>
              </div>

              <div className="col-6 col-md-4">
                <div 
                  className="p-3 rounded-3 border" 
                  style={{ 
                    backgroundColor: vencidos.length > 0 ? "var(--badge-danger-bg)" : "var(--bg-card-alt)", 
                    borderColor: vencidos.length > 0 ? "var(--badge-danger-border)" : "var(--border-subtle)" 
                  }}
                >
                  <span className="small d-block mb-1 text-danger fw-semibold">
                    <i className="bi bi-exclamation-octagon me-1"></i> Vencidos
                  </span>
                  <div className={`h5 fw-bold mb-0 text-danger ${isPrivate ? "privacy-masked" : ""}`}>
                    {maskAmount(formatoMoneda(totalVencido))}
                  </div>
                  <span className="text-danger small" style={{ fontSize: "0.72rem" }}>
                    {vencidos.length} pagos vencidos
                  </span>
                </div>
              </div>

              <div className="col-6 col-md-4">
                <div 
                  className="p-3 rounded-3 border" 
                  style={{ 
                    backgroundColor: porVencer.length > 0 ? "var(--badge-warning-bg)" : "var(--bg-card-alt)", 
                    borderColor: porVencer.length > 0 ? "var(--badge-warning-border)" : "var(--border-subtle)" 
                  }}
                >
                  <span className="small d-block mb-1 text-warning fw-semibold">
                    <i className="bi bi-clock me-1"></i> Próx. 7 Días
                  </span>
                  <div className={`h5 fw-bold mb-0 text-warning ${isPrivate ? "privacy-masked" : ""}`}>
                    {maskAmount(formatoMoneda(totalPorVencer))}
                  </div>
                  <span className="text-warning small" style={{ fontSize: "0.72rem" }}>
                    {porVencer.length} por vencer
                  </span>
                </div>
              </div>
            </div>

            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
              <div className="btn-group p-1 rounded-pill" style={{ backgroundColor: "var(--bg-card-alt)", border: "1px solid var(--border-subtle)" }}>
                <button
                  type="button"
                  className={`btn btn-sm rounded-pill px-3 fw-semibold border-0 ${filtro === "todos" ? "btn-dark shadow-sm" : "text-muted"}`}
                  onClick={() => setFiltro("todos")}
                >
                  Todos ({vencimientos.length})
                </button>
                <button
                  type="button"
                  className={`btn btn-sm rounded-pill px-3 fw-semibold border-0 ${filtro === "vencidos" ? "btn-danger text-white shadow-sm" : "text-muted"}`}
                  onClick={() => setFiltro("vencidos")}
                >
                  Vencidos ({vencidos.length})
                </button>
                <button
                  type="button"
                  className={`btn btn-sm rounded-pill px-3 fw-semibold border-0 ${filtro === "proximos" ? "btn-warning text-dark shadow-sm" : "text-muted"}`}
                  onClick={() => setFiltro("proximos")}
                >
                  Próximos ({porVencer.length})
                </button>
              </div>

              <button
                type="button"
                className="btn btn-sm btn-outline-success rounded-pill px-3 fw-semibold shadow-sm"
                onClick={handleNuevoVencimiento}
              >
                <i className="bi bi-plus-lg me-1"></i> Programar Factura
              </button>
            </div>

            {itemsMostrados.length === 0 ? (
              <div className="text-center py-5 px-3">
                <div 
                  className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3 shadow-sm"
                  style={{ width: "64px", height: "64px", backgroundColor: "var(--badge-success-bg)", color: "var(--accent-success)" }}
                >
                  <i className="bi bi-check2-circle fs-1"></i>
                </div>
                <h6 className="fw-bold text-dark mb-1">¡Estás al día!</h6>
                <p className="text-muted small mb-3" style={{ maxWidth: "420px", margin: "0 auto" }}>
                  {filtro === "todos" 
                    ? "No tienes pagos ni facturas pendientes en este momento. Excelente control financiero." 
                    : `No hay pagos bajo el filtro "${filtro}".`}
                </p>
                <button
                  type="button"
                  className="btn btn-sm btn-success rounded-pill px-3 fw-semibold shadow-sm"
                  onClick={handleNuevoVencimiento}
                >
                  <i className="bi bi-plus-lg me-1"></i> Registrar nuevo servicio
                </button>
              </div>
            ) : (
              <div className="d-flex flex-column gap-2">
                {itemsMostrados.map((item, idx) => {
                  const cat = getCategoriaGasto(item.categoria);
                  const dias = getDiasRestantes(item.fechaVencimiento);
                  const esVencido = dias !== null && dias < 0;
                  const esHoy = dias === 0;
                  const esManana = dias === 1;
                  const esProximo = dias !== null && dias > 1 && dias <= 7;
                  const isBusy = pagandoId === (item.id || item.index);

                  let badgeClass = "badge-secondary";
                  let badgeText = "Sin fecha límite";
                  let cardBorderClass = "";

                  if (esVencido) {
                    badgeClass = "bg-danger text-white";
                    badgeText = `¡Vencido hace ${Math.abs(dias)} ${Math.abs(dias) === 1 ? 'día' : 'días'}!`;
                    cardBorderClass = "border-danger border-start-4";
                  } else if (esHoy) {
                    badgeClass = "bg-warning text-dark fw-bold";
                    badgeText = "¡Vence Hoy!";
                    cardBorderClass = "border-warning border-start-4";
                  } else if (esManana) {
                    badgeClass = "bg-warning bg-opacity-75 text-dark";
                    badgeText = "Vence Mañana";
                    cardBorderClass = "border-warning border-start-4";
                  } else if (esProximo) {
                    badgeClass = "bg-warning bg-opacity-25 text-warning-emphasis border border-warning";
                    badgeText = `Vence en ${dias} días`;
                    cardBorderClass = "border-start-4";
                  } else if (dias !== null) {
                    badgeClass = "bg-light text-secondary border";
                    badgeText = `Vence en ${dias} días`;
                  }

                  return (
                    <div 
                      key={item.id || idx}
                      className={`p-3 rounded-3 border d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 vencimiento-card ${esVencido ? 'vencido' : (esHoy || esProximo ? 'por-vencer' : '')} ${cardBorderClass}`}
                      style={{ backgroundColor: "var(--bg-card-alt)", borderColor: "var(--border-subtle)" }}
                    >
                      <div className="d-flex align-items-center gap-3">
                        <div 
                          className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                          style={{ width: "42px", height: "42px", backgroundColor: cat.bg, color: cat.color }}
                        >
                          <i className={`bi ${cat.icon} fs-5`}></i>
                        </div>
                        <div>
                          <div className="fw-bold text-dark small">{item.descripcion}</div>
                          <div className="d-flex flex-wrap align-items-center gap-2 mt-1">
                            <span 
                              className="badge px-2 py-0 rounded-pill small"
                              style={{ backgroundColor: cat.bg, color: cat.color, border: `1px solid ${cat.border}`, fontSize: "0.68rem" }}
                            >
                              {cat.nombre}
                            </span>
                            <span className={`badge px-2 py-1 rounded-pill small ${badgeClass}`} style={{ fontSize: "0.72rem" }}>
                              {badgeText}
                            </span>
                            {item.fechaVencimiento && (
                              <span className="text-muted small" style={{ fontSize: "0.75rem" }}>
                                <i className="bi bi-calendar-event me-1"></i>
                                {formatoFechaVencimiento(item.fechaVencimiento)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="d-flex align-items-center justify-content-between justify-content-sm-end gap-3 w-100 w-sm-auto border-top border-sm-top-0 pt-2 pt-sm-0">
                        <div className={`h6 fw-bold text-danger mb-0 text-end ${isPrivate ? "privacy-masked" : ""}`}>
                          {maskAmount(formatoMoneda(item.monto))}
                        </div>

                        <button
                          type="button"
                          className="btn btn-sm btn-success rounded-pill px-3 fw-semibold shadow-sm d-flex align-items-center gap-1"
                          onClick={() => handlePagarConConfirmacion(item)}
                          disabled={isBusy}
                          title="Marcar este servicio como pagado"
                        >
                          {isBusy ? (
                            <>
                              <span className="spinner-border spinner-border-sm" role="status"></span>
                              <span>Procesando...</span>
                            </>
                          ) : (
                            <>
                              <i className="bi bi-check2-circle"></i>
                              <span>Pagar</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="modal-footer border-top d-flex justify-content-between pt-2">
            <span className="text-muted small">
              <i className="bi bi-shield-check me-1 text-success"></i>
              Al pagar, se actualiza automáticamente tu saldo disponible.
            </span>
            <button 
              type="button" 
              className="btn btn-secondary btn-sm px-4 rounded-pill"
              onClick={closeVencimientosModal}
            >
              Cerrar
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
