// src/pages/Resumen.jsx
import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { getDemoResumenAnual } from "../services/demoData";
import { getResumenAnualUser } from "../services/dbService";
import { MESES, formatoNumber } from "../utils/formatters";
import Loader from "../components/Loader";

export default function Resumen() {
  const { user, isDemo } = useAuth();
  const { showToast } = useToast();
  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear - 1, currentYear, currentYear + 1];
  const [anio, setAnio] = useState(currentYear);
  const [resumenData, setResumenData] = useState(null);
  const [loading, setLoading] = useState(false);

  const consultarResumenAnual = async () => {
    setLoading(true);

    try {
      if (isDemo) {
        const data = getDemoResumenAnual(anio);
        setResumenData(data);
      } else {
        const data = await getResumenAnualUser(user.uid, anio);
        setResumenData(data);
      }
    } catch (error) {
      console.error("Error al obtener resumen anual:", error);
      showToast("Error al consultar el resumen anual: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in d-flex flex-column align-items-center flex-grow-1 p-3">
      {/* Selector de Año y Botón */}
      <div className="d-flex align-items-center justify-content-center gap-3 p-3 bg-dark bg-opacity-75 rounded-4 shadow border border-secondary border-opacity-25 mb-4">
        <div className="d-flex align-items-center gap-2">
          <i className="bi bi-calendar4 text-primary"></i>
          <span className="fw-semibold text-white">Año:</span>
          <select 
            className="form-select form-select-sm w-auto" 
            id="anioSelect"
            value={anio}
            onChange={(e) => setAnio(Number(e.target.value))}
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <button 
          className="btn btn-primary btn-sm px-4 fw-semibold shadow-sm" 
          type="button" 
          onClick={consultarResumenAnual}
          disabled={loading}
        >
          <i className="bi bi-bar-chart-line me-1"></i>
          {loading ? "Calculando..." : "Consultar Resumen"}
        </button>
      </div>

      {loading && <Loader message="Procesando resumen anual..." />}

      {!loading && !resumenData && (
        <div className="text-center text-muted p-5 bg-dark bg-opacity-50 rounded-4 border border-secondary border-opacity-25" style={{ maxWidth: "600px" }}>
          <i className="bi bi-table fs-1 text-secondary opacity-50 mb-3 d-block"></i>
          <h5 className="text-white">Matriz Financiera Anual</h5>
          <p className="small mb-0">Selecciona el año que deseas auditar y haz clic en <strong>Consultar Resumen</strong> para ver la tabla comparativa de 12 meses.</p>
        </div>
      )}

      {!loading && resumenData && (
        <div className="w-100 p-4 bg-dark bg-opacity-75 rounded-4 shadow-lg border border-secondary border-opacity-25 table-responsive mt-2" style={{ maxWidth: "1280px" }}>
          <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
            <h5 className="text-white fw-bold mb-0 d-flex align-items-center gap-2">
              <i className="bi bi-graph-up-arrow text-success"></i>
              Resumen Financiero Anual — {anio}
            </h5>
            <span className="badge bg-primary bg-opacity-25 text-primary px-3 py-2">
              12 Meses Auditados
            </span>
          </div>

          <table className="table table-bordered text-center align-middle mb-0">
            <thead className="table-dark">
              <tr>
                <th scope="col" className="text-start text-muted small" style={{ minWidth: "170px" }}>Concepto / Mes</th>
                {MESES.map((m) => (
                  <th key={m} scope="col" className="small">{m.substring(0, 3)}</th>
                ))}
                <th scope="col" className="bg-primary bg-opacity-25 text-white">Total Anual</th>
              </tr>
            </thead>
            <tbody>
              {/* Resto Mes Anterior */}
              <tr>
                <th scope="row" className="text-start text-muted small">Resto Mes Anterior</th>
                {resumenData.restosMesAnterior.map((val, idx) => (
                  <td key={idx} className="small text-muted">${formatoNumber(val)}</td>
                ))}
                <td className="fw-bold text-muted">-</td>
              </tr>

              {/* Ingresos */}
              <tr style={{ backgroundColor: "rgba(16, 185, 129, 0.08)" }}>
                <th scope="row" className="text-start text-success fw-bold">
                  <i className="bi bi-arrow-up-short"></i> Ingresos
                </th>
                {resumenData.ingresosMensuales.map((val, idx) => (
                  <td key={idx} className="text-success fw-semibold">${formatoNumber(val)}</td>
                ))}
                <td className="fw-bold text-success fs-6">${formatoNumber(resumenData.totalAnualIngresos)}</td>
              </tr>

              {/* Gastos */}
              <tr style={{ backgroundColor: "rgba(244, 63, 94, 0.08)" }}>
                <th scope="row" className="text-start text-danger fw-bold">
                  <i className="bi bi-arrow-down-short"></i> Gastos
                </th>
                {resumenData.gastosMensuales.map((val, idx) => (
                  <td key={idx} className="text-danger fw-semibold">${formatoNumber(val)}</td>
                ))}
                <td className="fw-bold text-danger fs-6">${formatoNumber(resumenData.totalAnualGastos)}</td>
              </tr>

              {/* Ahorros */}
              <tr style={{ backgroundColor: "rgba(99, 102, 241, 0.08)" }}>
                <th scope="row" className="text-start text-info fw-bold">
                  <i className="bi bi-piggy-bank"></i> Ahorros
                </th>
                {resumenData.ahorrosMensuales.map((val, idx) => (
                  <td key={idx} className="text-info fw-semibold">${formatoNumber(val)}</td>
                ))}
                <td className="fw-bold text-info fs-6">${formatoNumber(resumenData.totalAnualAhorros)}</td>
              </tr>

              {/* Resto Total */}
              <tr className="table-dark">
                <th scope="row" className="text-start text-white fw-bold">
                  <i className="bi bi-wallet2 text-warning me-1"></i> Resto Neto
                </th>
                {resumenData.restosTotales.map((val, idx) => (
                  <td key={idx} className={`fw-bold ${val >= 0 ? "text-white" : "text-danger"}`}>
                    ${formatoNumber(val)}
                  </td>
                ))}
                <td className="text-muted">-</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
