// src/pages/Ahorro.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useBalance } from "../context/BalanceContext";
import { useQuickMovement } from "../context/QuickMovementContext";
import { useToast } from "../context/ToastContext";
import { 
  getDemoAhorrosPorMes,
  getDemoDetalleAhorros,
  updateDemoAhorro,
  deleteDemoAhorro
} from "../services/demoData";
import { 
  getAhorrosYearUser,
  getDetalleAhorrosUser,
  updateAhorroUser,
  deleteAhorroUser
} from "../services/dbService";
import { MESES, MONEDAS, formatoMoneda, formatoNumber } from "../utils/formatters";
import { CATEGORIAS_AHORRO, getCategoriaAhorro } from "../utils/categories";
import Loader from "../components/Loader";
import { exportAhorrosToCSV } from "../utils/exportUtils";

export default function Ahorro() {
  const { user, isDemo } = useAuth();
  const { totalAhorros, totalAhorrosUSD, totalAhorrosEUR } = useBalance();
  const { openQuickModal, movementCounter, notifyMovementSaved } = useQuickMovement();
  const { showToast } = useToast();
  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear - 3, currentYear - 2, currentYear - 1, currentYear, currentYear + 1];

  const [anio, setAnio] = useState(currentYear);
  const [tablaAhorros, setTablaAhorros] = useState(null);
  const [historialAhorros, setHistorialAhorros] = useState([]);
  const [loading, setLoading] = useState(false);

  // Estados para Modal de Edición de Ahorro
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editDescripcion, setEditDescripcion] = useState("");
  const [editMonto, setEditMonto] = useState("");
  const [editMoneda, setEditMoneda] = useState("ARS");
  const [editCategoria, setEditCategoria] = useState("Emergencia");
  const [editLoading, setEditLoading] = useState(false);

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

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setEditDescripcion(item.descripcion || "");
    setEditMonto(String(item.monto || ""));
    setEditMoneda(item.moneda || "ARS");
    setEditCategoria(item.categoria || "Emergencia");
    setEditModalOpen(true);
  };

  const handleCloseEdit = () => {
    setEditModalOpen(false);
    setEditingItem(null);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    const montoNum = parseFloat(editMonto);
    if (!editDescripcion.trim() || isNaN(montoNum) || montoNum <= 0) {
      showToast("Ingresa una descripción y un monto válido mayor a 0.", "warning");
      return;
    }

    setEditLoading(true);
    try {
      if (isDemo) {
        updateDemoAhorro(editingItem.id, {
          descripcion: editDescripcion.trim(),
          monto: montoNum,
          moneda: editMoneda,
          categoria: editCategoria
        });
      } else {
        await updateAhorroUser(user.uid, editingItem.id, editingItem, {
          descripcion: editDescripcion.trim(),
          monto: montoNum,
          moneda: editMoneda,
          categoria: editCategoria
        });
      }

      showToast("Movimiento de ahorro actualizado con éxito.", "success");
      handleCloseEdit();
      cargarDatosAhorro();
      if (notifyMovementSaved) notifyMovementSaved();
    } catch (err) {
      console.error("Error al actualizar ahorro:", err);
      showToast("Error al guardar: " + err.message, "error");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteAhorro = async () => {
    if (!window.confirm("¿Seguro que deseas eliminar este movimiento de ahorro? Se reajustarán tus balances.")) {
      return;
    }

    setEditLoading(true);
    try {
      if (isDemo) {
        deleteDemoAhorro(editingItem.id);
      } else {
        await deleteAhorroUser(user.uid, editingItem.id, editingItem);
      }

      showToast("Movimiento eliminado correctamente.", "info");
      handleCloseEdit();
      cargarDatosAhorro();
      if (notifyMovementSaved) notifyMovementSaved();
    } catch (err) {
      console.error("Error al eliminar ahorro:", err);
      showToast("Error al eliminar: " + err.message, "error");
    } finally {
      setEditLoading(false);
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
              className="form-select form-select-sm select-year" 
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
            <div className="d-flex align-items-center gap-2">
              <span className="badge px-3 py-1 rounded-pill small" style={{ backgroundColor: "#fef0cd", color: "#854d0e" }}>
                {historialAhorros.length} registros
              </span>
              {historialAhorros.length > 0 && (
                <button 
                  type="button" 
                  className="btn btn-outline-success btn-sm d-flex align-items-center gap-1 shadow-sm"
                  onClick={() => exportAhorrosToCSV(historialAhorros)}
                  title="Exportar movimientos de ahorro a Excel (CSV)"
                >
                  <i className="bi bi-file-earmark-excel"></i>
                  <span>Exportar</span>
                </button>
              )}
            </div>
          </div>

          {historialAhorros.length === 0 ? (
            <div className="text-center py-4 text-muted small">
              No tienes movimientos de ahorro registrados aún.
            </div>
          ) : (
            <div className="list-group list-group-flush">
              {historialAhorros.slice(0, 12).map((h, idx) => {
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

                    <div className="d-flex align-items-center gap-3">
                      <div className={`fw-bold ${esExtraccion ? "text-danger" : "text-warning"}`}>
                        {esExtraccion ? "-" : "+"}{formatoMoneda(h.monto, moneda)}
                      </div>
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm rounded-circle d-flex align-items-center justify-content-center p-0"
                        style={{ width: "32px", height: "32px" }}
                        onClick={() => handleOpenEdit(h)}
                        title="Editar movimiento de ahorro"
                        aria-label="Editar ahorro"
                      >
                        <i className="bi bi-pencil" style={{ fontSize: "0.82rem" }}></i>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Modal de Edición de Ahorro */}
      {editModalOpen && editingItem && (
        <div 
          className="modal fade show d-block" 
          tabIndex="-1" 
          role="dialog"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.65)", zIndex: 1065 }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow-lg border-0 rounded-4">
              <div className="modal-header border-bottom pb-2">
                <h5 className="modal-title fw-bold text-dark d-flex align-items-center gap-2 fs-6">
                  <i className="bi bi-pencil-square text-warning"></i>
                  Editar Movimiento de Ahorro
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={handleCloseEdit}
                  disabled={editLoading}
                ></button>
              </div>

              <form onSubmit={handleSaveEdit}>
                <div className="modal-body py-3">
                  {/* Tipo de Operación y Período */}
                  <div className="d-flex justify-content-between align-items-center mb-3 p-2 rounded-3" style={{ backgroundColor: "var(--bg-card-alt)" }}>
                    <span className="small text-muted">
                      Operación: <strong className={editingItem.tipo === "extraccion" ? "text-danger" : "text-success"}>
                        {editingItem.tipo === "extraccion" ? "Extracción" : "Aporte Directo"}
                      </strong>
                    </span>
                    <span className="small text-muted">
                      Período: <strong>{editingItem.mes} {editingItem.anio}</strong>
                    </span>
                  </div>

                  {/* Moneda */}
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-muted mb-1 d-block">
                      Moneda
                    </label>
                    <div className="d-flex gap-2">
                      {MONEDAS.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          className={`btn btn-sm px-3 py-1 rounded-pill fw-semibold ${editMoneda === m.id ? 'btn-primary shadow-sm' : 'btn-outline-secondary'}`}
                          onClick={() => setEditMoneda(m.id)}
                          disabled={editLoading}
                        >
                          <span className="me-1">{m.flag}</span>
                          {m.id} ({m.simbolo})
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Categoría / Meta */}
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-muted mb-1 d-block">
                      Meta / Destino
                    </label>
                    <div className="d-flex flex-wrap gap-1">
                      {CATEGORIAS_AHORRO.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          className={`btn btn-sm px-2 py-1 rounded-pill d-flex align-items-center gap-1 small category-chip-btn ${editCategoria === cat.id ? 'active fw-bold border-2 shadow-sm' : 'opacity-85'}`}
                          style={{
                            backgroundColor: editCategoria === cat.id ? cat.bg : undefined,
                            color: editCategoria === cat.id ? cat.color : undefined,
                            borderColor: editCategoria === cat.id ? cat.border : undefined,
                            fontSize: "0.8rem"
                          }}
                          onClick={() => setEditCategoria(cat.id)}
                          disabled={editLoading}
                        >
                          <i className={`bi ${cat.icon}`}></i>
                          <span>{cat.nombre.split(" ")[0]}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Descripción */}
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-muted mb-1">
                      Descripción
                    </label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={editDescripcion}
                      onChange={(e) => setEditDescripcion(e.target.value)}
                      required
                      disabled={editLoading}
                    />
                  </div>

                  {/* Monto */}
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-muted mb-1">
                      Monto
                    </label>
                    <div className="input-group">
                      <span className="input-group-text fw-bold">
                        {MONEDAS.find((m) => m.id === editMoneda)?.simbolo || "$"}
                      </span>
                      <input 
                        type="number" 
                        step="0.01" 
                        min="0.01"
                        className="form-control fs-5 fw-bold text-warning" 
                        value={editMonto}
                        onChange={(e) => setEditMonto(e.target.value)}
                        required
                        disabled={editLoading}
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-top d-flex justify-content-between pt-2">
                  <button 
                    type="button" 
                    className="btn btn-outline-danger btn-sm"
                    onClick={handleDeleteAhorro}
                    disabled={editLoading}
                  >
                    <i className="bi bi-trash me-1"></i> Eliminar
                  </button>

                  <div className="d-flex gap-2">
                    <button 
                      type="button" 
                      className="btn btn-secondary btn-sm"
                      onClick={handleCloseEdit}
                      disabled={editLoading}
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-primary btn-sm px-3 fw-semibold shadow-sm"
                      disabled={editLoading}
                    >
                      {editLoading ? "Guardando..." : "Guardar Cambios"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
