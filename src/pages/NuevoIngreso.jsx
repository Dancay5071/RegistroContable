// src/pages/NuevoIngreso.jsx
import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { addDemoIngreso } from "../services/demoData";
import { addIngresoUser } from "../services/dbService";
import { MESES, formatoMoneda } from "../utils/formatters";
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
  const [modoAhorro, setModoAhorro] = useState("porcentaje"); // "porcentaje" | "monto"
  const [porcentaje, setPorcentaje] = useState(0);
  const [montoAhorroFijo, setMontoAhorroFijo] = useState("");
  const [loading, setLoading] = useState(false);

  const addQuickAmount = (val) => {
    const current = parseFloat(monto) || 0;
    setMonto((current + val).toString());
  };

  const montoNum = parseFloat(monto) || 0;
  let ahorroFinal = 0;
  let porcentajeFinal = 0;

  if (modoAhorro === "monto") {
    const fijoNum = parseFloat(montoAhorroFijo) || 0;
    ahorroFinal = Math.min(montoNum, fijoNum);
    porcentajeFinal = montoNum > 0 ? (ahorroFinal / montoNum) * 100 : 0;
  } else {
    porcentajeFinal = parseFloat(porcentaje) || 0;
    ahorroFinal = (montoNum * porcentajeFinal) / 100;
  }

  const netoCalculado = Math.max(0, montoNum - ahorroFinal);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const descFinal = descripcion.trim() || categoria;

    if (isNaN(montoNum) || montoNum <= 0) {
      showToast("Por favor ingresa un monto válido mayor a 0.", "warning");
      return;
    }

    if (modoAhorro === "monto" && parseFloat(montoAhorroFijo) > montoNum) {
      showToast("La cantidad a ahorrar no puede superar el monto bruto del ingreso.", "warning");
      return;
    }

    setLoading(true);

    try {
      if (isDemo) {
        addDemoIngreso(mes, anio, {
          descripcion: descFinal,
          montoBruto: montoNum,
          ahorro: ahorroFinal,
          montoAhorro: ahorroFinal,
          porcentajeAhorro: porcentajeFinal,
          categoria
        });
      } else {
        await addIngresoUser(user.uid, {
          mes,
          anio,
          descripcion: descFinal,
          montoBruto: montoNum,
          montoAhorro: ahorroFinal,
          porcentajeAhorro: porcentajeFinal,
          categoria
        });
      }

      showToast("Ingreso registrado y saldos actualizados con éxito.", "success");
      setDescripcion("");
      setMonto("");
      setPorcentaje(0);
      setMontoAhorroFijo("");
    } catch (error) {
      console.error("Error al agregar ingreso:", error);
      showToast("Error al registrar el ingreso: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

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
            <div className="d-flex justify-content-between align-items-center mb-1">
              <label className="form-label text-muted small fw-semibold mb-0">Monto Bruto</label>
              <div className="d-flex gap-1">
                <button type="button" className="quick-amount-pill" onClick={() => addQuickAmount(10000)}>+10k</button>
                <button type="button" className="quick-amount-pill" onClick={() => addQuickAmount(50000)}>+50k</button>
                <button type="button" className="quick-amount-pill" onClick={() => addQuickAmount(100000)}>+100k</button>
              </div>
            </div>
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
            {Number(monto) > 0 && (
              <div className="amount-preview-badge">
                <i className="bi bi-tag text-success"></i>
                Vista previa: {formatoMoneda(Number(monto))}
              </div>
            )}
          </div>

          {/* Apartar para Ahorro: Selector de Modo (Porcentaje vs Cantidad Fija) */}
          <div className="mb-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <label className="form-label text-muted small fw-semibold mb-0">
                Apartar para Ahorro
              </label>
              <div className="btn-group btn-group-sm" role="group">
                <button
                  type="button"
                  className={`btn btn-sm ${modoAhorro === "porcentaje" ? "btn-success" : "btn-outline-secondary"}`}
                  onClick={() => setModoAhorro("porcentaje")}
                  style={{ fontSize: "0.75rem", padding: "0.2rem 0.6rem" }}
                >
                  % Porcentaje
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${modoAhorro === "monto" ? "btn-success" : "btn-outline-secondary"}`}
                  onClick={() => setModoAhorro("monto")}
                  style={{ fontSize: "0.75rem", padding: "0.2rem 0.6rem" }}
                >
                  $ Cantidad Fija
                </button>
              </div>
            </div>

            {modoAhorro === "porcentaje" ? (
              <div>
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
                  <option value="25">25% para Ahorro</option>
                  <option value="30">30% para Ahorro</option>
                </select>
                {montoNum > 0 && porcentaje > 0 && (
                  <div className="small text-muted mt-1">
                    Equivale a: <strong className="text-primary">${ahorroFinal.toFixed(2)}</strong>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="input-group">
                  <span className="input-group-text">$</span>
                  <input 
                    type="number" 
                    step="0.01" 
                    min="0"
                    max={montoNum > 0 ? montoNum : undefined}
                    className="form-control text-primary fw-bold" 
                    placeholder="Monto exacto a apartar (ej. 50000)"
                    value={montoAhorroFijo}
                    onChange={(e) => setMontoAhorroFijo(e.target.value)}
                    disabled={loading}
                  />
                </div>
                {montoNum > 0 && parseFloat(montoAhorroFijo) > 0 && (
                  <div className="small text-muted mt-1 d-flex justify-content-between">
                    <span>Representa el: <strong className="text-primary">{porcentajeFinal.toFixed(1)}%</strong> del ingreso</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Resumen dinámico del ingreso */}
          {montoNum > 0 && ahorroFinal > 0 && (
            <div className="p-3 rounded-3 mb-3 border small" style={{ backgroundColor: "var(--bg-card-alt)", borderColor: "var(--border-subtle)" }}>
              <div className="d-flex justify-content-between text-muted mb-1">
                <span>Disponible (Neto en cuenta):</span>
                <strong className="text-success fs-6">${netoCalculado.toFixed(2)}</strong>
              </div>
              <div className="d-flex justify-content-between text-muted">
                <span>Directo a Ahorro ({porcentajeFinal.toFixed(1)}%):</span>
                <strong className="text-primary fs-6">${ahorroFinal.toFixed(2)}</strong>
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
