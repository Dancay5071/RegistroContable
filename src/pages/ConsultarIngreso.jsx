// src/pages/ConsultarIngreso.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { 
  getDemoIngresos, 
  updateDemoIngreso, 
  deleteDemoIngreso 
} from "../services/demoData";
import { 
  getIngresosUser, 
  updateIngresoUser, 
  deleteIngresoUser 
} from "../services/dbService";
import { MESES, formatoMoneda } from "../utils/formatters";
import MonthYearSelect from "../components/MonthYearSelect";
import Loader from "../components/Loader";

export default function ConsultarIngreso() {
  const { user, isDemo } = useAuth();
  const { showToast } = useToast();
  const currentDate = new Date();
  const [mes, setMes] = useState(MESES[currentDate.getMonth()]);
  const [anio, setAnio] = useState(currentDate.getFullYear());
  const [ingresos, setIngresos] = useState(null);
  const [loading, setLoading] = useState(false);

  // Modal edición
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editDescripcion, setEditDescripcion] = useState("");
  const [editMonto, setEditMonto] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  const consultarIngreso = async () => {
    setLoading(true);

    try {
      if (isDemo) {
        const lista = getDemoIngresos(mes, anio);
        setIngresos(lista);
      } else {
        const lista = await getIngresosUser(user.uid, mes, anio);
        setIngresos(lista);
      }
    } catch (error) {
      console.error("Error al obtener ingresos:", error);
      showToast("Error al consultar ingresos: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (index) => {
    const item = ingresos[index];
    if (!item) return;
    setEditingIndex(index);
    setEditingItem(item);
    setEditDescripcion(item.descripcion);
    setEditMonto(item.monto.toString());
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
        updateDemoIngreso(mes, anio, editingIndex, {
          ...ingresos[editingIndex],
          descripcion: editDescripcion.trim(),
          monto: montoNum
        });
        setIngresos(getDemoIngresos(mes, anio));
      } else {
        await updateIngresoUser(user.uid, editingItem.id, {
          mes,
          anio,
          descripcion: editDescripcion.trim(),
          monto: montoNum,
          montoAnterior: editingItem.monto
        });
        await consultarIngreso();
      }

      showToast("Ingreso actualizado con éxito.", "success");
      setEditModalOpen(false);
    } catch (error) {
      console.error("Error al guardar edición de ingreso:", error);
      showToast("Hubo un error al actualizar el ingreso: " + error.message, "error");
    } finally {
      setEditLoading(false);
    }
  };

  const handleEliminarIngreso = async (index) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este ingreso?")) {
      return;
    }

    setLoading(true);

    try {
      if (isDemo) {
        deleteDemoIngreso(mes, anio, index);
        setIngresos(getDemoIngresos(mes, anio));
      } else {
        const item = ingresos[index];
        await deleteIngresoUser(user.uid, item.id, {
          mes,
          anio,
          monto: item.monto
        });
        await consultarIngreso();
      }
      showToast("Ingreso eliminado correctamente.", "info");
    } catch (error) {
      console.error("Error al eliminar ingreso:", error);
      showToast("Hubo un error al eliminar el ingreso: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const sumaIngresos = (ingresos || []).reduce((acc, ing) => acc + (Number(ing.monto) || 0), 0);

  return (
    <div className="fade-in d-flex flex-column align-items-center flex-grow-1 p-3">
      <div className="container d-flex flex-wrap justify-content-center gap-4">
        {/* Tarjeta de Selección */}
        <div className="card-consulta p-4 rounded-4 shadow border">
          <p className="tituloCard text-white d-flex align-items-center gap-2">
            <i className="bi bi-funnel text-success"></i> Filtrar Ingresos
          </p>
          <MonthYearSelect mes={mes} setMes={setMes} anio={anio} setAnio={setAnio} />
          <button 
            className="btn btn-success w-100 py-2 fw-semibold shadow-sm" 
            type="button" 
            onClick={consultarIngreso}
            disabled={loading}
          >
            <i className="bi bi-search me-1"></i>
            {loading ? "Consultando..." : "Consultar"}
          </button>
        </div>

        {/* Resultados de Ingresos */}
        <div className="consulta p-4 rounded-4 shadow border">
          {loading && <Loader />}

          {!loading && ingresos === null && (
            <div className="text-center text-muted p-5">
              <i className="bi bi-cash-stack fs-1 text-secondary opacity-50 mb-2 d-block"></i>
              <p className="mb-0">Selecciona el mes y año para consultar tus ingresos registrados.</p>
            </div>
          )}

          {!loading && ingresos !== null && ingresos.length === 0 && (
            <div className="text-center p-5">
              <i className="bi bi-inbox fs-1 text-muted mb-3 d-block opacity-50"></i>
              <h5 className="text-white">Sin ingresos en {mes} {anio}</h5>
              <p className="text-muted small mb-3">No tienes ningún ingreso registrado en este período.</p>
              <Link to="/ingresos/nuevo" className="btn btn-sm btn-outline-success">
                <i className="bi bi-plus-circle me-1"></i> Agregar primer ingreso
              </Link>
            </div>
          )}

          {!loading && ingresos !== null && ingresos.length > 0 && (
            <div>
              <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
                <h4 className="h5 fw-bold text-white mb-0">Ingresos de {mes} {anio}</h4>
                <span className="badge bg-success bg-opacity-25 text-success px-3 py-2 fs-6">
                  Total: {formatoMoneda(sumaIngresos)}
                </span>
              </div>

              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead>
                    <tr>
                      <th scope="col" style={{ width: "30px" }}></th>
                      <th>Descripción</th>
                      <th>Monto Neto</th>
                      <th className="text-end">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ingresos.map((ingreso, index) => (
                      <tr key={ingreso.id || index}>
                        <td><i className="bi bi-dot fs-4 text-success"></i></td>
                        <td className="fw-semibold text-white">{ingreso.descripcion}</td>
                        <td className="text-success fw-bold">{formatoMoneda(ingreso.monto)}</td>
                        <td className="text-end">
                          <button 
                            type="button" 
                            className="btn btn-outline-light btn-sm me-2 border-secondary" 
                            title="Editar" 
                            onClick={() => handleOpenEdit(index)}
                          >
                            <i className="bi bi-pencil-fill text-warning"></i>
                          </button>
                          <button 
                            type="button" 
                            className="btn btn-outline-light btn-sm border-secondary" 
                            title="Eliminar" 
                            onClick={() => handleEliminarIngreso(index)}
                          >
                            <i className="bi bi-trash3-fill text-danger"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="table-dark">
                    <tr>
                      <td colSpan="2" className="fw-bold">Total del Mes</td>
                      <td className="fw-bold text-success fs-6">{formatoMoneda(sumaIngresos)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Editar Ingreso */}
      {editModalOpen && (
        <div 
          className="modal fade show d-block" 
          tabIndex="-1" 
          role="dialog" 
          style={{ backgroundColor: "rgba(0, 0, 0, 0.75)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content bg-dark text-white border border-secondary shadow-lg">
              <div className="modal-header border-bottom border-secondary">
                <h5 className="modal-title">Editar Ingreso</h5>
                <button 
                  type="button" 
                  className="btn-close btn-close-white" 
                  onClick={() => setEditModalOpen(false)}
                  disabled={editLoading}
                ></button>
              </div>
              <form onSubmit={handleSaveEdit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label text-muted small">Descripción</label>
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
                    <label className="form-label text-muted small">Monto ($)</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      min="0.01"
                      className="form-control" 
                      value={editMonto}
                      onChange={(e) => setEditMonto(e.target.value)}
                      required
                      disabled={editLoading}
                    />
                  </div>
                </div>
                <div className="modal-footer border-top border-secondary">
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
