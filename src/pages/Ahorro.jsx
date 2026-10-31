// src/pages/Ahorro.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useBalance } from "../context/BalanceContext";
import { useQuickMovement } from "../context/QuickMovementContext";
import { useToast } from "../context/ToastContext";
import { 
  getDemoAhorrosPorMes,
  getDemoDetalleAhorros
} from "../services/demoData";
import { 
  getAhorrosYearUser,
  getDetalleAhorrosUser
} from "../services/dbService";
import { MESES, formatoMoneda, formatoNumber } from "../utils/formatters";
import { CATEGORIAS_AHORRO, getCategoriaAhorro } from "../utils/categories";
import Loader from "../components/Loader";

export default function Ahorro() {
  const { user, isDemo } = useAuth();
  const { totalAhorros, totalAhorrosUSD, totalAhorrosEUR } = useBalance();
  const { openQuickModal, movementCounter } = useQuickMovement();
  const { showToast } = useToast();
  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear - 1, currentYear, currentYear + 1];

  const [anio, setAnio] = useState(currentYear);
  const [tablaAhorros, setTablaAhorros] = useState(null);
  const [historialAhorros, setHistorialAhorros] = useState([]);
  const [loading, setLoading] = useState(false);

  // Cargar datos al montar o al cambiar de año o al registrar nuevo movimiento
  useEffect(() => {
    cargarDatosAhorro();
  }, [anio, user, isDemo, movementCounter]);

  const cargarDatosAhorro = async () => {
    setLoading(true);
    try {
      if (isDemo) {
        const netos = getDemoAhorrosPorMes(anio);
        setTablaAhorros(netos);
        const detalle = getDemoDetalleAhorros();
        setHistorialAhorros(detalle);
      } else {
        const netos = await getAhorrosYearUser(user.uid, anio);
        setTablaAhorros(netos);
        const detalle = await getDetalleAhorrosUser(user.uid);
        setHistorialAhorros(detalle);
      }
    } catch (error) {
      console.error("Error al cargar ahorros:", error);
      showToast("Error al obtener datos de ahorro: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // Calcular montos acumulados por categoría
  const ahorrosPorCategoria = {};
  CATEGORIAS_AHORRO.forEach((cat) => {
    ahorrosPorCategoria[cat.id] = { ARS: 0, USD: 0, EUR: 0, count: 0 };
  });

  historialAhorros.forEach((item) => {
    const catId = item.categoria || "Metas";
    if (!ahorrosPorCategoria[catId]) {
      ahorrosPorCategoria[catId] = { ARS: 0, USD: 0, EUR: 0, count: 0 };
    }
    const moneda = item.moneda || "ARS";
    const delta = item.tipo === "extraccion" ? -Number(item.monto) : Number(item.monto);
    ahorrosPorCategoria[catId][moneda] = (ahorrosPorCategoria[catId][moneda] || 0) + delta;
    ahorrosPorCategoria[catId].count += 1;
  });

  return (
    <div className="fade-in d-flex flex-column align-items-center flex-grow-1 p-3">
      <div className="container d-flex flex-column align-items-center" style={{ maxWidth: "1050px" }}>
        
        {/* Encabezado y Selector de Año */}
        <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between w-100 mb-3 gap-2">
          <div>
            <h2 className="h4 fw-bold text-dark mb-1 d-flex align-items-center gap-2">
              <i className="bi bi-piggy-bank text-warning"></i>
              Gestión Integral de Ahorros
            </h2>
            <span className="text-muted small">Administra tus metas financieras y fondos en diferentes monedas.</span>
          </div>

          <div className="d-flex align-items-center gap-2">
            <label htmlFor="anioAhorro" className="small text-muted mb-0 fw-semibold">Año:</label>
            <select 
              id="anioAhorro"
              className="form-select form-select-sm w-auto" 
              value={anio} 
              onChange={(e) => setAnio(Number(e.target.value))}
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <button 
              className="btn btn-sm btn-success rounded-pill px-3 fw-semibold shadow-sm d-flex align-items-center gap-1"
              type="button"
              onClick={() => openQuickModal("ahorro")}
            >
              <i className="bi bi-plus-lg"></i>
              <span>Nuevo Aporte</span>
            </button>
          </div>
        </div>

        {/* Tarjetas de Saldos Multimoneda */}
        <div className="row g-3 w-100 mb-4">
          {/* Pesos Argentinos */}
          <div className="col-12 col-md-4">
            <div className="hero-balance-card hero-ahorro p-3 rounded-4 shadow-sm h-100">
              <div className="d-flex align-items-center justify-content-between mb-1">
                <span className="badge px-2 py-1 rounded-pill small fw-semibold" style={{ backgroundColor: "#fef0cd", color: "#854d0e" }}>
                  🇦🇷 Pesos (ARS)
                </span>
                <i className="bi bi-cash-stack text-warning fs-4"></i>
              </div>
              <div className="h3 fw-bold mb-0 text-dark">{formatoMoneda(totalAhorros, "ARS")}</div>
              <span className="text-muted small">Total acumulado en pesos</span>
            </div>
          </div>

          {/* Dólares Estadounidenses */}
          <div className="col-12 col-md-4">
            <div className="hero-balance-card p-3 rounded-4 shadow-sm h-100" style={{ background: "linear-gradient(135deg, #f0f7f2 0%, #e6f3ec 100%)", borderColor: "#b8ddc1" }}>
              <div className="d-flex align-items-center justify-content-between mb-1">
                <span className="badge px-2 py-1 rounded-pill small fw-semibold" style={{ backgroundColor: "#e2f2e5", color: "#166534" }}>
                  🇺🇸 Dólares (USD)
                </span>
                <i className="bi bi-currency-dollar text-success fs-4"></i>
              </div>
              <div className="h3 fw-bold mb-0 text-success">{formatoMoneda(totalAhorrosUSD, "USD")}</div>
              <span className="text-muted small">Reserva en moneda fuerte</span>
            </div>
          </div>

          {/* Euros u otras divisas */}
          <div className="col-12 col-md-4">
            <div className="hero-balance-card p-3 rounded-4 shadow-sm h-100" style={{ background: "linear-gradient(135deg, #f2f5f9 0%, #e6edf6 100%)", borderColor: "#bed3e8" }}>
              <div className="d-flex align-items-center justify-content-between mb-1">
                <span className="badge px-2 py-1 rounded-pill small fw-semibold" style={{ backgroundColor: "#ddeaf6", color: "#1e40af" }}>
                  🇪🇺 Euros (EUR)
                </span>
                <i className="bi bi-currency-euro text-primary fs-4"></i>
              </div>
              <div className="h3 fw-bold mb-0 text-primary">{formatoMoneda(totalAhorrosEUR, "EUR")}</div>
              <span className="text-muted small">Fondo en moneda europea</span>
            </div>
          </div>
        </div>

        {/* Metas & Categorías de Ahorro */}
        <div className="principal p-4 rounded-4 shadow-sm border w-100 mb-4">
          <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
            <h5 className="h6 text-muted text-uppercase fw-bold mb-0 tracking-wider d-flex align-items-center gap-2">
              <i className="bi bi-tags text-warning"></i> Distribución por Metas y Categorías
            </h5>
            <button
              className="btn btn-sm btn-outline-warning text-dark rounded-pill px-3 fw-semibold"
              onClick={() => openQuickModal("ahorro")}
            >
              <i className="bi bi-arrow-left-right me-1"></i> Aportar o Extraer
            </button>
          </div>

          <div className="row g-2">
            {CATEGORIAS_AHORRO.map((cat) => {
              const datos = ahorrosPorCategoria[cat.id] || { ARS: 0, USD: 0, EUR: 0, count: 0 };
              const tieneMonto = datos.ARS > 0 || datos.USD > 0 || datos.EUR > 0;
              return (
                <div key={cat.id} className="col-12 col-sm-6 col-md-4">
                  <div 
                    className="p-3 rounded-3 border d-flex flex-column justify-content-between h-100"
                    style={{ backgroundColor: cat.bg, borderColor: cat.border }}
                  >
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <div 
                        className="rounded-circle d-flex align-items-center justify-content-center"
                        style={{ width: "32px", height: "32px", backgroundColor: "#ffffff", color: cat.color }}
                      >
                        <i className={`bi ${cat.icon}`}></i>
                      </div>
                      <span className="fw-bold text-dark small">{cat.nombre}</span>
                    </div>

                    <div>
                      {tieneMonto ? (
                        <div className="small">
                          {datos.ARS !== 0 && (
                            <div className="fw-bold" style={{ color: cat.color }}>
                              {formatoMoneda(datos.ARS, "ARS")}
                            </div>
                          )}
                          {datos.USD !== 0 && (
                            <div className="fw-bold text-success">
                              {formatoMoneda(datos.USD, "USD")}
                            </div>
                          )}
                          {datos.EUR !== 0 && (
                            <div className="fw-bold text-primary">
                              {formatoMoneda(datos.EUR, "EUR")}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted small fst-italic">Sin fondos asignados</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Evolución Mensual de Ahorros del Año */}
        {loading && <Loader />}

        {!loading && tablaAhorros && (
          <div className="principal table-responsive w-100 p-4 rounded-4 shadow-sm border mb-4">
            <h5 className="h6 text-muted text-uppercase fw-bold mb-3 tracking-wider d-flex align-items-center gap-2">
              <i className="bi bi-calendar3 text-primary"></i> Evolución Mensual de Ahorros — {anio}
            </h5>
            <table className="table table-bordered text-center align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th scope="col" className="text-muted small">Concepto</th>
                  {tablaAhorros.map((item) => (
                    <th key={item.mes} scope="col" className="small">{item.mes.substring(0, 3)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row" className="text-start fw-semibold" style={{ color: "var(--accent-warning)" }}>Ahorro Neto</th>
                  {tablaAhorros.map((item) => (
                    <td key={item.mes} className={item.monto > 0 ? "fw-bold" : "text-muted"} style={{ color: item.monto > 0 ? "var(--accent-warning)" : undefined }}>
                      ${formatoNumber(item.monto)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Historial de Movimientos de Ahorro */}
        <div className="principal p-4 rounded-4 shadow-sm border w-100">
          <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
            <h5 className="h6 text-muted text-uppercase fw-bold mb-0 tracking-wider d-flex align-items-center gap-2">
              <i className="bi bi-clock-history text-secondary"></i> Historial Reciente de Ahorro
            </h5>
            <span className="badge px-3 py-1 rounded-pill small" style={{ backgroundColor: "#fef0cd", color: "#854d0e" }}>
              {historialAhorros.length} registros
            </span>
          </div>

          {historialAhorros.length === 0 ? (
            <div className="text-center py-4 text-muted small">
              No tienes movimientos de ahorro registrados aún.
            </div>
          ) : (
            <div className="list-group list-group-flush">
              {historialAhorros.slice(0, 8).map((h, idx) => {
                const cat = getCategoriaAhorro(h.categoria);
                const esExtraccion = h.tipo === "extraccion";
                const moneda = h.moneda || "ARS";
                return (
                  <div 
                    key={h.id || idx}
                    className="list-group-item d-flex align-items-center justify-content-between px-0 py-2 border-bottom"
                    style={{ backgroundColor: "transparent" }}
                  >
                    <div className="d-flex align-items-center gap-3">
                      <div 
                        className="rounded-circle d-flex align-items-center justify-content-center"
                        style={{ width: "36px", height: "36px", backgroundColor: cat.bg, color: cat.color }}
                      >
                        <i className={`bi ${cat.icon}`}></i>
                      </div>
                      <div>
                        <div className="fw-semibold text-dark small">{h.descripcion}</div>
                        <div className="d-flex align-items-center gap-2">
                          <span 
                            className="badge px-2 py-0 rounded-pill small"
                            style={{ backgroundColor: cat.bg, color: cat.color, border: `1px solid ${cat.border}`, fontSize: "0.7rem" }}
                          >
                            {cat.nombre}
                          </span>
                          <span className="badge bg-light text-dark border small" style={{ fontSize: "0.68rem" }}>
                            {moneda}
                          </span>
                          <span className="text-muted small" style={{ fontSize: "0.75rem" }}>
                            {h.mes} {h.anio}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className={`fw-bold ${esExtraccion ? "text-danger" : "text-warning"}`}>
                      {esExtraccion ? "-" : "+"}{formatoMoneda(h.monto, moneda)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
