import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useSecurity } from "../context/SecurityContext";
import { useToast } from "../context/ToastContext";
import { formatoMoneda } from "../utils/formatters";
import { getAuditLogs, clearAuditLogs, exportAuditLogsCSV } from "../services/auditService";
import { createFullBackup, downloadBackupFile, parseAndValidateBackup, restoreFullBackup } from "../services/backupService";

export default function SecurityAuditModal() {
  const { user, isDemo } = useAuth();
  const { isAuditModalOpen, closeAuditModal, requestConfirmation } = useSecurity();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState("backup");
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [filterCategory, setFilterCategory] = useState("TODOS");

  const [isExporting, setIsExporting] = useState(false);
  const [selectedFileText, setSelectedFileText] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const fileInputRef = useRef(null);

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const data = await getAuditLogs(user?.uid, isDemo, 80);
      setLogs(data);
    } catch (err) {
      console.error("Error al cargar registros de auditoría:", err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (isAuditModalOpen && activeTab === "audit") {
      fetchLogs();
    }
  }, [isAuditModalOpen, activeTab, user, isDemo]);

  useEffect(() => {
    const handleNewLog = (e) => {
      if (e.detail) {
        setLogs((prev) => [e.detail, ...prev]);
      }
    };
    const handleCleared = () => setLogs([]);

    window.addEventListener("fintrack-audit-new", handleNewLog);
    window.addEventListener("fintrack-audit-cleared", handleCleared);

    return () => {
      window.removeEventListener("fintrack-audit-new", handleNewLog);
      window.removeEventListener("fintrack-audit-cleared", handleCleared);
    };
  }, []);

  if (!isAuditModalOpen) return null;

  const handleExportBackup = async () => {
    setIsExporting(true);
    try {
      const backup = await createFullBackup(user, isDemo);
      downloadBackupFile(backup.filename, backup.jsonContent);
      showToast("Copia de seguridad generada y descargada con éxito.", "success");
      if (activeTab === "audit") fetchLogs();
    } catch (err) {
      console.error("Error al generar copia de seguridad:", err);
      showToast("No se pudo generar el respaldo: " + err.message, "error");
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".json")) {
      showToast("Por favor selecciona un archivo con extensión .json.", "warning");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      setSelectedFileText(content);
      const validation = parseAndValidateBackup(content);
      setValidationResult(validation);
      if (!validation.valid) {
        showToast("Archivo de respaldo inválido: " + validation.error, "error");
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmRestore = () => {
    if (!validationResult || !validationResult.valid) return;

    const stats = validationResult.stats;
    const dateFormatted = stats.createdAt ? new Date(stats.createdAt).toLocaleString("es-AR") : "Desconocida";

    requestConfirmation({
      title: "¿Restaurar esta copia de seguridad?",
      message: `Estás a punto de reemplazar tus registros actuales por los del archivo de respaldo (${stats.total} transacciones del ${dateFormatted}).`,
      impact: `Tus balances y movimientos se sincronizarán con los datos contenidos en el archivo JSON.`,
      confirmText: "Sí, restaurar datos",
      danger: true,
      onConfirm: async () => {
        setIsRestoring(true);
        try {
          await restoreFullBackup(user, isDemo, validationResult.data);
          showToast("Copia de seguridad restaurada correctamente.", "success");
          setSelectedFileText(null);
          setValidationResult(null);
          if (fileInputRef.current) fileInputRef.current.value = "";
          closeAuditModal();
        } catch (err) {
          console.error("Error al restaurar respaldo:", err);
          showToast("Hubo un error al restaurar: " + err.message, "error");
        } finally {
          setIsRestoring(false);
        }
      }
    });
  };

  const handleClearHistory = () => {
    requestConfirmation({
      title: "¿Vaciar el registro de auditoría?",
      message: "Se eliminarán permanentemente los eventos registrados en el historial de actividad de este dispositivo.",
      impact: "No afectará tus saldos, gastos ni ingresos; solo se limpiará la bitácora de eventos.",
      confirmText: "Sí, vaciar historial",
      danger: true,
      onConfirm: async () => {
        await clearAuditLogs(user?.uid, isDemo);
        setLogs([]);
        showToast("Historial de auditoría vaciado.", "info");
      }
    });
  };

  const filteredLogs = logs.filter((l) => {
    if (filterCategory === "TODOS") return true;
    return (l.category || "GENERAL").toUpperCase() === filterCategory;
  });

  const getCategoryBadge = (cat) => {
    const c = (cat || "GENERAL").toUpperCase();
    switch (c) {
      case "SEGURIDAD":
        return <span className="badge bg-warning text-dark"><i className="bi bi-shield-lock me-1"></i>Seguridad</span>;
      case "GASTOS":
        return <span className="badge bg-danger"><i className="bi bi-arrow-down-circle me-1"></i>Gasto</span>;
      case "INGRESOS":
        return <span className="badge bg-success"><i className="bi bi-arrow-up-circle me-1"></i>Ingreso</span>;
      case "AHORROS":
        return <span className="badge bg-info text-dark"><i className="bi bi-piggy-bank me-1"></i>Ahorro</span>;
      case "RESPALDOS":
        return <span className="badge bg-primary"><i className="bi bi-database-check me-1"></i>Respaldo</span>;
      default:
        return <span className="badge bg-secondary">{c}</span>;
    }
  };

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      role="dialog"
      style={{ backgroundColor: "rgba(15, 23, 42, 0.75)", zIndex: 1080 }}
    >
      <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
        <div className="modal-content border-0 rounded-4 shadow-lg text-dark">
          
          <div className="modal-header border-bottom py-3 px-4">
            <div className="d-flex align-items-center gap-2">
              <div 
                className="rounded-3 d-flex align-items-center justify-content-center bg-success text-white shadow-sm"
                style={{ width: "38px", height: "38px" }}
              >
                <i className="bi bi-shield-check fs-5"></i>
              </div>
              <div>
                <h5 className="modal-title fw-bold fs-6 mb-0">Auditoría & Centro de Respaldos</h5>
                <span className="text-muted small">Capa 4 de Seguridad: Bitácora de actividad y copias de seguridad íntegras</span>
              </div>
            </div>
            <button
              type="button"
              className="btn-close"
              onClick={closeAuditModal}
              aria-label="Cerrar"
            ></button>
          </div>

          <div className="px-4 pt-3 border-bottom bg-light">
            <ul className="nav nav-tabs border-bottom-0 gap-2">
              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link py-2 px-3 fw-semibold border-0 rounded-top-3 ${activeTab === "backup" ? "active text-success bg-white shadow-sm" : "text-secondary"}`}
                  onClick={() => setActiveTab("backup")}
                >
                  <i className="bi bi-database-down me-2"></i>
                  <span>Copias de Seguridad</span>
                </button>
              </li>
              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link py-2 px-3 fw-semibold border-0 rounded-top-3 ${activeTab === "audit" ? "active text-success bg-white shadow-sm" : "text-secondary"}`}
                  onClick={() => setActiveTab("audit")}
                >
                  <i className="bi bi-journal-text me-2"></i>
                  <span>Bitácora de Auditoría ({logs.length})</span>
                </button>
              </li>
            </ul>
          </div>

          <div className="modal-body p-4">
            {activeTab === "backup" && (
              <div className="d-flex flex-column gap-4">
                
                <div className="p-4 rounded-4 border bg-card-alt shadow-sm">
                  <div className="d-flex align-items-start justify-content-between mb-3 flex-wrap gap-2">
                    <div className="d-flex align-items-center gap-3">
                      <div className="p-3 rounded-circle bg-success-subtle text-success">
                        <i className="bi bi-cloud-arrow-down-fill fs-3"></i>
                      </div>
                      <div>
                        <h6 className="fw-bold mb-1 fs-6">Descargar Respaldo Completo (JSON)</h6>
                        <p className="text-muted small mb-0">
                          Exporta todos tus balances, gastos, ingresos y ahorros en un formato estructurado con suma de verificación.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-success rounded-pill px-4 py-2 fw-semibold shadow-sm d-flex align-items-center gap-2"
                      onClick={handleExportBackup}
                      disabled={isExporting}
                    >
                      {isExporting ? (
                        <>
                          <span className="spinner-border spinner-border-sm" role="status"></span>
                          <span>Generando...</span>
                        </>
                      ) : (
                        <>
                          <i className="bi bi-download"></i>
                          <span>Descargar Copia de Seguridad</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="d-flex flex-wrap gap-2 pt-2 border-top">
                    <span className="badge bg-light text-secondary border">
                      <i className="bi bi-check2-circle text-success me-1"></i> Formato universal JSON
                    </span>
                    <span className="badge bg-light text-secondary border">
                      <i className="bi bi-shield-lock text-primary me-1"></i> Checksum de Integridad
                    </span>
                    <span className="badge bg-light text-secondary border">
                      <i className="bi bi-hdd-network text-info me-1"></i> Compatible Firebase & Demo
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-4 border bg-card-alt shadow-sm">
                  <div className="d-flex align-items-start gap-3 mb-3">
                    <div className="p-3 rounded-circle bg-primary-subtle text-primary">
                      <i className="bi bi-cloud-arrow-up-fill fs-3"></i>
                    </div>
                    <div>
                      <h6 className="fw-bold mb-1 fs-6">Restaurar Copia de Seguridad</h6>
                      <p className="text-muted small mb-0">
                        Selecciona un archivo <code>FinTrack_Backup_*.json</code> previamente exportado para recuperar tu historial contable.
                      </p>
                    </div>
                  </div>

                  <div className="mb-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json"
                      className="form-control rounded-3"
                      onChange={handleFileChange}
                    />
                  </div>

                  {validationResult && (
                    <div className={`p-3 rounded-3 mb-3 border ${validationResult.valid ? 'bg-success-subtle border-success' : 'bg-danger-subtle border-danger'}`}>
                      {validationResult.valid ? (
                        <div>
                          <div className="d-flex align-items-center gap-2 mb-2 text-success fw-bold small">
                            <i className="bi bi-shield-check fs-5"></i>
                            <span>Copia de seguridad válida y verificada</span>
                          </div>
                          <div className="row g-2 small text-dark">
                            <div className="col-sm-6">
                              <strong>Fecha del Respaldo:</strong>{" "}
                              {new Date(validationResult.stats.createdAt).toLocaleString("es-AR")}
                            </div>
                            <div className="col-sm-6">
                              <strong>Usuario de origen:</strong> {validationResult.stats.user}
                            </div>
                            <div className="col-12 mt-2">
                              <span className="badge bg-dark me-2">{validationResult.stats.total} transacciones totales</span>
                              <span className="badge bg-danger me-2">{validationResult.stats.gastos} gastos</span>
                              <span className="badge bg-success me-2">{validationResult.stats.ingresos} ingresos</span>
                              <span className="badge bg-info text-dark">{validationResult.stats.ahorros} ahorros</span>
                            </div>
                          </div>

                          <div className="mt-3 pt-2 border-top border-success-subtle d-flex justify-content-end">
                            <button
                              type="button"
                              className="btn btn-success btn-sm rounded-pill px-4 py-2 fw-bold shadow-sm d-flex align-items-center gap-2"
                              onClick={handleConfirmRestore}
                              disabled={isRestoring}
                            >
                              {isRestoring ? (
                                <>
                                  <span className="spinner-border spinner-border-sm" role="status"></span>
                                  <span>Restaurando...</span>
                                </>
                              ) : (
                                <>
                                  <i className="bi bi-arrow-repeat"></i>
                                  <span>Restaurar mis datos ahora</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="d-flex align-items-center gap-2 text-danger small fw-semibold">
                          <i className="bi bi-exclamation-octagon-fill fs-5"></i>
                          <span>{validationResult.error}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="small text-muted fst-italic">
                    <i className="bi bi-info-circle me-1"></i>
                    La restauración se realiza mediante transacciones atómicas para asegurar que ningún registro quede incompleto.
                  </div>
                </div>

              </div>
            )}

            {activeTab === "audit" && (
              <div className="d-flex flex-column gap-3">
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 pb-2 border-bottom">
                  <div className="d-flex align-items-center gap-2">
                    <label className="small text-muted fw-semibold">Categoría:</label>
                    <select
                      className="form-select form-select-sm rounded-pill"
                      style={{ width: "auto" }}
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                    >
                      <option value="TODOS">Todas las actividades</option>
                      <option value="SEGURIDAD">Seguridad & Sesión</option>
                      <option value="GASTOS">Gastos</option>
                      <option value="INGRESOS">Ingresos</option>
                      <option value="AHORROS">Ahorros</option>
                      <option value="RESPALDOS">Respaldos</option>
                    </select>
                  </div>

                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm rounded-pill px-3 d-flex align-items-center gap-1"
                      onClick={() => exportAuditLogsCSV(filteredLogs)}
                      disabled={filteredLogs.length === 0}
                    >
                      <i className="bi bi-file-earmark-spreadsheet"></i>
                      <span>Exportar CSV</span>
                    </button>

                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm rounded-pill px-3 d-flex align-items-center gap-1"
                      onClick={handleClearHistory}
                      disabled={logs.length === 0}
                    >
                      <i className="bi bi-trash"></i>
                      <span>Vaciar</span>
                    </button>
                  </div>
                </div>

                {loadingLogs ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-success" role="status"></div>
                    <p className="text-muted small mt-2">Cargando bitácora de auditoría...</p>
                  </div>
                ) : filteredLogs.length === 0 ? (
                  <div className="text-center py-5 text-muted">
                    <i className="bi bi-journal-check fs-1 text-secondary opacity-50 mb-2 d-block"></i>
                    <p className="mb-0 fw-semibold">No hay registros de auditoría en esta categoría.</p>
                    <span className="small">Las acciones contables y de seguridad que realices quedarán registradas aquí.</span>
                  </div>
                ) : (
                  <div className="table-responsive rounded-3 border" style={{ maxHeight: "380px" }}>
                    <table className="table table-hover table-sm align-middle mb-0">
                      <thead className="table-light small text-muted text-uppercase">
                        <tr>
                          <th className="ps-3 py-2">Fecha / Hora</th>
                          <th className="py-2">Categoría</th>
                          <th className="py-2">Detalles</th>
                          <th className="py-2 text-end">Monto</th>
                          <th className="pe-3 py-2 text-end">Dispositivo</th>
                        </tr>
                      </thead>
                      <tbody className="small">
                        {filteredLogs.map((item) => (
                          <tr key={item.id}>
                            <td className="ps-3 py-2 text-nowrap text-muted" style={{ fontSize: "0.78rem" }}>
                              {item.timestamp ? new Date(item.timestamp).toLocaleString("es-AR") : "-"}
                            </td>
                            <td className="py-2">
                              {getCategoryBadge(item.category)}
                            </td>
                            <td className="py-2">
                              <span className="fw-semibold text-dark">{item.details}</span>
                            </td>
                            <td className="py-2 text-end text-nowrap fw-bold">
                              {item.amount !== null && item.amount !== undefined ? (
                                <span className={item.category === "GASTOS" ? "text-danger" : "text-success"}>
                                  {formatoMoneda(item.amount, item.currency || "ARS")}
                                </span>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                            <td className="pe-3 py-2 text-end text-muted small" style={{ fontSize: "0.75rem" }}>
                              {item.device || "Web"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

              </div>
            )}
          </div>

          <div className="modal-footer border-top py-2 px-4">
            <button
              type="button"
              className="btn btn-secondary btn-sm rounded-pill px-4"
              onClick={closeAuditModal}
            >
              Cerrar
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

