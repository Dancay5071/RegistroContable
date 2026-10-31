// src/pages/Ahorro.jsx
import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useBalance } from "../context/BalanceContext";
import { useToast } from "../context/ToastContext";
import { 
  getDemoAhorrosPorMes, 
  addDemoAhorro, 
  addDemoExtraccion 
} from "../services/demoData";
import { 
  getAhorrosYearUser, 
  addAhorroDirectoUser, 
  addExtraccionUser 
} from "../services/dbService";
import { MESES, formatoMoneda, formatoNumber } from "../utils/formatters";
import Loader from "../components/Loader";

export default function Ahorro() {
  const { user, isDemo } = useAuth();
  const { totalAhorros } = useBalance();
  const { showToast } = useToast();
  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear - 1, currentYear, currentYear + 1];

  const [anio, setAnio] = useState(currentYear);
  const [tablaAhorros, setTablaAhorros] = useState(null);
  const [loading, setLoading] = useState(false);

  // Modal Extracción
  const [modalExtraccionOpen, setModalExtraccionOpen] = useState(false);
  const [montoExtraccion, setMontoExtraccion] = useState("");
  const [mesExtraccion, setMesExtraccion] = useState(MESES[new Date().getMonth()]);
  const [loadingExtraccion, setLoadingExtraccion] = useState(false);

  // Modal Agregar Ahorro
  const [modalAgregarOpen, setModalAgregarOpen] = useState(false);
  const [montoAgregar, setMontoAgregar] = useState("");
  const [mesAgregar, setMesAgregar] = useState(MESES[new Date().getMonth()]);
  const [loadingAgregar, setLoadingAgregar] = useState(false);

  const consultarAhorro = async () => {
    setLoading(true);

    try {
      if (isDemo) {
        const netos = getDemoAhorrosPorMes(anio);
        setTablaAhorros(netos);
      } else {
        const netos = await getAhorrosYearUser(user.uid, anio);
        setTablaAhorros(netos);
      }
    } catch (error) {
      console.error("Error al consultar ahorros:", error);
      showToast("Error al obtener datos de ahorro: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleExtraerAhorro = async (e) => {
    e.preventDefault();
    const montoNum = parseFloat(montoExtraccion);

    if (isNaN(montoNum) || montoNum <= 0) {
      showToast("Por favor ingresa un monto válido mayor a 0.", "warning");
      return;
    }

    setLoadingExtraccion(true);

    try {
      if (isDemo) {
        addDemoExtraccion(mesExtraccion, anio, montoNum);
      } else {
        await addExtraccionUser(user.uid, {
          mes: mesExtraccion,
          anio,
          monto: montoNum
        });
      }

      showToast("Extracción registrada con éxito.", "success");
      setMontoExtraccion("");
      setModalExtraccionOpen(false);
      if (tablaAhorros) consultarAhorro();
    } catch (error) {
      console.error("Error al registrar extracción:", error);
      showToast("Error al registrar la extracción: " + error.message, "error");
    } finally {
      setLoadingExtraccion(false);
    }
  };

  const handleAgregarAhorro = async (e) => {
    e.preventDefault();
    const montoNum = parseFloat(montoAgregar);

    if (isNaN(montoNum) || montoNum <= 0) {
      showToast("Por favor ingresa un monto válido mayor a 0.", "warning");
      return;
    }

    setLoadingAgregar(true);

    try {
      if (isDemo) {
        addDemoAhorro(mesAgregar, anio, montoNum);
      } else {
        await addAhorroDirectoUser(user.uid, {
          mes: mesAgregar,
          anio,
          monto: montoNum
        });
      }

      showToast("Ahorro agregado con éxito.", "success");
      setMontoAgregar("");
      setModalAgregarOpen(false);
      if (tablaAhorros) consultarAhorro();
    } catch (error) {
      console.error("Error al agregar ahorro:", error);
      showToast("Error al agregar el ahorro: " + error.message, "error");
    } finally {
      setLoadingAgregar(false);
    }
  };

  return (
    <div className="fade-in d-flex flex-column align-items-center flex-grow-1 p-3">
      <div className="container d-flex flex-column align-items-center" style={{ maxWidth: "1000px" }}>
        {/* Tarjeta de Control de Ahorro */}
        <div className="tarjeta-ahorro shadow-lg rounded-4 p-4 w-100 border mb-4">
          <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between pb-3 mb-3 border-bottom gap-2">
            <div>
              <span className="text-muted small text-uppercase fw-semibold tracking-wider d-block">Fondo de Ahorro Total</span>
              <h3 className="h2 fw-bold text-info mb-0">{formatoMoneda(totalAhorros)}</h3>
            </div>
            <div className="d-flex align-items-center gap-2">
              <label htmlFor="anioAhorro" className="small text-muted mb-0">Año:</label>
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
            </div>
          </div>

          <div className="d-flex flex-wrap justify-content-center gap-2 pt-2">
            <button 
              className="btn btn-primary px-4 fw-semibold shadow-sm" 
              type="button" 
              onClick={consultarAhorro}
              disabled={loading}
            >
              <i className="bi bi-search me-1"></i> Consultar Año
            </button>
            <button 
              className="btn btn-outline-danger px-4 fw-semibold" 
              type="button" 
              onClick={() => setModalExtraccionOpen(true)}
            >
              <i className="bi bi-dash-circle me-1"></i> Extraer
            </button>
            <button 
              className="btn btn-success px-4 fw-semibold shadow-sm" 
              type="button" 
              onClick={() => setModalAgregarOpen(true)}
            >
              <i className="bi bi-plus-circle me-1"></i> Agregar ahorro
            </button>
          </div>
        </div>

        {/* Spinner */}
        {loading && <Loader />}

        {/* Tabla de Ahorros Anual */}
        {!loading && tablaAhorros && (
          <div className="table-responsive w-100 p-4 bg-dark bg-opacity-75 rounded-4 shadow-lg border border-secondary border-opacity-25">
            <h5 className="mb-3 text-center text-white fw-bold">Evolución de Ahorros del Año {anio}</h5>
            <table className="table table-bordered text-center align-middle mb-0">
              <thead className="table-dark">
                <tr>
                  <th scope="col" className="text-muted small">Concepto</th>
                  {tablaAhorros.map((item) => (
                    <th key={item.mes} scope="col" className="small">{item.mes}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row" className="text-start text-info">Ahorros Netos</th>
                  {tablaAhorros.map((item) => (
                    <td key={item.mes} className={item.monto > 0 ? "text-info fw-bold" : "text-muted"}>
                      ${formatoNumber(item.monto)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Extracción */}
      {modalExtraccionOpen && (
        <div 
          className="modal fade show d-block" 
          tabIndex="-1" 
          role="dialog"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.75)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content bg-dark text-white border border-secondary shadow-lg">
              <div className="modal-header border-bottom border-secondary">
                <h5 className="modal-title text-danger d-flex align-items-center gap-2">
                  <i className="bi bi-box-arrow-up-right"></i> Registrar Extracción
                </h5>
                <button 
                  type="button" 
                  className="btn-close btn-close-white" 
                  onClick={() => setModalExtraccionOpen(false)}
                  disabled={loadingExtraccion}
                ></button>
              </div>
              <form onSubmit={handleExtraerAhorro}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label text-muted small">Monto a Extraer ($)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      min="0.01"
                      className="form-control fs-5 text-danger fw-bold" 
                      placeholder="0.00"
                      value={montoExtraccion}
                      onChange={(e) => setMontoExtraccion(e.target.value)}
                      required
                      disabled={loadingExtraccion}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-muted small">Mes</label>
                    <select 
                      className="form-select" 
                      value={mesExtraccion}
                      onChange={(e) => setMesExtraccion(e.target.value)}
                      disabled={loadingExtraccion}
                    >
                      {MESES.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="modal-footer border-top border-secondary">
                  <button 
                    type="button" 
                    className="btn btn-secondary btn-sm" 
                    onClick={() => setModalExtraccionOpen(false)}
                    disabled={loadingExtraccion}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-danger btn-sm fw-semibold"
                    disabled={loadingExtraccion}
                  >
                    {loadingExtraccion ? "Procesando..." : "Confirmar Extracción"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Agregar Ahorro */}
      {modalAgregarOpen && (
        <div 
          className="modal fade show d-block" 
          tabIndex="-1" 
          role="dialog"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.75)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content bg-dark text-white border border-secondary shadow-lg">
              <div className="modal-header border-bottom border-secondary">
                <h5 className="modal-title text-success d-flex align-items-center gap-2">
                  <i className="bi bi-piggy-bank-fill"></i> Agregar Ahorro
                </h5>
                <button 
                  type="button" 
                  className="btn-close btn-close-white" 
                  onClick={() => setModalAgregarOpen(false)}
                  disabled={loadingAgregar}
                ></button>
              </div>
              <form onSubmit={handleAgregarAhorro}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label text-muted small">Monto a Depositar ($)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      min="0.01"
                      className="form-control fs-5 text-success fw-bold" 
                      placeholder="0.00"
                      value={montoAgregar}
                      onChange={(e) => setMontoAgregar(e.target.value)}
                      required
                      disabled={loadingAgregar}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-muted small">Mes</label>
                    <select 
                      className="form-select" 
                      value={mesAgregar}
                      onChange={(e) => setMesAgregar(e.target.value)}
                      disabled={loadingAgregar}
                    >
                      {MESES.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="modal-footer border-top border-secondary">
                  <button 
                    type="button" 
                    className="btn btn-secondary btn-sm" 
                    onClick={() => setModalAgregarOpen(false)}
                    disabled={loadingAgregar}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-success btn-sm fw-semibold"
                    disabled={loadingAgregar}
                  >
                    {loadingAgregar ? "Guardando..." : "Confirmar Ahorro"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
