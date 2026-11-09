import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { addDemoGasto } from "../services/demoData";
import { addGastoUser } from "../services/dbService";
import { logActivity } from "../services/auditService";
import { MESES, formatoMoneda, sanitizeTextInput } from "../utils/formatters";
import { CATEGORIAS_GASTO } from "../utils/categories";
import MonthYearSelect from "../components/MonthYearSelect";
import Loader from "../components/Loader";

export default function NuevoGasto() {
  const { user, isDemo } = useAuth();
  const { showToast } = useToast();
  const currentDate = new Date();
  const [mes, setMes] = useState(MESES[currentDate.getMonth()]);
  const [anio, setAnio] = useState(currentDate.getFullYear());
  const [categoria, setCategoria] = useState("Supermercado");
  const [descripcion, setDescripcion] = useState("");
  const [monto, setMonto] = useState("");
  const [loading, setLoading] = useState(false);

  const addQuickAmount = (val) => {
    const current = parseFloat(monto) || 0;
    setMonto((current + val).toString());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const montoNum = parseFloat(monto);
    const descFinal = sanitizeTextInput(descripcion) || categoria;

    if (isNaN(montoNum) || montoNum <= 0) {
      showToast("Por favor ingresa un monto válido mayor a 0.", "warning");
      return;
    }

    setLoading(true);

    try {
      if (isDemo) {
        addDemoGasto(mes, anio, { descripcion: descFinal, monto: montoNum, categoria });
      } else {
        await addGastoUser(user.uid, {
          mes,
          anio,
          descripcion: descFinal,
          monto: montoNum,
          categoria
        });
      }

      await logActivity(user?.uid, isDemo, {
        action: "CREAR_GASTO",
        category: "GASTOS",
        details: `Gasto registrado: ${descFinal} (${categoria})`,
        amount: montoNum,
        currency: "ARS"
      });

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
            <label className="form-label text-muted small fw-semibold d-block mb-1">
              Categoría
            </label>
            <div className="d-flex flex-wrap gap-1">
              {CATEGORIAS_GASTO.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  className={`btn btn-sm px-2 py-1 rounded-pill d-flex align-items-center gap-1 small ${categoria === cat.id ? 'fw-bold border-2 shadow-sm' : 'opacity-80'}`}
                  style={{
                    backgroundColor: categoria === cat.id ? cat.bg : "var(--bg-card-alt)",
                    color: categoria === cat.id ? cat.color : "var(--text-main)",
                    borderColor: categoria === cat.id ? cat.border : "var(--border-subtle)",
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
            <label className="form-label text-muted small fw-semibold">Descripción del Gasto</label>
            <div className="input-group">
              <span className="input-group-text"><i className="bi bi-tag text-muted"></i></span>
              <input 
                type="text" 
                className="form-control" 
                placeholder={`Ej. Compra en ${categoria}`}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <label className="form-label text-muted small fw-semibold mb-0">Monto</label>
              <div className="d-flex gap-1">
                <button type="button" className="quick-amount-pill" onClick={() => addQuickAmount(1000)}>+1k</button>
                <button type="button" className="quick-amount-pill" onClick={() => addQuickAmount(5000)}>+5k</button>
                <button type="button" className="quick-amount-pill" onClick={() => addQuickAmount(10000)}>+10k</button>
                <button type="button" className="quick-amount-pill" onClick={() => addQuickAmount(50000)}>+50k</button>
              </div>
            </div>
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
            {Number(monto) > 0 && (
              <div className="amount-preview-badge">
                <i className="bi bi-tag text-danger"></i>
                Vista previa: {formatoMoneda(Number(monto))}
              </div>
            )}
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
