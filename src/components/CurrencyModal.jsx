import React, { useState } from "react";
import { useCurrency } from "../context/CurrencyContext";
import { useDolar } from "../hooks/useDolar";
import { useToast } from "../context/ToastContext";
import { useFocusTrap } from "../hooks/useFocusTrap";
import { formatoMoneda, formatoNumber } from "../utils/formatters";

export default function CurrencyModal() {
  const {
    monedaPrincipal,
    setMonedaPrincipal,
    monedaComparativa,
    setMonedaComparativa,
    activeComparisonCurrency,
    isCurrencyModalOpen,
    activeModalTab,
    setActiveModalTab,
    closeCurrencyModal,
    MONEDAS,
    MONEDAS_LATAM,
    MONEDAS_GLOBAL
  } = useCurrency();

  const { rates, ratesLatam, getRate, refresh: refreshDolar, loading: loadingDolar } = useDolar();
  const { showToast } = useToast();
  const modalRef = useFocusTrap(isCurrencyModalOpen);

  const [calculadoraUSD, setCalculadoraUSD] = useState("100");

  if (!isCurrencyModalOpen) return null;

  const handleSelectPrincipal = (m) => {
    setMonedaPrincipal(m.id);
    showToast(`Moneda principal configurada en ${m.nombre}`, "success");
  };

  const handleSelectComparativa = (id) => {
    setMonedaComparativa(id);
    const label = id === "AUTO" ? `Automático (con ${monedaPrincipal})` : id;
    showToast(`Comparativa de barra superior configurada en ${label}`, "info");
  };

  const currentTab = activeModalTab || "principal";

  const numCalculadora = parseFloat(calculadoraUSD) || 0;
  const tasaPrincipal = getRate(monedaPrincipal);
  const totalCalculado = numCalculadora * tasaPrincipal;

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
                  Monedas y Comparativa de Divisas
                </h5>
                <span className="text-muted small">
                  Configura tu moneda de cuenta o personaliza la comparativa con el dólar
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

          <div className="px-4 pt-3 border-bottom bg-light">
            <ul className="nav nav-pills gap-2" role="tablist">
              <li className="nav-item">
                <button
                  type="button"
                  className={`btn btn-sm rounded-pill px-3 py-2 fw-semibold ${currentTab === "principal" ? "btn-primary shadow-sm" : "btn-outline-secondary"}`}
                  onClick={() => setActiveModalTab("principal")}
                >
                  <i className="bi bi-wallet2 me-1"></i> Moneda Principal de Cuenta
                </button>
              </li>
              <li className="nav-item">
                <button
                  type="button"
                  className={`btn btn-sm rounded-pill px-3 py-2 fw-semibold ${currentTab === "comparativa" ? "btn-primary shadow-sm" : "btn-outline-secondary"}`}
                  onClick={() => setActiveModalTab("comparativa")}
                >
                  <i className="bi bi-arrow-left-right me-1"></i> Comparativa con Dólar
                </button>
              </li>
            </ul>
          </div>

          <div className="modal-body p-4">
            {currentTab === "principal" && (
              <div>
                <div className="p-3 rounded-3 mb-4 border d-flex align-items-center justify-content-between flex-wrap gap-2" style={{ backgroundColor: "var(--bg-card-alt)", borderColor: "var(--border-subtle)" }}>
                  <div>
                    <span className="text-muted small d-block">Moneda Principal Seleccionada:</span>
                    <strong className="fs-6 text-dark d-flex align-items-center gap-2">
                      <span>{MONEDAS.find((m) => m.id === monedaPrincipal)?.flag}</span>
                      <span>{MONEDAS.find((m) => m.id === monedaPrincipal)?.nombre}</span>
                    </strong>
                  </div>
                  <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-3 py-2 rounded-pill fw-semibold">
                    Activa para gastos, ingresos y balances
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
                            onClick={() => handleSelectPrincipal(m)}
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
                                      PRINCIPAL
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
                            onClick={() => handleSelectPrincipal(m)}
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
                                      PRINCIPAL
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
            )}

            {currentTab === "comparativa" && (
              <div>
                <div className="p-3 rounded-3 mb-4 border" style={{ backgroundColor: "var(--bg-card-alt)", borderColor: "var(--border-subtle)" }}>
                  <div className="d-flex align-items-center justify-content-between mb-2 flex-wrap gap-2">
                    <div>
                      <span className="small text-muted fw-semibold d-block">¿Qué moneda mostrar en la pastilla superior?</span>
                      <strong className="text-dark">
                        {monedaComparativa === "AUTO" ? (
                          <span>🌟 Automático — Comparar con mi Moneda Principal ({monedaPrincipal})</span>
                        ) : (
                          <span>Fijada en: {monedaComparativa}</span>
                        )}
                      </strong>
                    </div>
                    <button
                      type="button"
                      className="btn btn-outline-success btn-sm rounded-pill px-3 d-flex align-items-center gap-1"
                      onClick={() => refreshDolar()}
                      disabled={loadingDolar}
                    >
                      <i className={`bi bi-arrow-clockwise ${loadingDolar ? 'spin' : ''}`}></i>
                      <span>Actualizar cotizaciones</span>
                    </button>
                  </div>

                  <div className="d-flex flex-wrap gap-2 pt-2 border-top">
                    <button
                      type="button"
                      className={`btn btn-sm rounded-pill px-3 fw-semibold ${monedaComparativa === "AUTO" ? "btn-success shadow-sm" : "btn-outline-secondary"}`}
                      onClick={() => handleSelectComparativa("AUTO")}
                    >
                      🌟 Seguir mi Moneda Principal ({monedaPrincipal})
                    </button>
                    {MONEDAS.filter((m) => m.id !== "USD" && m.id !== "USDT").map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        className={`btn btn-sm rounded-pill px-2 py-1 fw-semibold ${monedaComparativa === m.id ? "btn-success shadow-sm" : "btn-outline-secondary"}`}
                        style={{ fontSize: "0.82rem" }}
                        onClick={() => handleSelectComparativa(m.id)}
                      >
                        <span className="me-1">{m.flag}</span> {m.id}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <h6 className="fw-bold mb-3 text-uppercase tracking-wider small text-muted d-flex align-items-center gap-2">
                    <i className="bi bi-table text-primary"></i> Cotización de 1 Dólar Estadounidense (1 USD)
                  </h6>
                  <div className="table-responsive rounded-3 border">
                    <table className="table table-hover align-middle mb-0 text-center">
                      <thead className="table-light small">
                        <tr>
                          <th className="text-start ps-3">País / Región</th>
                          <th>Moneda</th>
                          <th>Equivalencia de 1 USD</th>
                          <th>Acción</th>
                        </tr>
                      </thead>
                      <tbody className="small">
                        {MONEDAS.filter((m) => m.id !== "USD" && m.id !== "USDT").map((m) => {
                          const rateVal = getRate(m.id);
                          const isComparingThis = activeComparisonCurrency === m.id;
                          return (
                            <tr key={m.id} className={isComparingThis ? "table-success bg-opacity-25 fw-semibold" : ""}>
                              <td className="text-start ps-3">
                                <span className="fs-5 me-2">{m.flag}</span>
                                <span>{m.pais}</span>
                              </td>
                              <td>
                                <span className="badge bg-light text-dark border">{m.id}</span>
                              </td>
                              <td>
                                <strong className="text-dark">
                                  {formatoMoneda(rateVal, m.id)}
                                </strong>
                              </td>
                              <td>
                                {isComparingThis ? (
                                  <span className="badge bg-success rounded-pill px-2 py-1">
                                    En pantalla
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    className="btn btn-outline-primary btn-sm py-0 px-2 rounded-pill"
                                    style={{ fontSize: "0.75rem" }}
                                    onClick={() => handleSelectComparativa(m.id)}
                                  >
                                    Comparar
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="p-3 rounded-3 border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}>
                  <h6 className="fw-bold mb-2 small text-dark d-flex align-items-center gap-2">
                    <i className="bi bi-calculator text-success"></i> Calculadora Rápida USD a {monedaPrincipal}
                  </h6>
                  <div className="row g-2 align-items-center">
                    <div className="col-12 col-sm-5">
                      <div className="input-group input-group-sm">
                        <span className="input-group-text fw-bold">USD</span>
                        <input
                          type="number"
                          className="form-control"
                          min="0"
                          step="1"
                          value={calculadoraUSD}
                          onChange={(e) => setCalculadoraUSD(e.target.value)}
                          placeholder="Monto USD"
                        />
                      </div>
                    </div>
                    <div className="col-12 col-sm-2 text-center text-muted fw-bold">
                      <i className="bi bi-arrow-right d-none d-sm-inline"></i>
                      <i className="bi bi-arrow-down d-inline d-sm-none"></i>
                    </div>
                    <div className="col-12 col-sm-5">
                      <div className="p-2 rounded bg-light border text-center fw-bold text-success">
                        ≈ {formatoMoneda(totalCalculado, monedaPrincipal)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
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
