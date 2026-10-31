// src/pages/Resumen.jsx
import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getDemoResumenAnual } from "../services/demoData";
import { getResumenAnualUser } from "../services/dbService";
import { MESES, formatoNumber } from "../utils/formatters";
import BalanceDisplay from "../components/BalanceDisplay";
import Loader from "../components/Loader";

export default function Resumen() {
  const { user, isDemo } = useAuth();
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
      alert("Error al consultar el resumen anual: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in d-flex flex-column align-items-center flex-grow-1 p-3 position-relative">
      {/* Selector de Año y Botón */}
      <div className="containerResumen d-flex align-items-center justify-content-center gap-3 p-3 bg-white bg-opacity-75 rounded shadow mb-3">
        <div className="input-group-content d-flex align-items-center gap-2">
          <h4 className="mb-0">Resumen:</h4>
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
          className="btn btn-secondary btn-sm px-4" 
          type="button" 
          onClick={consultarResumenAnual}
          disabled={loading}
        >
          {loading ? "Cargando..." : "Consultar"}
        </button>
      </div>

      {loading && <Loader />}

      {!loading && !resumenData && (
        <div className="text-center text-white bg-dark bg-opacity-50 p-4 rounded mt-3">
          <p className="mb-0">Selecciona el año y presiona <strong>Consultar</strong> para ver el resumen anual completo.</p>
        </div>
      )}

      {!loading && resumenData && (
        <div className="w-100 p-3 bg-white rounded shadow table-responsive mt-2" style={{ maxWidth: "1200px" }}>
          <h5 className="text-center mb-3">Resumen Financiero Anual - {anio}</h5>
          <table className="table table-striped table-hover table-bordered text-center align-middle mb-0">
            <thead className="table-dark">
              <tr>
                <th scope="col" style={{ minWidth: "160px" }}>Meses</th>
                {MESES.map((m) => (
                  <th key={m} scope="col">{m}</th>
                ))}
                <th scope="col" className="table-primary text-dark">Total Anual</th>
              </tr>
            </thead>
            <tbody>
              {/* Resto Mes Anterior */}
              <tr>
                <th scope="row" className="text-start">Resto Mes Anterior</th>
                {resumenData.restosMesAnterior.map((val, idx) => (
                  <td key={idx}>${formatoNumber(val)}</td>
                ))}
                <td className="fw-bold">-</td>
              </tr>

              {/* Ingresos */}
              <tr className="table-success bg-opacity-25">
                <th scope="row" className="text-start text-success">Ingresos</th>
                {resumenData.ingresosMensuales.map((val, idx) => (
                  <td key={idx}>${formatoNumber(val)}</td>
                ))}
                <td className="fw-bold text-success">${formatoNumber(resumenData.totalAnualIngresos)}</td>
              </tr>

              {/* Gastos */}
              <tr className="table-danger bg-opacity-25">
                <th scope="row" className="text-start text-danger">Gastos</th>
                {resumenData.gastosMensuales.map((val, idx) => (
                  <td key={idx}>${formatoNumber(val)}</td>
                ))}
                <td className="fw-bold text-danger">${formatoNumber(resumenData.totalAnualGastos)}</td>
              </tr>

              {/* Ahorros */}
              <tr className="table-info bg-opacity-25">
                <th scope="row" className="text-start text-primary">Ahorros</th>
                {resumenData.ahorrosMensuales.map((val, idx) => (
                  <td key={idx}>${formatoNumber(val)}</td>
                ))}
                <td className="fw-bold text-primary">${formatoNumber(resumenData.totalAnualAhorros)}</td>
              </tr>

              {/* Resto Total */}
              <tr className="table-secondary fw-bold">
                <th scope="row" className="text-start">Resto Total</th>
                {resumenData.restosTotales.map((val, idx) => (
                  <td key={idx}>${formatoNumber(val)}</td>
                ))}
                <td>-</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <BalanceDisplay />
    </div>
  );
}
