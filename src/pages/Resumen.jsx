// src/pages/Resumen.jsx
import React, { useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { gastosPorMes, ingresosPorMes, ahorrosPorMes } from "../services/firebase";
import { MESES, formatoNumber } from "../utils/formatters";
import BalanceDisplay from "../components/BalanceDisplay";
import Loader from "../components/Loader";

export default function Resumen() {
  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear - 1, currentYear, currentYear + 1];
  const [anio, setAnio] = useState(currentYear);
  const [resumenData, setResumenData] = useState(null);
  const [loading, setLoading] = useState(false);

  const consultarResumenAnual = async () => {
    setLoading(true);

    const ingresosMensuales = [];
    const gastosMensuales = [];
    const ahorrosMensuales = [];
    const restosMesAnterior = [];
    const restosTotales = [];

    let totalAnualIngresos = 0;
    let totalAnualGastos = 0;
    let totalAnualAhorros = 0;

    for (let i = 0; i < MESES.length; i++) {
      const mes = MESES[i];
      const claveMesAño = `${mes}_${anio}`;
      const ingresosDoc = doc(ingresosPorMes, claveMesAño);
      const gastosDoc = doc(gastosPorMes, claveMesAño);
      const ahorrosDoc = doc(ahorrosPorMes, claveMesAño);

      let sumaIngresos = 0;
      let sumaGastos = 0;
      let sumaAhorros = 0;

      // 1. Ingresos
      try {
        const snap = await getDoc(ingresosDoc);
        if (snap.exists()) {
          const lista = snap.data().ingresos || [];
          sumaIngresos = lista.reduce((acc, item) => acc + (item.monto || 0), 0);
        }
      } catch (err) {
        console.error(`Error ingresos ${mes}:`, err);
      }
      ingresosMensuales.push(sumaIngresos);
      totalAnualIngresos += sumaIngresos;

      // 2. Gastos
      try {
        const snap = await getDoc(gastosDoc);
        if (snap.exists()) {
          const lista = snap.data().gastos || [];
          sumaGastos = lista.reduce((acc, item) => acc + (item.monto || 0), 0);
        }
      } catch (err) {
        console.error(`Error gastos ${mes}:`, err);
      }
      gastosMensuales.push(sumaGastos);
      totalAnualGastos += sumaGastos;

      // 3. Ahorros
      try {
        const snap = await getDoc(ahorrosDoc);
        if (snap.exists()) {
          sumaAhorros = snap.data().totalAhorros || 0;
        }
      } catch (err) {
        console.error(`Error ahorros ${mes}:`, err);
      }
      ahorrosMensuales.push(sumaAhorros);
      totalAnualAhorros += sumaAhorros;

      // 4. Resto Mes Anterior & Resto Total
      let restoAnterior = 0;
      if (i === 0) {
        restoAnterior = 0;
      } else {
        restoAnterior = ingresosMensuales[i - 1] - gastosMensuales[i - 1] + restosMesAnterior[i - 1];
      }
      restosMesAnterior.push(restoAnterior);

      const restoTotalMes = sumaIngresos - sumaGastos + restoAnterior;
      restosTotales.push(restoTotalMes);
    }

    setResumenData({
      ingresosMensuales,
      gastosMensuales,
      ahorrosMensuales,
      restosMesAnterior,
      restosTotales,
      totalAnualIngresos,
      totalAnualGastos,
      totalAnualAhorros
    });

    setLoading(false);
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

