import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { usePrivacy } from "../context/PrivacyContext";
import { getDemoResumenAnual } from "../services/demoData";
import { getResumenAnualUser } from "../services/dbService";
import { MESES, formatoNumber } from "../utils/formatters";
import Loader from "../components/Loader";
import MonthlyComparisonChart from "../components/charts/MonthlyComparisonChart";
import { exportResumenAnualToCSV, printFinancialReport } from "../utils/exportUtils";

export default function Resumen() {
  const { user, isDemo } = useAuth();
  const { showToast } = useToast();
  const { isPrivate, maskAmount } = usePrivacy();
  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear - 3, currentYear - 2, currentYear - 1, currentYear, currentYear + 1];
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
      <div className="principal d-flex align-items-center justify-content-center gap-3 p-3 rounded-4 shadow-sm border mb-4">
        <div className="d-flex align-items-center gap-2">
          <i className="bi bi-calendar4 text-primary"></i>
          <span className="fw-semibold text-dark">Año:</span>
          <select 
            className="form-select form-select-sm select-year" 
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
        <div className="principal text-center text-muted p-5 rounded-4 border shadow-sm" style={{ maxWidth: "600px" }}>
          <i className="bi bi-table fs-1 text-secondary opacity-50 mb-3 d-block"></i>
          <h5 className="text-dark fw-bold">Matriz Financiera Anual</h5>
          <p className="small mb-0">Selecciona el año que deseas auditar y haz clic en <strong>Consultar Resumen</strong> para ver la tabla comparativa de 12 meses.</p>
        </div>
      )}

      {!loading && resumenData && (
        <div className="principal w-100 p-4 rounded-4 shadow-sm border mt-2" style={{ maxWidth: "1280px" }}>
          <div className="print-header">
            <h1>FinTrack — Resumen Anual {anio}</h1>
            <p>Auditoría de 12 Meses | Total Ingresos: ${formatoNumber(resumenData.totalAnualIngresos)} | Total Gastos: ${formatoNumber(resumenData.totalAnualGastos)} | Total Ahorros: ${formatoNumber(resumenData.totalAnualAhorros)}</p>
          </div>

          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3 border-bottom pb-2">
            <h5 className="text-dark fw-bold mb-0 d-flex align-items-center gap-2">
              <i className="bi bi-graph-up-arrow text-success"></i>
              Resumen Financiero Anual — {anio}
            </h5>

            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 fw-semibold">
                12 Meses Auditados
              </span>
              <button 
                type="button" 
                className="btn btn-outline-success btn-sm d-flex align-items-center gap-1 no-print shadow-sm"
                onClick={() => exportResumenAnualToCSV(resumenData, anio)}
                title="Descargar matriz en Excel (CSV)"
              >
                <i className="bi bi-file-earmark-excel"></i>
                <span>Exportar Excel</span>
              </button>
              <button 
                type="button" 
                className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1 no-print shadow-sm"
                onClick={printFinancialReport}
                title="Imprimir reporte anual o guardar en PDF"
              >
                <i className="bi bi-printer"></i>
                <span>PDF / Imprimir</span>
              </button>
            </div>
          </div>

          <div className={`mb-4 p-3 resumen-chart-container rounded-3 ${isPrivate ? "privacy-blur" : ""}`} style={{ height: "300px" }}>
            <MonthlyComparisonChart 
              ingresosMensuales={resumenData.ingresosMensuales || []}
              gastosMensuales={resumenData.gastosMensuales || []}
              ahorrosMensuales={resumenData.ahorrosMensuales || []}
              anio={anio}
            />
          </div>

          <div className="table-responsive">
            <table className="table table-bordered text-center align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th scope="col" className="text-start text-muted small" style={{ minWidth: "170px" }}>Concepto / Mes</th>
                {MESES.map((m) => (
                  <th key={m} scope="col" className="small">{m.substring(0, 3)}</th>
                ))}
                <th scope="col" className="resumen-th-total fw-bold">Total Anual</th>
              </tr>
            </thead>
            <tbody>
              <tr className="row-resto-anterior">
                <th scope="row" className="text-start text-muted small">Resto Mes Anterior</th>
                {resumenData.restosMesAnterior.map((val, idx) => (
                  <td key={idx} className={`small text-muted ${isPrivate ? "privacy-masked" : ""}`}>
                    {maskAmount(`$${formatoNumber(val)}`)}
                  </td>
                ))}
                <td className="fw-bold text-muted">-</td>
              </tr>

              <tr className="row-resumen-ingreso">
                <th scope="row" className="text-start text-success fw-bold">
                  <i className="bi bi-arrow-up-short"></i> Ingresos
                </th>
                {resumenData.ingresosMensuales.map((val, idx) => (
                  <td key={idx} className={`text-success fw-bold ${isPrivate ? "privacy-masked" : ""}`}>
                    {maskAmount(`$${formatoNumber(val)}`)}
                  </td>
                ))}
                <td className={`fw-bold text-success fs-6 ${isPrivate ? "privacy-masked" : ""}`}>
                  {maskAmount(`$${formatoNumber(resumenData.totalAnualIngresos)}`)}
                </td>
              </tr>

              <tr className="row-resumen-gasto">
                <th scope="row" className="text-start text-danger fw-bold">
                  <i className="bi bi-arrow-down-short"></i> Gastos
                </th>
                {resumenData.gastosMensuales.map((val, idx) => (
                  <td key={idx} className={`text-danger fw-bold ${isPrivate ? "privacy-masked" : ""}`}>
                    {maskAmount(`$${formatoNumber(val)}`)}
                  </td>
                ))}
                <td className={`fw-bold text-danger fs-6 ${isPrivate ? "privacy-masked" : ""}`}>
                  {maskAmount(`$${formatoNumber(resumenData.totalAnualGastos)}`)}
                </td>
              </tr>

              <tr className="row-resumen-ahorro">
                <th scope="row" className="text-start text-warning fw-bold">
                  <i className="bi bi-piggy-bank"></i> Ahorros
                </th>
                {resumenData.ahorrosMensuales.map((val, idx) => (
                  <td key={idx} className={`text-warning fw-bold ${isPrivate ? "privacy-masked" : ""}`}>
                    {maskAmount(`$${formatoNumber(val)}`)}
                  </td>
                ))}
                <td className={`fw-bold text-warning fs-6 ${isPrivate ? "privacy-masked" : ""}`}>
                  {maskAmount(`$${formatoNumber(resumenData.totalAnualAhorros)}`)}
                </td>
              </tr>

              <tr className="row-resumen-resto table-light">
                <th scope="row" className="text-start text-dark fw-bold">
                  <i className="bi bi-wallet2 text-success me-1"></i> Resto Neto
                </th>
                {resumenData.restosTotales.map((val, idx) => (
                  <td key={idx} className={`fw-bold ${val >= 0 ? "text-dark" : "text-danger"} ${isPrivate ? "privacy-masked" : ""}`}>
                    {maskAmount(`$${formatoNumber(val)}`)}
                  </td>
                ))}
                <td className="text-muted">-</td>
              </tr>
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}
