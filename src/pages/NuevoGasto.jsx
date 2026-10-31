// src/pages/NuevoGasto.jsx
import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { addDemoGasto } from "../services/demoData";
import { addGastoUser } from "../services/dbService";
import { MESES } from "../utils/formatters";
import MonthYearSelect from "../components/MonthYearSelect";
import Loader from "../components/Loader";

export default function NuevoGasto() {
  const { user, isDemo } = useAuth();
  const { showToast } = useToast();
  const currentDate = new Date();
  const [mes, setMes] = useState(MESES[currentDate.getMonth()]);
  const [anio, setAnio] = useState(currentDate.getFullYear());
  const [descripcion, setDescripcion] = useState("");
  const [monto, setMonto] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const montoNum = parseFloat(monto);

    if (!descripcion.trim() || isNaN(montoNum) || montoNum <= 0) {
      showToast("Por favor ingresa una descripción y un monto válido mayor a 0.", "warning");
      return;
    }

    setLoading(true);

    try {
      if (isDemo) {
        addDemoGasto(mes, anio, { descripcion: descripcion.trim(), monto: montoNum });
      } else {
        await addGastoUser(user.uid, {
          mes,
          anio,
          descripcion: descripcion.trim(),
          monto: montoNum
        });
      }

      showToast("Gasto registrado y saldo actualizado con éxito.", "success");
      setDescripcion("");
      setMonto("");
    } catch (error) {
      console.error("Error al agregar gasto:", error);
      showToast("Error al registrar el gasto: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in d-flex flex-column align-items-center justify-content-center flex-grow-1 p-3">
      <div className="tarjeta-gasto p-4 rounded-4 shadow-lg border">
        <div className="d-flex align-items-center justify-content-between tituloCard">
          <span className="d-flex align-items-center gap-2 text-danger">
            <i className="bi bi-arrow-down-circle-fill"></i>
            Nuevo Gasto
          </span>
          <span className="badge bg-danger bg-opacity-25 text-danger small">Salida</span>
        </div>

        <form onSubmit={handleSubmit}>
          <MonthYearSelect mes={mes} setMes={setMes} anio={anio} setAnio={setAnio} />

          <div className="mb-3">
            <label className="form-label text-muted small fw-semibold">Descripción del Gasto</label>
            <div className="input-group">
              <span className="input-group-text"><i className="bi bi-tag text-muted"></i></span>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Ej. Supermercado, Luz, Combustible..."
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label text-muted small fw-semibold">Monto</label>
            <div className="input-group">
              <span className="input-group-text">$</span>
              <input 
                type="number" 
                step="0.01" 
                min="0.01"
                className="form-control fs-5 fw-bold text-danger" 
                placeholder="0.00"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-danger w-100 py-2 fw-semibold shadow-sm" 
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                Guardando...
              </>
            ) : (
              <>
                <i className="bi bi-check2-circle me-1"></i> Registrar Gasto
              </>
            )}
          </button>
        </form>
      </div>

      {loading && <Loader message="Guardando gasto..." />}
    </div>
  );
}
