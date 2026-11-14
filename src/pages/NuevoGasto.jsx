import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { addDemoGasto } from "../services/demoData";
import { addGastoUser } from "../services/dbService";
import { logActivity } from "../services/auditService";
import { MESES, formatoMoneda, sanitizeTextInput, getFechaHoyISO, formatoFechaVencimiento } from "../utils/formatters";
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
  const [tieneVencimiento, setTieneVencimiento] = useState(false);
  const [fechaVencimiento, setFechaVencimiento] = useState(getFechaHoyISO());
  const [estadoPago, setEstadoPago] = useState("pendiente");
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
      const payloadGasto = {
        descripcion: descFinal,
        monto: montoNum,
        categoria
      };

      if (tieneVencimiento) {
        payloadGasto.fechaVencimiento = fechaVencimiento;
        payloadGasto.estadoPago = estadoPago;
      } else {
        payloadGasto.estadoPago = "pagado";
      }

      if (isDemo) {
        addDemoGasto(mes, anio, payloadGasto);
      } else {
        await addGastoUser(user.uid, {
          mes,
          anio,
          ...payloadGasto
        });
      }

      await logActivity(user?.uid, isDemo, {
        action: tieneVencimiento && estadoPago === "pendiente" ? "PROGRAMAR_VENCIMIENTO" : "CREAR_GASTO",
        category: "GASTOS",
        details: tieneVencimiento && estadoPago === "pendiente" 
          ? `Vencimiento programado: ${descFinal} (${categoria}) para ${formatoFechaVencimiento(fechaVencimiento)}`
          : `Gasto registrado: ${descFinal} (${categoria})`,
        amount: montoNum,
        currency: "ARS"
      });

      if (tieneVencimiento && estadoPago === "pendiente") {
        showToast(`Vencimiento programado con éxito para el ${formatoFechaVencimiento(fechaVencimiento)}.`, "info");
      } else {
        showToast("Gasto registrado y saldo actualizado con éxito.", "success");
      }

      setDescripcion("");
      setMonto("");
      setTieneVencimiento(false);
      setEstadoPago("pendiente");
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

          <div className="p-3 rounded-3 border mb-4" style={{ backgroundColor: "var(--bg-card-alt)", borderColor: "var(--border-subtle)" }}>
            <div className="form-check form-switch d-flex align-items-center justify-content-between p-0 mb-0">
              <label className="form-check-label fw-semibold text-dark small cursor-pointer" htmlFor="switchVencimientoGasto">
                <i className="bi bi-calendar-event text-warning me-1"></i> ¿Programar fecha de vencimiento?
              </label>
              <input 
                className="form-check-input ms-2" 
                type="checkbox" 
                role="switch" 
                id="switchVencimientoGasto" 
                checked={tieneVencimiento}
                onChange={(e) => setTieneVencimiento(e.target.checked)}
                disabled={loading}
              />
            </div>

            {tieneVencimiento && (
              <div className="mt-3 pt-3 border-top">
                <div className="mb-2">
                  <label className="form-label text-muted small fw-semibold mb-1">
                    Fecha Límite / Vencimiento
                  </label>
                  <input 
                    type="date" 
                    className="form-control form-control-sm"
                    value={fechaVencimiento}
                    onChange={(e) => setFechaVencimiento(e.target.value)}
                    required={tieneVencimiento}
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="form-label text-muted small fw-semibold mb-1 d-block">
                    Estado Inicial del Gasto
                  </label>
                  <div className="btn-group w-100" role="group">
                    <button
                      type="button"
                      className={`btn btn-sm ${estadoPago === 'pendiente' ? 'btn-warning text-dark fw-bold shadow-sm' : 'btn-outline-secondary'}`}
                      onClick={() => setEstadoPago('pendiente')}
                      disabled={loading}
                    >
                      <i className="bi bi-clock-history me-1"></i> Pendiente de Pago
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${estadoPago === 'pagado' ? 'btn-success text-white fw-bold shadow-sm' : 'btn-outline-secondary'}`}
                      onClick={() => setEstadoPago('pagado')}
                      disabled={loading}
                    >
                      <i className="bi bi-check2-circle me-1"></i> Ya Pagado
                    </button>
                  </div>
                  <span className="text-muted d-block mt-1" style={{ fontSize: "0.72rem" }}>
                    {estadoPago === "pendiente" 
                      ? "Se añadirá a tus alertas y solo se descontará cuando lo marques como pagado." 
                      : "Se descontará inmediatamente de tu saldo disponible."}
                  </span>
                </div>
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
