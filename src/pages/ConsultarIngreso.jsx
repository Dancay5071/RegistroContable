// src/pages/ConsultarIngreso.jsx
import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
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
import BalanceDisplay from "../components/BalanceDisplay";
import Loader from "../components/Loader";

export default function ConsultarIngreso() {
  const { user, isDemo } = useAuth();
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
      alert("Error al consultar los ingresos: " + error.message);
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
      alert("Por favor, ingresa una descripción y un monto válido.");
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

      setEditModalOpen(false);
    } catch (error) {
      console.error("Error al guardar edición de ingreso:", error);
      alert("Hubo un error al actualizar el ingreso: " + error.message);
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
    } catch (error) {
      console.error("Error al eliminar ingreso:", error);
      alert("Hubo un error al eliminar el ingreso: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const sumaIngresos = (ingresos || []).reduce((acc, ing) => acc + (Number(ing.monto) || 0), 0);

  return (
    <div className="fade-in d-flex flex-column align-items-center flex-grow-1 p-3 position-relative">
      <div className="container d-flex flex-wrap justify-content-center gap-4">
        {/* Tarjeta de Selección */}
        <div className="card-consulta p-3 rounded shadow">
          <p className="tituloCard h5 fw-bold mb-3">Consulta de ingreso:</p>
          <MonthYearSelect mes={mes} setMes={setMes} anio={anio} setAnio={setAnio} />
          <button 
            className="btn btn-secondary w-100" 
            type="button" 
            onClick={consultarIngreso}
            disabled={loading}
          >
            {loading ? "Consultando..." : "Consultar"}
          </button>
        </div>

        {/* Resultados de Ingresos */}
        <div className="consulta p-3 rounded shadow">
          {loading && <Loader />}

          {!loading && ingresos === null && (
            <div className="text-center text-muted p-4">
              <p>Selecciona un mes y año y haz clic en <strong>Consultar</strong>.</p>
            </div>
          )}

          {!loading && ingresos !== null && ingresos.length === 0 && (
            <table className="table table-striped table-hover mb-0">
              <thead>
                <tr>
                  <td><h4>Ingresos de {mes} {anio}</h4></td>
                </tr>
                <tr>
                  <td><p className="text-muted mb-0">El mes seleccionado no posee ingresos</p></td>
                </tr>
              </thead>
            </table>
          )}

          {!loading && ingresos !== null && ingresos.length > 0 && (
            <div>
              <h4 className="mb-3">Ingresos de {mes} {anio}</h4>
              <div className="table-responsive">
                <table className="table table-striped table-hover align-middle">
                  <thead>
                    <tr>
                      <th scope="col" style={{ width: "30px" }}></th>
                      <th>Descripción</th>
                      <th>Monto</th>
                      <th className="text-end">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ingresos.map((ingreso, index) => (
                      <tr key={ingreso.id || index}>
                        <td><i className="bi bi-dot fs-5"></i></td>
                        <td>{ingreso.descripcion}</td>
                        <td>{formatoMoneda(ingreso.monto)}</td>
                        <td className="text-end">
                          <button 
                            type="button" 
                            className="btn btn-outline-dark btn-sm me-2" 
                            title="Editar" 
                            onClick={() => handleOpenEdit(index)}
                          >
                            <i className="bi bi-pencil-fill"></i>
                          </button>
                          <button 
                            type="button" 
                            className="btn btn-outline-dark btn-sm" 
                            title="Eliminar" 
                            onClick={() => handleEliminarIngreso(index)}
                          >
                            <i className="bi bi-x fs-6"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="table-dark">
                    <tr>
                      <td>Total</td>
                      <td></td>
                      <td>{formatoMoneda(sumaIngresos)}</td>
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
          style={{ backgroundColor: "rgba(0, 0, 0, 0.6)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content text-dark">
              <div className="modal-header">
                <h5 className="modal-title">Editar Ingreso</h5>
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
                    <label className="form-label">Descripción</label>
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
                    <label className="form-label">Monto</label>
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
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setEditModalOpen(false)}
                    disabled={editLoading}
                  >
                    Cerrar
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
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

      <BalanceDisplay />
    </div>
  );
}
