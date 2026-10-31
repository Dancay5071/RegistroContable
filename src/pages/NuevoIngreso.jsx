// src/pages/NuevoIngreso.jsx
import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { addDemoIngreso } from "../services/demoData";
import { addIngresoUser } from "../services/dbService";
import { MESES } from "../utils/formatters";
import { CATEGORIAS_INGRESO } from "../utils/categories";
import MonthYearSelect from "../components/MonthYearSelect";
import Loader from "../components/Loader";

export default function NuevoIngreso() {
  const { user, isDemo } = useAuth();
  const { showToast } = useToast();
  const currentDate = new Date();
  const [mes, setMes] = useState(MESES[currentDate.getMonth()]);
  const [anio, setAnio] = useState(currentDate.getFullYear());
  const [categoria, setCategoria] = useState("Sueldo");
  const [descripcion, setDescripcion] = useState("");
  const [monto, setMonto] = useState("");
  const [porcentaje, setPorcentaje] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const montoNum = parseFloat(monto);
    const porcentajeNum = parseFloat(porcentaje);
    const descFinal = descripcion.trim() || categoria;

    if (isNaN(montoNum) || montoNum <= 0 || isNaN(porcentajeNum)) {
      showToast("Por favor ingresa un monto válido mayor a 0.", "warning");
      return;
    }

    setLoading(true);

    try {
      if (isDemo) {
        const ahorro = (montoNum * porcentajeNum) / 100;
        const ingresoNeto = montoNum - ahorro;
        addDemoIngreso(mes, anio, {
          descripcion: descFinal,
          monto: ingresoNeto,
          montoBruto: montoNum,
          ahorro,
          porcentajeAhorro: porcentajeNum,
          categoria
        });
      } else {
        await addIngresoUser(user.uid, {
          mes,
          anio,
          descripcion: descFinal,
          montoBruto: montoNum,
          porcentajeAhorro: porcentajeNum,
          categoria
        });
      }

      showToast("Ingreso registrado y saldos actualizados con éxito.", "success");
      setDescripcion("");
      setMonto("");
      setPorcentaje(0);
    } catch (error) {
      console.error("Error al agregar ingreso:", error);
      showToast("Error al registrar el ingreso: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const montoNum = parseFloat(monto) || 0;
  const ahorroCalculado = (montoNum * porcentaje) / 100;
  const netoCalculado = montoNum - ahorroCalculado;

  return (
    <div className="fade-in d-flex flex-column align-items-center justify-content-center flex-grow-1 p-3">
      <div className="tarjeta-ingreso p-4 rounded-4 shadow-lg border">
        <div className="d-flex align-items-center justify-content-between tituloCard">
          <span className="d-flex align-items-center gap-2 text-success">
            <i className="bi bi-arrow-up-circle-fill"></i>
            Nuevo Ingreso
          </span>
          <span className="badge bg-success bg-opacity-25 text-success small">Entrada</span>
        </div>

        <form onSubmit={handleSubmit}>
          <MonthYearSelect mes={mes} setMes={setMes} anio={anio} setAnio={setAnio} />

          {/* Selector de Categorías Pastel */}
          <div className="mb-3">
            <label className="form-label text-muted small fw-semibold d-block mb-1">
              Origen del Ingreso
            </label>
            <div className="d-flex flex-wrap gap-1">
              {CATEGORIAS_INGRESO.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  className={`btn btn-sm px-2 py-1 rounded-pill d-flex align-items-center gap-1 small ${categoria === cat.id ? 'fw-bold border-2 shadow-sm' : 'opacity-80'}`}
                  style={{
                    backgroundColor: categoria === cat.id ? cat.bg : "#f1ede4",
                    color: cat.color,
                    borderColor: cat.border,
                    fontSize: "0.82rem"
                  }}
                  onClick={() => setCategoria(cat.id)}
                >
                  <i className={`bi ${cat.icon}`}></i>
                  <span>{cat.nombre.split(" ")[0]}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label text-muted small fw-semibold">Descripción del Ingreso</label>
            <div className="input-group">
              <span className="input-group-text"><i className="bi bi-briefcase text-muted"></i></span>
              <input 
                type="text" 
                className="form-control" 
                placeholder={`Ej. Cobro por ${categoria}`}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label text-muted small fw-semibold">Monto Bruto</label>
            <div className="input-group">
              <span className="input-group-text">$</span>
              <input 
                type="number" 
                step="0.01" 
                min="0.01"
                className="form-control fs-5 fw-bold text-success" 
                placeholder="0.00"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label text-muted small fw-semibold d-flex justify-content-between align-items-center">
              <span>Porcentaje para Ahorro:</span>
              <strong className="text-info">{porcentaje}%</strong>
            </label>
            <select 
              className="form-select" 
              id="porcentaje"
              value={porcentaje}
              onChange={(e) => setPorcentaje(Number(e.target.value))}
              disabled={loading}
            >
              <option value="0">0% - Sin ahorro</option>
              <option value="5">5% para Ahorro</option>
              <option value="10">10% para Ahorro</option>
              <option value="15">15% para Ahorro</option>
              <option value="20">20% para Ahorro</option>
            </select>
          </div>

          {/* Resumen dinámico del ingreso */}
          {montoNum > 0 && porcentaje > 0 && (
            <div className="p-3 rounded-3 mb-3 border small" style={{ backgroundColor: "var(--bg-card-alt)", borderColor: "var(--border-subtle)" }}>
              <div className="d-flex justify-content-between text-muted mb-1">
                <span>Disponible (Neto):</span>
                <strong className="text-success fs-6">${netoCalculado.toFixed(2)}</strong>
              </div>
              <div className="d-flex justify-content-between text-muted">
                <span>Directo a Ahorro ({porcentaje}%):</span>
                <strong className="text-primary fs-6">${ahorroCalculado.toFixed(2)}</strong>
              </div>
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-success w-100 py-2 fw-semibold shadow-sm" 
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                Guardando...
              </>
            ) : (
              <>
                <i className="bi bi-check2-circle me-1"></i> Registrar Ingreso
              </>
            )}
          </button>
        </form>
      </div>

      {loading && <Loader message="Guardando ingreso..." />}
    </div>
  );
}
