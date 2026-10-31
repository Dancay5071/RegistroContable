// src/pages/Ahorro.jsx
import React, { useState } from "react";
import { doc, getDoc, setDoc, addDoc, arrayUnion, increment } from "firebase/firestore";
import { 
  ahorrosPorMes, 
  extraccionPorMes, 
  extraccionCollection, 
  actualizarAhorroActual 
} from "../services/firebase";
import { useBalance } from "../context/BalanceContext";
import { MESES, formatoMoneda, formatoNumber } from "../utils/formatters";
import BalanceDisplay from "../components/BalanceDisplay";
import Loader from "../components/Loader";

export default function Ahorro() {
  const { totalAhorros } = useBalance();
  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear - 1, currentYear, currentYear + 1];

  const [anio, setAnio] = useState(currentYear);
  const [tablaAhorros, setTablaAhorros] = useState(null);
  const [loading, setLoading] = useState(false);

  // Modal Extracción
  const [modalExtraccionOpen, setModalExtraccionOpen] = useState(false);
  const [montoExtraccion, setMontoExtraccion] = useState("");
  const [mesExtraccion, setMesExtraccion] = useState(MESES[new Date().getMonth()]);
  const [alertaExtraccion, setAlertaExtraccion] = useState({ tipo: "", mensaje: "" });
  const [loadingExtraccion, setLoadingExtraccion] = useState(false);

  // Modal Agregar Ahorro
  const [modalAgregarOpen, setModalAgregarOpen] = useState(false);
  const [montoAgregar, setMontoAgregar] = useState("");
  const [mesAgregar, setMesAgregar] = useState(MESES[new Date().getMonth()]);
  const [alertaAgregar, setAlertaAgregar] = useState({ tipo: "", mensaje: "" });
  const [loadingAgregar, setLoadingAgregar] = useState(false);

  const consultarAhorro = async () => {
    setLoading(true);
    let netosPorMes = [];

    for (const mes of MESES) {
      const claveMesAño = `${mes}_${anio}`;
      const docRef = doc(ahorrosPorMes, claveMesAño);
      const extraccionRef = doc(extraccionPorMes, claveMesAño);

      let ahorros = 0;
      let extracciones = 0;

      try {
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          ahorros = snap.data().totalAhorros || 0;
        }

        const snapExtracciones = await getDoc(extraccionRef);
        if (snapExtracciones.exists()) {
          const dataExtracciones = snapExtracciones.data();
          // Extracciones are stored as negative amounts (e.g. -500), so sum -ext.monto
          extracciones = dataExtracciones.extraccion?.reduce(
            (sum, ext) => sum + (ext.monto < 0 ? -ext.monto : ext.monto), 
            0
          ) || 0;
        }
      } catch (error) {
        console.error(`Error al obtener datos de ahorro del mes ${mes}:`, error);
      }

      const ahorrosNetos = ahorros - extracciones;
      netosPorMes.push({ mes, monto: ahorrosNetos });
    }

    setTablaAhorros(netosPorMes);
    setLoading(false);
  };

  const handleExtraerAhorro = async (e) => {
    e.preventDefault();
    const montoNum = parseFloat(montoExtraccion);

    if (isNaN(montoNum) || montoNum <= 0) {
      setAlertaExtraccion({ tipo: "danger", mensaje: "Por favor, ingresa un monto válido." });
      return;
    }

    setLoadingExtraccion(true);
    const claveMesAño = `${mesExtraccion}_${anio}`;
    const data = { monto: -montoNum, fecha: new Date() };

    try {
      await addDoc(extraccionCollection, data);
      await actualizarAhorroActual(-montoNum);

      const extraccionMesDoc = doc(extraccionPorMes, claveMesAño);
      await setDoc(extraccionMesDoc, { extraccion: arrayUnion(data) }, { merge: true });

      setAlertaExtraccion({ tipo: "success", mensaje: "Extracción registrada con éxito." });
      setMontoExtraccion("");
      setTimeout(() => {
        setModalExtraccionOpen(false);
        setAlertaExtraccion({ tipo: "", mensaje: "" });
        if (tablaAhorros) consultarAhorro();
      }, 1500);
    } catch (error) {
      console.error("Error al registrar extracción:", error);
      setAlertaExtraccion({ tipo: "danger", mensaje: "Error al registrar la extracción." });
    } finally {
      setLoadingExtraccion(false);
    }
  };

  const handleAgregarAhorro = async (e) => {
    e.preventDefault();
    const montoNum = parseFloat(montoAgregar);

    if (isNaN(montoNum) || montoNum <= 0) {
      setAlertaAgregar({ tipo: "danger", mensaje: "Por favor, ingresa un monto válido." });
      return;
    }

    setLoadingAgregar(true);
    const claveMesAño = `${mesAgregar}_${anio}`;

    try {
      const ahorroMesDoc = doc(ahorrosPorMes, claveMesAño);
      await setDoc(ahorroMesDoc, { totalAhorros: increment(montoNum) }, { merge: true });
      await actualizarAhorroActual(montoNum);

      setAlertaAgregar({ tipo: "success", mensaje: "Ahorro agregado con éxito." });
      setMontoAgregar("");
      setTimeout(() => {
        setModalAgregarOpen(false);
        setAlertaAgregar({ tipo: "", mensaje: "" });
        if (tablaAhorros) consultarAhorro();
      }, 1500);
    } catch (error) {
      console.error("Error al agregar ahorro:", error);
      setAlertaAgregar({ tipo: "danger", mensaje: "Error al agregar el ahorro." });
    } finally {
      setLoadingAgregar(false);
    }
  };

  return (
    <div className="fade-in d-flex flex-column align-items-center flex-grow-1 p-3 position-relative">
      <div className="container d-flex flex-column align-items-center">
        {/* Tarjeta de Control de Ahorro */}
        <div className="tarjeta-ahorro shadow rounded p-3 w-100" style={{ maxWidth: "550px", height: "auto" }}>
          <div className="card-header d-flex align-items-center justify-content-between p-2 rounded bg-light mb-3">
            <h5 className="mb-0 fs-6 fw-bold" id="totalAhorros">
              Ahorro Actual: <span className="text-success">{formatoMoneda(totalAhorros)}</span>
            </h5>
            <div className="d-flex align-items-center gap-2">
              <label htmlFor="anioAhorro" className="small mb-0">Año:</label>
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

          <div className="card-body d-flex flex-wrap justify-content-center gap-2 p-0 mt-2">
            <button 
              className="btn btn-secondary btn-sm px-3" 
              type="button" 
              onClick={consultarAhorro}
              disabled={loading}
            >
              Consultar
            </button>
            <button 
              className="btn btn-secondary btn-sm px-3" 
              type="button" 
              onClick={() => setModalExtraccionOpen(true)}
            >
              Extraer
            </button>
            <button 
              className="btn btn-secondary btn-sm px-3" 
              type="button" 
              onClick={() => setModalAgregarOpen(true)}
            >
              Agregar ahorro
            </button>
          </div>
        </div>

        {/* Spinner */}
        {loading && <Loader />}

        {/* Tabla de Ahorros Anual */}
        {!loading && tablaAhorros && (
          <div className="table-responsive mt-4 w-100 p-3 bg-white rounded shadow" style={{ maxWidth: "1000px" }}>
            <h5 className="mb-3 text-center">Ahorros del año {anio}</h5>
            <table className="table table-bordered table-striped text-center align-middle mb-0">
              <thead className="table-dark">
                <tr>
                  <th scope="col">Concepto</th>
                  {tablaAhorros.map((item) => (
                    <th key={item.mes} scope="col">{item.mes}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row" className="table-secondary">Ahorros</th>
                  {tablaAhorros.map((item) => (
                    <td key={item.mes}>${formatoNumber(item.monto)}</td>
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
          style={{ backgroundColor: "rgba(0, 0, 0, 0.6)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content text-dark">
              <div className="modal-header">
                <h5 className="modal-title">Registrar Extracción</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setModalExtraccionOpen(false)}
                  disabled={loadingExtraccion}
                ></button>
              </div>
              <form onSubmit={handleExtraerAhorro}>
                <div className="modal-body">
                  {alertaExtraccion.mensaje && (
                    <div className={`alert alert-${alertaExtraccion.tipo}`} role="alert">
                      {alertaExtraccion.mensaje}
                    </div>
                  )}
                  <div className="mb-3">
                    <label className="form-label">Monto</label>
                    <input 
                      type="number" 
                      step="0.01"
                      min="0.01"
                      className="form-control" 
                      placeholder="Monto a extraer"
                      value={montoExtraccion}
                      onChange={(e) => setMontoExtraccion(e.target.value)}
                      required
                      disabled={loadingExtraccion}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Mes</label>
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
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setModalExtraccionOpen(false)}
                    disabled={loadingExtraccion}
                  >
                    Cerrar
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-danger"
                    disabled={loadingExtraccion}
                  >
                    {loadingExtraccion ? "Procesando..." : "Realizar extracción"}
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
          style={{ backgroundColor: "rgba(0, 0, 0, 0.6)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content text-dark">
              <div className="modal-header">
                <h5 className="modal-title">Nuevo ahorro</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setModalAgregarOpen(false)}
                  disabled={loadingAgregar}
                ></button>
              </div>
              <form onSubmit={handleAgregarAhorro}>
                <div className="modal-body">
                  {alertaAgregar.mensaje && (
                    <div className={`alert alert-${alertaAgregar.tipo}`} role="alert">
                      {alertaAgregar.mensaje}
                    </div>
                  )}
                  <div className="mb-3">
                    <label className="form-label">Monto</label>
                    <input 
                      type="number" 
                      step="0.01"
                      min="0.01"
                      className="form-control" 
                      placeholder="Monto a agregar"
                      value={montoAgregar}
                      onChange={(e) => setMontoAgregar(e.target.value)}
                      required
                      disabled={loadingAgregar}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Mes</label>
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
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setModalAgregarOpen(false)}
                    disabled={loadingAgregar}
                  >
                    Cerrar
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-success"
                    disabled={loadingAgregar}
                  >
                    {loadingAgregar ? "Guardando..." : "Agregar ahorro"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <BalanceDisplay />
    </div>
  );
}

