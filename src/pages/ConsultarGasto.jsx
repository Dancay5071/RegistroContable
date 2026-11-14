import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { usePrivacy } from "../context/PrivacyContext";
import { useSecurity } from "../context/SecurityContext";
import { useQuickMovement } from "../context/QuickMovementContext";
import { useVencimientos } from "../context/VencimientosContext";
import { 
  getDemoGastos, 
  updateDemoGasto, 
  deleteDemoGasto 
} from "../services/demoData";
import { 
  getGastosUser, 
  updateGastoUser, 
  deleteGastoUser 
} from "../services/dbService";
import { logActivity } from "../services/auditService";
import { MESES, formatoMoneda, formatoFechaVencimiento, getDiasRestantes } from "../utils/formatters";
import { CATEGORIAS_GASTO, getCategoriaGasto } from "../utils/categories";
import MonthYearSelect from "../components/MonthYearSelect";
import Loader from "../components/Loader";
import { exportGastosToCSV, printFinancialReport } from "../utils/exportUtils";

export default function ConsultarGasto() {
  const { user, isDemo } = useAuth();
  const { showToast } = useToast();
  const { isPrivate, maskAmount } = usePrivacy();
  const { requestConfirmation } = useSecurity();
  const { movementCounter } = useQuickMovement();
  const { marcarComoPagado } = useVencimientos();
  const currentDate = new Date();
  const [mes, setMes] = useState(MESES[currentDate.getMonth()]);
  const [anio, setAnio] = useState(currentDate.getFullYear());
  const [gastos, setGastos] = useState(null);
  const [loading, setLoading] = useState(false);

  const [filtroTexto, setFiltroTexto] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("todas");
  const [filtroEstado, setFiltroEstado] = useState("todos");

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editDescripcion, setEditDescripcion] = useState("");
  const [editCategoria, setEditCategoria] = useState("Supermercado");
  const [editMonto, setEditMonto] = useState("");
  const [editFechaVencimiento, setEditFechaVencimiento] = useState("");
  const [editEstadoPago, setEditEstadoPago] = useState("pagado");
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    if (gastos !== null) {
      consultarGasto();
    }
  }, [movementCounter]);

  const consultarGasto = async () => {
    setLoading(true);

    try {
      if (isDemo) {
        const lista = getDemoGastos(mes, anio);
        setGastos(lista);
      } else {
        const lista = await getGastosUser(user.uid, mes, anio);
        setGastos(lista);
      }
    } catch (error) {
      console.error("Error al obtener gastos:", error);
      showToast("Error al consultar gastos: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (index) => {
    const item = gastos[index];
    if (!item) return;
    setEditingIndex(index);
    setEditingItem(item);
    setEditDescripcion(item.descripcion);
    setEditCategoria(item.categoria || "Otros");
    setEditMonto(item.monto.toString());
    setEditFechaVencimiento(item.fechaVencimiento || "");
    setEditEstadoPago(item.estadoPago || "pagado");
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    const montoNum = parseFloat(editMonto);

    if (!editDescripcion.trim() || isNaN(montoNum) || montoNum <= 0) {
      showToast("Por favor ingresa una descripción y un monto válido.", "warning");
      return;
    }

    setEditLoading(true);

    try {
      if (isDemo) {
        updateDemoGasto(mes, anio, editingIndex, {
          descripcion: editDescripcion.trim(),
          monto: montoNum,
          categoria: editCategoria,
          fechaVencimiento: editFechaVencimiento || null,
          estadoPago: editEstadoPago
        });
        setGastos(getDemoGastos(mes, anio));
      } else {
        await updateGastoUser(user.uid, editingItem.id, {
          mes,
          anio,
          descripcion: editDescripcion.trim(),
          monto: montoNum,
          montoAnterior: editingItem.monto,
          categoria: editCategoria,
          fechaVencimiento: editFechaVencimiento || null,
          estadoPago: editEstadoPago,
          estadoPagoAnterior: editingItem.estadoPago || "pagado"
        });
        await consultarGasto();
      }

      await logActivity(user?.uid, isDemo, {
        action: "MODIFICAR_GASTO",
        category: "GASTOS",
        details: `Gasto modificado: "${editDescripcion.trim()}"`,
        amount: montoNum,
        currency: "ARS"
      });

      showToast("Gasto actualizado con éxito.", "success");
      setEditModalOpen(false);
    } catch (error) {
      console.error("Error al guardar edición de gasto:", error);
      showToast("Hubo un error al actualizar el gasto: " + error.message, "error");
    } finally {
      setEditLoading(false);
    }
  };

  const handlePagarItem = (gasto) => {
    requestConfirmation({
      title: "¿Confirmar pago de servicio?",
      message: `Estás por registrar el pago de "${gasto.descripcion}" por ${formatoMoneda(gasto.monto)}.`,
      impact: `Se descontará ${formatoMoneda(gasto.monto)} de tu Saldo Disponible.`,
      confirmText: "Sí, registrar pago",
      danger: false,
      onConfirm: async () => {
        setLoading(true);
        try {
          await marcarComoPagado(gasto);
          await consultarGasto();
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleEliminarGasto = (index) => {
    const item = gastos[index];
    if (!item) return;

    const esPendiente = item.estadoPago === "pendiente";
    const impactoTexto = esPendiente
      ? "Se cancelará este vencimiento pendiente sin alterar tu Saldo Disponible."
      : `Se reintegrará ${formatoMoneda(item.monto)} a tu Saldo Disponible.`;

    requestConfirmation({
      title: "¿Eliminar este gasto?",
      message: `Estás a punto de eliminar "${item.descripcion}".`,
      impact: impactoTexto,
      confirmText: "Sí, eliminar gasto",
      danger: true,
      onConfirm: async () => {
        setLoading(true);
        try {
          if (isDemo) {
            deleteDemoGasto(mes, anio, index);
            setGastos(getDemoGastos(mes, anio));
          } else {
            await deleteGastoUser(user.uid, item.id, {
              mes,
              anio,
              monto: item.monto,
              estadoPago: item.estadoPago || "pagado"
            });
            await consultarGasto();
          }

          await logActivity(user?.uid, isDemo, {
            action: "ELIMINAR_GASTO",
            category: "GASTOS",
            details: `Gasto eliminado: "${item.descripcion}"`,
            amount: item.monto,
            currency: "ARS"
          });

          showToast("Gasto eliminado correctamente.", "info");
        } catch (error) {
          console.error("Error al eliminar gasto:", error);
          showToast("Hubo un error al eliminar el gasto: " + error.message, "error");
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const gastosFiltrados = (gastos || []).filter((g) => {
    const coincideTexto = !filtroTexto.trim() || 
      g.descripcion.toLowerCase().includes(filtroTexto.toLowerCase()) ||
      (g.categoria && g.categoria.toLowerCase().includes(filtroTexto.toLowerCase()));
    const coincideCat = filtroCategoria === "todas" || 
      (g.categoria || "Otros").toLowerCase() === filtroCategoria.toLowerCase();
    const esPendiente = g.estadoPago === "pendiente";
    const coincideEstado = filtroEstado === "todos" || 
      (filtroEstado === "pendientes" ? esPendiente : !esPendiente);
    return coincideTexto && coincideCat && coincideEstado;
  });

  const sumaGastos = gastosFiltrados.reduce((acc, g) => acc + (Number(g.monto) || 0), 0);

  return (
    <div className="fade-in d-flex flex-column align-items-center flex-grow-1 p-3">
      <div className="container d-flex flex-wrap justify-content-center gap-4">
        <div className="card-consulta p-4 rounded-4 shadow-sm border">
          <p className="tituloCard text-dark d-flex align-items-center gap-2">
            <i className="bi bi-funnel text-primary"></i> Filtrar Gastos
          </p>
          <MonthYearSelect mes={mes} setMes={setMes} anio={anio} setAnio={setAnio} />
          <button 
            className="btn btn-primary w-100 py-2 fw-semibold shadow-sm" 
            type="button" 
            onClick={consultarGasto}
            disabled={loading}
          >
            <i className="bi bi-search me-1"></i>
            {loading ? "Consultando..." : "Consultar"}
          </button>
        </div>

        <div className="consulta p-4 rounded-4 shadow-sm border">
          {loading && <Loader />}

          {!loading && gastos === null && (
            <div className="text-center text-muted p-5">
              <i className="bi bi-wallet2 fs-1 text-secondary opacity-50 mb-2 d-block"></i>
              <p className="mb-0">Selecciona el mes y año para consultar tus gastos registrados.</p>
            </div>
          )}

          {!loading && gastos !== null && gastos.length === 0 && (
            <div className="text-center p-5">
              <i className="bi bi-inbox fs-1 text-muted mb-3 d-block opacity-50"></i>
              <h5 className="text-dark">Sin gastos en {mes} {anio}</h5>
              <p className="text-muted small mb-3">No tienes ningún gasto registrado en este período.</p>
              <Link to="/gastos/nuevo" className="btn btn-sm btn-outline-danger">
                <i className="bi bi-plus-circle me-1"></i> Agregar primer gasto
              </Link>
            </div>
          )}

          {!loading && gastos !== null && gastos.length > 0 && (
            <div>
              <div className="print-header">
                <h1>FinTrack — Reporte de Gastos</h1>
                <p>Período: <strong>{mes} {anio}</strong> | Total Gastos: <strong>{formatoMoneda(sumaGastos)}</strong> | Generado el {new Date().toLocaleDateString()}</p>
              </div>

              <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3 border-bottom pb-2">
                <div>
                  <h4 className="h5 fw-bold text-dark mb-0">Gastos de {mes} {anio}</h4>
                  <span className="badge bg-danger bg-opacity-10 text-danger px-3 py-1 fs-6 mt-1">
                    Total: {maskAmount(formatoMoneda(sumaGastos))}
                  </span>
                </div>

                <div className="d-flex align-items-center gap-2 no-print">
                  <button 
                    type="button" 
                    className="btn btn-outline-success btn-sm d-flex align-items-center gap-1 shadow-sm"
                    onClick={() => exportGastosToCSV(gastos, mes, anio)}
                    title="Descargar tabla en formato Excel (CSV)"
                  >
                    <i className="bi bi-file-earmark-excel"></i>
                    <span>Exportar Excel</span>
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-outline-dark btn-sm d-flex align-items-center gap-1 shadow-sm"
                    onClick={printFinancialReport}
                    title="Imprimir reporte o guardar como PDF"
                  >
                    <i className="bi bi-printer"></i>
                    <span>PDF / Imprimir</span>
                  </button>
                </div>
              </div>

              <div className="row g-2 mb-3">
                <div className="col-12 col-md-7">
                  <div className="input-group input-group-sm">
                    <span className="input-group-text"><i className="bi bi-search"></i></span>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Buscar por descripción o comercio..."
                      value={filtroTexto}
                      onChange={(e) => setFiltroTexto(e.target.value)}
                    />
                    {filtroTexto && (
                      <button 
                        type="button" 
                        className="btn btn-outline-secondary"
                        onClick={() => setFiltroTexto("")}
                      >
                        <i className="bi bi-x"></i>
                      </button>
                    )}
                  </div>
                </div>
                <div className="col-12 col-md-5">
                  <select 
                    className="form-select form-select-sm"
                    value={filtroCategoria}
                    onChange={(e) => setFiltroCategoria(e.target.value)}
                  >
                    <option value="todas">Todas las categorías</option>
                    {CATEGORIAS_GASTO.map((c) => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                <div className="btn-group p-1 rounded-pill" style={{ backgroundColor: "var(--bg-card-alt)", border: "1px solid var(--border-subtle)" }}>
                  <button
                    type="button"
                    className={`btn btn-sm rounded-pill px-3 fw-semibold border-0 ${filtroEstado === 'todos' ? 'btn-dark shadow-sm' : 'text-muted'}`}
                    onClick={() => setFiltroEstado('todos')}
                  >
                    Todos ({gastos.length})
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm rounded-pill px-3 fw-semibold border-0 ${filtroEstado === 'pagados' ? 'btn-success text-white shadow-sm' : 'text-muted'}`}
                    onClick={() => setFiltroEstado('pagados')}
                  >
                    Pagados ({gastos.filter(g => g.estadoPago !== 'pendiente').length})
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm rounded-pill px-3 fw-semibold border-0 ${filtroEstado === 'pendientes' ? 'btn-warning text-dark shadow-sm' : 'text-muted'}`}
                    onClick={() => setFiltroEstado('pendientes')}
                  >
                    Pendientes ({gastos.filter(g => g.estadoPago === 'pendiente').length})
                  </button>
                </div>

                <span className="small text-muted">
                  Mostrando <strong>{gastosFiltrados.length}</strong> de {gastos.length} gastos
                </span>
              </div>

              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead>
                    <tr>
                      <th scope="col" style={{ width: "36px" }}></th>
                      <th>Detalle & Categoría</th>
                      <th>Monto</th>
                      <th className="text-end">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gastosFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="text-center text-muted py-4 small">
                          No se encontraron gastos que coincidan con los filtros aplicados.
                        </td>
                      </tr>
                    ) : (
                      gastosFiltrados.map((gasto, index) => {
                        const cat = getCategoriaGasto(gasto.categoria);
                        const esPendiente = gasto.estadoPago === "pendiente";
                        const dias = getDiasRestantes(gasto.fechaVencimiento);
                        return (
                          <tr key={gasto.id || index} className={esPendiente ? (dias !== null && dias < 0 ? 'table-danger' : 'table-warning') : ''}>
                            <td>
                              <div 
                                className="rounded-circle d-flex align-items-center justify-content-center"
                                style={{ width: "32px", height: "32px", backgroundColor: cat.bg, color: cat.color }}
                                title={cat.nombre}
                              >
                                <i className={`bi ${cat.icon}`}></i>
                              </div>
                            </td>
                            <td>
                              <div className="fw-semibold text-dark">{gasto.descripcion}</div>
                              <div className="d-flex flex-wrap align-items-center gap-1 mt-1">
                                <span 
                                  className="badge px-2 py-0 rounded-pill" 
                                  style={{ 
                                    backgroundColor: cat.bg, 
                                    color: cat.color, 
                                    border: `1px solid ${cat.border}`,
                                    fontSize: "0.72rem"
                                  }}
                                >
                                  {cat.nombre}
                                </span>
                                {esPendiente ? (
                                  <span 
                                    className={`badge px-2 py-0 rounded-pill small ${dias !== null && dias < 0 ? 'bg-danger text-white' : (dias === 0 ? 'bg-warning text-dark' : 'bg-warning bg-opacity-25 text-warning-emphasis border border-warning')}`} 
                                    style={{ fontSize: "0.7rem" }}
                                  >
                                    {dias !== null && dias < 0 ? `¡Vencido (${Math.abs(dias)}d)!` : (dias === 0 ? '¡Vence hoy!' : `Vence: ${formatoFechaVencimiento(gasto.fechaVencimiento)}`)}
                                  </span>
                                ) : (
                                  gasto.fechaVencimiento && (
                                    <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-0 rounded-pill" style={{ fontSize: "0.68rem" }}>
                                      <i className="bi bi-check2 me-1"></i> Pagado
                                    </span>
                                  )
                                )}
                              </div>
                            </td>
                            <td className={`text-danger fw-bold ${isPrivate ? "privacy-masked" : ""}`}>{maskAmount(formatoMoneda(gasto.monto))}</td>
                            <td className="text-end">
                              {esPendiente && (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-success rounded-pill px-2 py-0 me-2 shadow-sm"
                                  title="Marcar este gasto como pagado"
                                  onClick={() => handlePagarItem(gasto)}
                                >
                                  <i className="bi bi-check2-circle me-1"></i> Pagar
                                </button>
                              )}
                              <button 
                                type="button" 
                                className="btn btn-outline-secondary btn-sm me-2" 
                                title="Editar" 
                                onClick={() => handleOpenEdit(index)}
                              >
                                <i className="bi bi-pencil-fill text-warning"></i>
                              </button>
                              <button 
                                type="button" 
                                className="btn btn-outline-secondary btn-sm" 
                                title="Eliminar" 
                                onClick={() => handleEliminarGasto(index)}
                              >
                                <i className="bi bi-trash3-fill text-danger"></i>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  <tfoot className="table-light">
                    <tr>
                      <td colSpan="2" className="fw-bold">Total Consultado ({gastosFiltrados.length} registros)</td>
                      <td className={`fw-bold text-danger fs-6 ${isPrivate ? "privacy-masked" : ""}`}>{maskAmount(formatoMoneda(sumaGastos))}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {editModalOpen && (
        <div 
          className="modal fade show d-block" 
          tabIndex="-1" 
          role="dialog" 
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow-lg">
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold">Editar Gasto</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setEditModalOpen(false)}
                  disabled={editLoading}
                ></button>
              </div>
              <form onSubmit={handleSaveEdit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label text-muted small fw-semibold">Categoría</label>
                    <select 
                      className="form-select form-select-sm"
                      value={editCategoria}
                      onChange={(e) => setEditCategoria(e.target.value)}
                      disabled={editLoading}
                    >
                      {CATEGORIAS_GASTO.map((c) => (
                        <option key={c.id} value={c.id}>{c.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-muted small fw-semibold">Descripción</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={editDescripcion}
                      onChange={(e) => setEditDescripcion(e.target.value)}
                      required
                      disabled={editLoading}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-muted small fw-semibold">Monto ($)</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      min="0.01"
                      className="form-control fs-5 fw-bold text-danger" 
                      value={editMonto}
                      onChange={(e) => setEditMonto(e.target.value)}
                      required
                      disabled={editLoading}
                    />
                    {Number(editMonto) > 0 && (
                      <div className="amount-preview-badge">
                        <i className="bi bi-tag text-danger"></i>
                        Vista previa: {formatoMoneda(Number(editMonto))}
                      </div>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="form-label text-muted small fw-semibold">Fecha de Vencimiento (opcional)</label>
                    <input 
                      type="date" 
                      className="form-control form-control-sm"
                      value={editFechaVencimiento}
                      onChange={(e) => setEditFechaVencimiento(e.target.value)}
                      disabled={editLoading}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label text-muted small fw-semibold d-block">Estado del Pago</label>
                    <div className="btn-group w-100" role="group">
                      <button
                        type="button"
                        className={`btn btn-sm ${editEstadoPago === 'pagado' ? 'btn-success text-white fw-bold shadow-sm' : 'btn-outline-secondary'}`}
                        onClick={() => setEditEstadoPago('pagado')}
                        disabled={editLoading}
                      >
                        <i className="bi bi-check2-circle me-1"></i> Pagado
                      </button>
                      <button
                        type="button"
                        className={`btn btn-sm ${editEstadoPago === 'pendiente' ? 'btn-warning text-dark fw-bold shadow-sm' : 'btn-outline-secondary'}`}
                        onClick={() => setEditEstadoPago('pendiente')}
                        disabled={editLoading}
                      >
                        <i className="bi bi-clock-history me-1"></i> Pendiente
                      </button>
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-top">
                  <button 
                    type="button" 
                    className="btn btn-secondary btn-sm" 
                    onClick={() => setEditModalOpen(false)}
                    disabled={editLoading}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary btn-sm fw-semibold"
                    disabled={editLoading}
                  >
                    {editLoading ? "Guardando..." : "Guardar cambios"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
