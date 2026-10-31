// src/pages/ConsultarGasto.jsx
import React, { useState, useEffect } from "react";
import { doc, getDoc, updateDoc, deleteField } from "firebase/firestore";
import { gastosPorMes, actualizarMontoActual } from "../services/firebase";
import { MESES, formatoMoneda } from "../utils/formatters";
import MonthYearSelect from "../components/MonthYearSelect";
import BalanceDisplay from "../components/BalanceDisplay";
import Loader from "../components/Loader";

export default function ConsultarGasto() {
  const currentDate = new Date();
  const [mes, setMes] = useState(MESES[currentDate.getMonth()]);
  const [anio, setAnio] = useState(currentDate.getFullYear());
  const [gastos, setGastos] = useState(null);
  const [loading, setLoading] = useState(false);

  // Estado para el modal de edición
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editDescripcion, setEditDescripcion] = useState("");
  const [editMonto, setEditMonto] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  const consultarGasto = async () => {
    setLoading(true);
    const claveMesAño = `${mes}_${anio}`;
    const gastosMesDoc = doc(gastosPorMes, claveMesAño);

    try {
      const docSnap = await getDoc(gastosMesDoc);
      const listaGastos = docSnap.exists() ? docSnap.data().gastos || [] : [];
      setGastos(listaGastos);
    } catch (error) {
      console.error("Error al obtener gastos:", error);
      alert("Error al consultar los gastos.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (index) => {
    const item = gastos[index];
    if (!item) return;
    setEditingIndex(index);
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
    const claveMesAño = `${mes}_${anio}`;
    const gastosMesDoc = doc(gastosPorMes, claveMesAño);

    try {
      const gastoAntiguo = gastos[editingIndex];
      const diferencia = montoNum - gastoAntiguo.monto;

      const nuevaLista = [...gastos];
      nuevaLista[editingIndex] = {
        descripcion: editDescripcion.trim(),
        monto: montoNum
      };

      await updateDoc(gastosMesDoc, { gastos: nuevaLista });
      await actualizarMontoActual(-diferencia);

      setGastos(nuevaLista);
      setEditModalOpen(false);
    } catch (error) {
      console.error("Error al guardar edición de gasto:", error);
      alert("Hubo un error al actualizar el gasto.");
    } finally {
      setEditLoading(false);
    }
  };

  const handleEliminarGasto = async (index) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este gasto?")) {
      return;
    }

    setLoading(true);
    const claveMesAño = `${mes}_${anio}`;
    const gastosMesDoc = doc(gastosPorMes, claveMesAño);

    try {
      const gastoEliminado = gastos[index];
      const montoEliminado = gastoEliminado.monto;

      const nuevaLista = gastos.filter((_, i) => i !== index);

      await updateDoc(gastosMesDoc, {
        gastos: nuevaLista.length > 0 ? nuevaLista : deleteField()
      });

      await actualizarMontoActual(montoEliminado);
      setGastos(nuevaLista);
    } catch (error) {
      console.error("Error al eliminar gasto:", error);
      alert("Hubo un error al eliminar el gasto.");
    } finally {
      setLoading(false);
    }
  };

  const sumaGastos = (gastos || []).reduce((acc, g) => acc + (g.monto || 0), 0);

  return (
    <div className="fade-in d-flex flex-column align-items-center flex-grow-1 p-3 position-relative">
      <div className="container d-flex flex-wrap justify-content-center gap-4">
        {/* Tarjeta de Selección */}
        <div className="card-consulta p-3 rounded shadow">
          <p className="tituloCard h5 fw-bold mb-3">Consulta de gasto:</p>
          <MonthYearSelect mes={mes} setMes={setMes} anio={anio} setAnio={setAnio} />
          <button 
            className="btn btn-secondary w-100" 
            type="button" 
            onClick={consultarGasto}
            disabled={loading}
          >
            {loading ? "Consultando..." : "Consultar"}
          </button>
        </div>

        {/* Resultados de Gastos */}
        <div className="consulta p-3 rounded shadow">
          {loading && <Loader />}

          {!loading && gastos === null && (
            <div className="text-center text-muted p-4">
              <p>Selecciona un mes y año y haz clic en <strong>Consultar</strong>.</p>
            </div>
          )}

          {!loading && gastos !== null && gastos.length === 0 && (
            <table className="table table-striped table-hover mb-0">
              <thead>
                <tr>
                  <td><h4>Gastos de {mes} {anio}</h4></td>
                </tr>
                <tr>
                  <td><p className="text-muted mb-0">El mes seleccionado no posee gastos</p></td>
                </tr>
              </thead>
            </table>
          )}

          {!loading && gastos !== null && gastos.length > 0 && (
            <div>
              <h4 className="mb-3">Gastos de {mes} {anio}</h4>
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
                    {gastos.map((gasto, index) => (
                      <tr key={index}>
                        <td><i className="bi bi-dot fs-5"></i></td>
                        <td>{gasto.descripcion}</td>
                        <td>{formatoMoneda(gasto.monto)}</td>
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
                            onClick={() => handleEliminarGasto(index)}
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
                      <td>{formatoMoneda(sumaGastos)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Editar Gasto */}
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
                <h5 className="modal-title">Editar Gasto</h5>
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

