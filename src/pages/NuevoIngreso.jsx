// src/pages/NuevoIngreso.jsx
import React, { useState } from "react";
import { addDoc, arrayUnion, doc, increment, setDoc } from "firebase/firestore";
import { 
  ingresosCollection, 
  ingresosPorMes, 
  ahorrosPorMes, 
  actualizarMontoActual, 
  actualizarAhorroActual 
} from "../services/firebase";
import { MESES } from "../utils/formatters";
import MonthYearSelect from "../components/MonthYearSelect";
import BalanceDisplay from "../components/BalanceDisplay";
import Loader from "../components/Loader";

export default function NuevoIngreso() {
  const currentDate = new Date();
  const [mes, setMes] = useState(MESES[currentDate.getMonth()]);
  const [anio, setAnio] = useState(currentDate.getFullYear());
  const [descripcion, setDescripcion] = useState("");
  const [monto, setMonto] = useState("");
  const [porcentaje, setPorcentaje] = useState(0);
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
    const porcentajeNum = parseFloat(porcentaje);

    if (!descripcion.trim() || isNaN(montoNum) || montoNum <= 0 || isNaN(porcentajeNum)) {
      mostrarAlerta("Por favor, completa todos los campos correctamente.", "danger");
      return;
    }

    setLoading(true);

    const ahorro = (montoNum * porcentajeNum) / 100;
    const ingresoNeto = montoNum - ahorro;
    const data = { descripcion: descripcion.trim(), monto: ingresoNeto, ahorro };
    const claveMesAño = `${mes}_${anio}`;

    try {
      // 1. Guardar en ingresos colección
      await addDoc(ingresosCollection, data);

      // 2. Actualizar monto global disponible y ahorros totales
      await actualizarMontoActual(ingresoNeto);
      if (ahorro > 0) {
        await actualizarAhorroActual(ahorro);
      }

      // 3. Guardar en ingresosPorMes
      const ingresosMesDoc = doc(ingresosPorMes, claveMesAño);
      await setDoc(ingresosMesDoc, { ingresos: arrayUnion(data) }, { merge: true });

      // 4. Guardar en ahorrosPorMes
      if (ahorro > 0) {
        const ahorrosMesDoc = doc(ahorrosPorMes, claveMesAño);
        await setDoc(ahorrosMesDoc, { totalAhorros: increment(ahorro) }, { merge: true });
      }

      mostrarAlerta("Ingreso agregado con éxito.", "success");
      setDescripcion("");
      setMonto("");
      setPorcentaje(0);
    } catch (error) {
      console.error("Error al agregar ingreso:", error);
      mostrarAlerta("Error al agregar ingreso. Inténtalo de nuevo.", "danger");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in d-flex flex-column align-items-center justify-content-center flex-grow-1 position-relative p-3">
      <div className="tarjeta-ingreso p-4 rounded shadow">
        <p className="tituloCard h4 mb-3 fw-bold">Nuevo Ingreso:</p>

        <form onSubmit={handleSubmit}>
          <MonthYearSelect mes={mes} setMes={setMes} anio={anio} setAnio={setAnio} />

          <div className="input-group mb-3">
            <span className="input-group-text">Descripción:</span>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Ej. Sueldo, Ventas, Honorarios..."
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
              min="0.01"
              className="form-control" 
              placeholder="0.00"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="input-group mb-3">
            <label className="input-group-text" htmlFor="porcentaje">
              Porcentaje que desea ahorrar:
            </label>
            <select 
              className="form-select" 
              id="porcentaje"
              value={porcentaje}
              onChange={(e) => setPorcentaje(Number(e.target.value))}
              disabled={loading}
            >
              <option value="0">0%</option>
              <option value="5">5%</option>
              <option value="10">10%</option>
              <option value="15">15%</option>
            </select>
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

