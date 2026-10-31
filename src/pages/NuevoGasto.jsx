// src/pages/NuevoGasto.jsx
import React, { useState } from "react";
import { addDoc, arrayUnion, doc, setDoc } from "firebase/firestore";
import { gastosCollection, gastosPorMes, actualizarMontoActual } from "../services/firebase";
import { useAuth } from "../context/AuthContext";
import { addDemoGasto } from "../services/demoData";
import { MESES } from "../utils/formatters";
import MonthYearSelect from "../components/MonthYearSelect";
import BalanceDisplay from "../components/BalanceDisplay";
import Loader from "../components/Loader";

export default function NuevoGasto() {
  const { isDemo } = useAuth();
  const currentDate = new Date();
  const [mes, setMes] = useState(MESES[currentDate.getMonth()]);
  const [anio, setAnio] = useState(currentDate.getFullYear());
  const [descripcion, setDescripcion] = useState("");
  const [monto, setMonto] = useState("");
  const [alerta, setAlerta] = useState({ tipo: "", mensaje: "" });
  const [loading, setLoading] = useState(false);

  const mostrarAlerta = (mensaje, tipo) => {
    setAlerta({ tipo, mensaje });
    setTimeout(() => {
      setAlerta({ tipo: "", mensaje: "" });
    }, 4000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const montoNum = parseFloat(monto);

    if (!descripcion.trim() || isNaN(montoNum) || montoNum <= 0) {
      mostrarAlerta("Por favor, completa todos los campos correctamente con un monto mayor a cero.", "danger");
      return;
    }

    setLoading(true);
    const data = { descripcion: descripcion.trim(), monto: montoNum };

    try {
      if (isDemo) {
        addDemoGasto(mes, anio, data);
      } else {
        const claveMesAño = `${mes}_${anio}`;
        await addDoc(gastosCollection, data);
        await actualizarMontoActual(-montoNum);
        const gastosMesDoc = doc(gastosPorMes, claveMesAño);
        await setDoc(gastosMesDoc, { gastos: arrayUnion(data) }, { merge: true });
      }

      mostrarAlerta("Gasto agregado con éxito.", "success");
      setDescripcion("");
      setMonto("");
    } catch (error) {
      console.error("Error al agregar gasto:", error);
      mostrarAlerta("Error al agregar gasto. Inténtalo de nuevo.", "danger");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in d-flex flex-column align-items-center justify-content-center flex-grow-1 position-relative p-3">
      <div className="tarjeta-gasto p-4 rounded shadow">
        <p className="tituloCard h4 mb-3 fw-bold">Nuevo Gasto:</p>

        <form onSubmit={handleSubmit}>
          <MonthYearSelect mes={mes} setMes={setMes} anio={anio} setAnio={setAnio} />

          <div className="input-group mb-3">
            <span className="input-group-text">Descripción:</span>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Ej. Supermercado, Factura luz..."
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="input-group mb-3">
            <span className="input-group-text">Monto:</span>
            <span className="input-group-text">$</span>
            <input 
              type="number" 
              step="0.01" 
              min="0"
              className="form-control" 
              placeholder="0.00"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-secondary w-100" 
            disabled={loading}
          >
            {loading ? "Guardando..." : "Actualizar"}
          </button>
        </form>

        {alerta.mensaje && (
          <div className={`alert alert-${alerta.tipo} mt-3 text-center`} role="alert">
            {alerta.mensaje}
          </div>
        )}
      </div>

      {loading && <Loader message="Cargando datos..." />}

      <BalanceDisplay />
    </div>
  );
}
