import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useQuickMovement } from "../context/QuickMovementContext";
import { useToast } from "../context/ToastContext";
import { MESES, MONEDAS, formatoMoneda } from "../utils/formatters";
import { CATEGORIAS_GASTO, CATEGORIAS_INGRESO, CATEGORIAS_AHORRO } from "../utils/categories";
import { 
  addGastoUser, 
  addIngresoUser, 
  addAhorroDirectoUser, 
  addExtraccionUser 
} from "../services/dbService";
import { 
  addDemoGasto, 
  addDemoIngreso, 
  addDemoAhorro, 
  addDemoExtraccion 
} from "../services/demoData";
import MonthYearSelect from "./MonthYearSelect";

export default function QuickMovementModal() {
  const { user, isDemo } = useAuth();
  const { isOpen, activeTab, setActiveTab, closeQuickModal, notifyMovementSaved } = useQuickMovement();
  const { showToast } = useToast();

  const currentDate = new Date();
  const [mes, setMes] = useState(MESES[currentDate.getMonth()]);
  const [anio, setAnio] = useState(currentDate.getFullYear());

  const [descripcion, setDescripcion] = useState("");
  const [monto, setMonto] = useState("");
  const [categoriaGasto, setCategoriaGasto] = useState("Supermercado");
  const [categoriaIngreso, setCategoriaIngreso] = useState("Sueldo");
  const [categoriaAhorro, setCategoriaAhorro] = useState("Emergencia");
  const [monedaAhorro, setMonedaAhorro] = useState("ARS");
  const [modoAhorroIngreso, setModoAhorroIngreso] = useState("porcentaje"); // "porcentaje" | "monto"
  const [porcentajeAhorro, setPorcentajeAhorro] = useState(0);
  const [montoAhorroFijoIngreso, setMontoAhorroFijoIngreso] = useState("");
  const [tipoAhorro, setTipoAhorro] = useState("agregar"); // "agregar" | "extraer"
  const [loading, setLoading] = useState(false);

  if (!isOpen || !user) return null;

  const resetFields = () => {
    setDescripcion("");
    setMonto("");
    setModoAhorroIngreso("porcentaje");
    setPorcentajeAhorro(0);
    setMontoAhorroFijoIngreso("");
    setTipoAhorro("agregar");
  };

  const handleClose = () => {
    resetFields();
    closeQuickModal();
  };

  const addQuickAmount = (val) => {
    const current = parseFloat(monto) || 0;
    setMonto((current + val).toString());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const montoNum = parseFloat(monto);

    if (isNaN(montoNum) || montoNum <= 0) {
      showToast("Ingresa un monto válido mayor a 0.", "warning");
      return;
    }

    setLoading(true);

    try {
      if (activeTab === "gasto") {
        const descFinal = descripcion.trim() || categoriaGasto;
        if (isDemo) {
          addDemoGasto(mes, anio, {
            descripcion: descFinal,
            monto: montoNum,
            categoria: categoriaGasto
          });
        } else {
          await addGastoUser(user.uid, {
            mes,
            anio,
            descripcion: descFinal,
            monto: montoNum,
            categoria: categoriaGasto
          });
        }
        showToast(`Gasto de $${montoNum.toLocaleString()} registrado.`, "success");
      } else if (activeTab === "ingreso") {
        const descFinal = descripcion.trim() || categoriaIngreso;
        let ahorroFinal = 0;
        let porcentajeFinal = 0;

        if (modoAhorroIngreso === "monto") {
          const fijo = parseFloat(montoAhorroFijoIngreso) || 0;
          ahorroFinal = Math.min(montoNum, fijo);
          porcentajeFinal = montoNum > 0 ? (ahorroFinal / montoNum) * 100 : 0;
        } else {
          porcentajeFinal = Number(porcentajeAhorro || 0);
          ahorroFinal = (montoNum * porcentajeFinal) / 100;
        }

        if (isDemo) {
          addDemoIngreso(mes, anio, {
            descripcion: descFinal,
            montoBruto: montoNum,
            ahorro: ahorroFinal,
            montoAhorro: ahorroFinal,
            porcentajeAhorro: porcentajeFinal,
            categoria: categoriaIngreso
          });
        } else {
          await addIngresoUser(user.uid, {
            mes,
            anio,
            descripcion: descFinal,
            montoBruto: montoNum,
            montoAhorro: ahorroFinal,
            porcentajeAhorro: porcentajeFinal,
            categoria: categoriaIngreso
          });
        }
        showToast(`Ingreso registrado correctamente.`, "success");
      } else if (activeTab === "ahorro") {
        const descFinal = descripcion.trim() || `${tipoAhorro === 'agregar' ? 'Aporte a' : 'Extracción de'} ${categoriaAhorro}`;
        const simboloMoneda = MONEDAS.find((m) => m.id === monedaAhorro)?.simbolo || "$";
        if (tipoAhorro === "agregar") {
          if (isDemo) {
            addDemoAhorro(mes, anio, montoNum, monedaAhorro, categoriaAhorro, descFinal);
          } else {
            await addAhorroDirectoUser(user.uid, { 
              mes, 
              anio, 
              monto: montoNum,
              moneda: monedaAhorro,
              categoria: categoriaAhorro,
              descripcion: descFinal
            });
          }
          showToast(`Se agregaron ${simboloMoneda}${montoNum.toLocaleString()} a ${categoriaAhorro}.`, "success");
        } else {
          if (isDemo) {
            addDemoExtraccion(mes, anio, montoNum, monedaAhorro, categoriaAhorro, descFinal);
          } else {
            await addExtraccionUser(user.uid, { 
              mes, 
              anio, 
              monto: montoNum,
              moneda: monedaAhorro,
              categoria: categoriaAhorro,
              descripcion: descFinal
            });
          }
          showToast(`Extracción de ${simboloMoneda}${montoNum.toLocaleString()} registrada.`, "info");
        }
      }

      notifyMovementSaved();
      handleClose();
    } catch (error) {
      console.error("Error al registrar movimiento:", error);
      showToast("Error al guardar: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const montoNum = parseFloat(monto) || 0;
  let ahorroCalculado = 0;
  let porcentajeCalculado = 0;

  if (modoAhorroIngreso === "monto") {
    ahorroCalculado = Math.min(montoNum, parseFloat(montoAhorroFijoIngreso) || 0);
    porcentajeCalculado = montoNum > 0 ? (ahorroCalculado / montoNum) * 100 : 0;
  } else {
    porcentajeCalculado = Number(porcentajeAhorro || 0);
    ahorroCalculado = (montoNum * porcentajeCalculado) / 100;
  }

  const netoCalculado = Math.max(0, montoNum - ahorroCalculado);

  return (
    <div 
      className="modal fade show d-block" 
      tabIndex="-1" 
      role="dialog"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.6)", zIndex: 1055 }}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content shadow-lg border-0">
          
          <div className="modal-header border-bottom pb-2 pt-3 flex-column align-items-stretch">
            <div className="d-flex justify-content-between align-items-center w-100 mb-2">
              <h5 className="modal-title fw-bold text-dark d-flex align-items-center gap-2">
                <i className="bi bi-plus-circle text-success"></i>
                Nuevo Movimiento
              </h5>
              <button 
                type="button" 
                className="btn-close" 
                onClick={handleClose} 
                disabled={loading}
              ></button>
            </div>

            <div className="btn-group w-100 p-1 rounded-3" style={{ backgroundColor: "#ede5d5" }} role="group">
              <button 
                type="button" 
                className={`btn btn-sm fw-semibold rounded-2 ${activeTab === 'gasto' ? 'btn-danger shadow-sm' : 'btn-link text-dark text-decoration-none'}`}
                onClick={() => setActiveTab('gasto')}
                disabled={loading}
              >
                <i className="bi bi-arrow-down-circle me-1"></i> Gasto
              </button>
              <button 
                type="button" 
                className={`btn btn-sm fw-semibold rounded-2 ${activeTab === 'ingreso' ? 'btn-success shadow-sm' : 'btn-link text-dark text-decoration-none'}`}
                onClick={() => setActiveTab('ingreso')}
                disabled={loading}
              >
                <i className="bi bi-arrow-up-circle me-1"></i> Ingreso
              </button>
              <button 
                type="button" 
                className={`btn btn-sm fw-semibold rounded-2 ${activeTab === 'ahorro' ? 'btn-warning shadow-sm text-white' : 'btn-link text-dark text-decoration-none'}`}
                onClick={() => setActiveTab('ahorro')}
                disabled={loading}
              >
                <i className="bi bi-piggy-bank me-1"></i> Ahorro
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body pt-3">
              <MonthYearSelect mes={mes} setMes={setMes} anio={anio} setAnio={setAnio} />

              {activeTab === "gasto" && (
                <>
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-muted mb-1 d-block">
                      Categoría
                    </label>
                    <div className="d-flex flex-wrap gap-1 mb-2">
                      {CATEGORIAS_GASTO.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          className={`btn btn-sm px-2 py-1 rounded-pill d-flex align-items-center gap-1 small ${categoriaGasto === cat.id ? 'fw-bold border-2' : 'opacity-75'}`}
                          style={{
                            backgroundColor: categoriaGasto === cat.id ? cat.bg : "#f1ede4",
                            color: cat.color,
                            borderColor: cat.border,
                            fontSize: "0.8rem"
                          }}
                          onClick={() => setCategoriaGasto(cat.id)}
                        >
                          <i className={`bi ${cat.icon}`}></i>
                          <span>{cat.nombre.split(" ")[0]}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold text-muted mb-1">
                      Descripción (opcional)
                    </label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder={`Ej. Compra en ${categoriaGasto}`}
                      value={descripcion}
                      onChange={(e) => setDescripcion(e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <label className="form-label small fw-bold text-muted mb-0">
                        Monto del Gasto
                      </label>
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
                        required
                        disabled={loading}
                        autoFocus
                      />
                    </div>
                    {Number(monto) > 0 && (
                      <div className="amount-preview-badge">
                        <i className="bi bi-tag text-danger"></i>
                        Vista previa: {formatoMoneda(Number(monto))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {activeTab === "ingreso" && (
                <>
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-muted mb-1 d-block">
                      Origen del Ingreso
                    </label>
                    <div className="d-flex flex-wrap gap-1 mb-2">
                      {CATEGORIAS_INGRESO.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          className={`btn btn-sm px-2 py-1 rounded-pill d-flex align-items-center gap-1 small ${categoriaIngreso === cat.id ? 'fw-bold border-2' : 'opacity-75'}`}
                          style={{
                            backgroundColor: categoriaIngreso === cat.id ? cat.bg : "#f1ede4",
                            color: cat.color,
                            borderColor: cat.border,
                            fontSize: "0.8rem"
                          }}
                          onClick={() => setCategoriaIngreso(cat.id)}
                        >
                          <i className={`bi ${cat.icon}`}></i>
                          <span>{cat.nombre.split(" ")[0]}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold text-muted mb-1">
                      Descripción (opcional)
                    </label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder={`Ej. Cobro por ${categoriaIngreso}`}
                      value={descripcion}
                      onChange={(e) => setDescripcion(e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <label className="form-label small fw-bold text-muted mb-0">
                        Monto Bruto
                      </label>
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
                        required
                        disabled={loading}
                        autoFocus
                      />
                    </div>
                    {Number(monto) > 0 && (
                      <div className="amount-preview-badge">
                        <i className="bi bi-tag text-success"></i>
                        Vista previa: {formatoMoneda(Number(monto))}
                      </div>
                    )}
                  </div>

                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <label className="form-label small fw-bold text-muted mb-0">
                        Apartar para Ahorro
                      </label>
                      <div className="btn-group btn-group-sm" role="group">
                        <button
                          type="button"
                          className={`btn btn-sm ${modoAhorroIngreso === "porcentaje" ? "btn-success" : "btn-outline-secondary"}`}
                          onClick={() => setModoAhorroIngreso("porcentaje")}
                          style={{ fontSize: "0.72rem", padding: "0.15rem 0.5rem" }}
                        >
                          % Porcentaje
                        </button>
                        <button
                          type="button"
                          className={`btn btn-sm ${modoAhorroIngreso === "monto" ? "btn-success" : "btn-outline-secondary"}`}
                          onClick={() => setModoAhorroIngreso("monto")}
                          style={{ fontSize: "0.72rem", padding: "0.15rem 0.5rem" }}
                        >
                          $ Dinero Fijo
                        </button>
                      </div>
                    </div>

                    {modoAhorroIngreso === "porcentaje" ? (
                      <div>
                        <select 
                          className="form-select form-select-sm"
                          value={porcentajeAhorro}
                          onChange={(e) => setPorcentajeAhorro(Number(e.target.value))}
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
                        {montoNum > 0 && porcentajeAhorro > 0 && (
                          <div className="small text-muted mt-1">
                            Equivale a: <strong className="text-warning">${ahorroCalculado.toFixed(2)}</strong>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <div className="input-group input-group-sm">
                          <span className="input-group-text">$</span>
                          <input 
                            type="number" 
                            step="0.01" 
                            min="0"
                            max={montoNum > 0 ? montoNum : undefined}
                            className="form-control text-warning fw-bold" 
                            placeholder="Monto exacto a apartar (ej. 50000)"
                            value={montoAhorroFijoIngreso}
                            onChange={(e) => setMontoAhorroFijoIngreso(e.target.value)}
                            disabled={loading}
                          />
                        </div>
                        {montoNum > 0 && parseFloat(montoAhorroFijoIngreso) > 0 && (
                          <div className="small text-muted mt-1 d-flex justify-content-between">
                            <span>Representa el: <strong className="text-warning">{porcentajeCalculado.toFixed(1)}%</strong> del ingreso</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {montoNum > 0 && ahorroCalculado > 0 && (
                    <div className="p-2 rounded-3 border small mb-2" style={{ backgroundColor: "var(--bg-card-alt)", borderColor: "var(--border-subtle)" }}>
                      <div className="d-flex justify-content-between text-muted">
                        <span>Disponible: <strong className="text-success">${netoCalculado.toFixed(2)}</strong></span>
                        <span>Ahorro ({porcentajeCalculado.toFixed(1)}%): <strong className="text-warning">${ahorroCalculado.toFixed(2)}</strong></span>
                      </div>
                    </div>
                  )}
                </>
              )}

              {activeTab === "ahorro" && (
                <>
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-muted mb-1">Tipo de Operación</label>
                    <div className="btn-group w-100" role="group">
                      <input 
                        type="radio" 
                        className="btn-check" 
                        name="tipoAhorro" 
                        id="opcAgregar" 
                        checked={tipoAhorro === "agregar"} 
                        onChange={() => setTipoAhorro("agregar")} 
                      />
                      <label className="btn btn-outline-success btn-sm fw-semibold" htmlFor="opcAgregar">
                        <i className="bi bi-plus-circle me-1"></i> Aportar Ahorro
                      </label>

                      <input 
                        type="radio" 
                        className="btn-check" 
                        name="tipoAhorro" 
                        id="opcExtraer" 
                        checked={tipoAhorro === "extraer"} 
                        onChange={() => setTipoAhorro("extraer")} 
                      />
                      <label className="btn btn-outline-danger btn-sm fw-semibold" htmlFor="opcExtraer">
                        <i className="bi bi-dash-circle me-1"></i> Extraer de Ahorros
                      </label>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold text-muted mb-1 d-block">
                      Tipo de Moneda
                    </label>
                    <div className="d-flex gap-2">
                      {MONEDAS.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          className={`btn btn-sm px-3 py-1 rounded-pill fw-semibold ${monedaAhorro === m.id ? 'btn-primary shadow-sm' : 'btn-outline-secondary'}`}
                          onClick={() => setMonedaAhorro(m.id)}
                          disabled={loading}
                        >
                          <span className="me-1">{m.flag}</span>
                          {m.id} ({m.simbolo})
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold text-muted mb-1 d-block">
                      Meta / Destino del Ahorro
                    </label>
                    <div className="d-flex flex-wrap gap-1">
                      {CATEGORIAS_AHORRO.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          className={`btn btn-sm px-2 py-1 rounded-pill d-flex align-items-center gap-1 small ${categoriaAhorro === cat.id ? 'fw-bold border-2 shadow-sm' : 'opacity-80'}`}
                          style={{
                            backgroundColor: categoriaAhorro === cat.id ? cat.bg : "#f1ede4",
                            color: cat.color,
                            borderColor: cat.border,
                            fontSize: "0.82rem"
                          }}
                          onClick={() => setCategoriaAhorro(cat.id)}
                          disabled={loading}
                        >
                          <i className={`bi ${cat.icon}`}></i>
                          <span>{cat.nombre.split(" ")[0]}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold text-muted mb-1">
                      Descripción (opcional)
                    </label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder={`Ej. Aporte para ${categoriaAhorro}`}
                      value={descripcion}
                      onChange={(e) => setDescripcion(e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <label className="form-label small fw-bold text-muted mb-0">
                        Monto {tipoAhorro === "agregar" ? "a Ahorrar" : "a Extraer"}
                      </label>
                      <div className="d-flex gap-1">
                        {monedaAhorro === "ARS" ? (
                          <>
                            <button type="button" className="quick-amount-pill" onClick={() => addQuickAmount(1000)}>+1k</button>
                            <button type="button" className="quick-amount-pill" onClick={() => addQuickAmount(5000)}>+5k</button>
                            <button type="button" className="quick-amount-pill" onClick={() => addQuickAmount(10000)}>+10k</button>
                          </>
                        ) : (
                          <>
                            <button type="button" className="quick-amount-pill" onClick={() => addQuickAmount(10)}>+10</button>
                            <button type="button" className="quick-amount-pill" onClick={() => addQuickAmount(50)}>+50</button>
                            <button type="button" className="quick-amount-pill" onClick={() => addQuickAmount(100)}>+100</button>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="input-group">
                      <span className="input-group-text fw-bold">
                        {MONEDAS.find((m) => m.id === monedaAhorro)?.simbolo || "$"}
                      </span>
                      <input 
                        type="number" 
                        step="0.01" 
                        min="0.01"
                        className={`form-control fs-5 fw-bold ${tipoAhorro === 'agregar' ? 'text-warning' : 'text-danger'}`}
                        placeholder="0.00"
                        value={monto}
                        onChange={(e) => setMonto(e.target.value)}
                        required
                        disabled={loading}
                        autoFocus
                      />
                    </div>
                    {Number(monto) > 0 && (
                      <div className="amount-preview-badge">
                        <i className="bi bi-tag text-warning"></i>
                        Vista previa: {formatoMoneda(Number(monto), monedaAhorro)}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="modal-footer border-top pt-2">
              <button 
                type="button" 
                className="btn btn-secondary btn-sm" 
                onClick={handleClose}
                disabled={loading}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className={`btn btn-sm px-4 fw-semibold shadow-sm ${
                  activeTab === 'gasto' ? 'btn-danger' :
                  activeTab === 'ingreso' ? 'btn-success' :
                  tipoAhorro === 'agregar' ? 'btn-warning text-white' : 'btn-danger'
                }`}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                    Guardando...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check2-circle me-1"></i>
                    {activeTab === 'gasto' && "Guardar Gasto"}
                    {activeTab === 'ingreso' && "Guardar Ingreso"}
                    {activeTab === 'ahorro' && (tipoAhorro === 'agregar' ? "Guardar Ahorro" : "Confirmar Extracción")}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

