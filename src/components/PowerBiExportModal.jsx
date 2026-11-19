import React, { useState, useEffect, useMemo, useCallback } from "react";
import { usePowerBiExport } from "../context/PowerBiExportContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useDolar } from "../hooks/useDolar";
import { getAllUserTransacciones } from "../services/dbService";
import { getDemoAllTransacciones } from "../services/demoData";
import {
  generatePowerBiFlatCSV,
  generateStarSchemaFactCSV,
  generateStarSchemaDimCategoriasCSV,
  generateStarSchemaDimTiempoCSV,
  triggerDownload,
  DAX_MEASURES,
  POWER_QUERY_M_TEMPLATE
} from "../utils/powerBiExport";

export default function PowerBiExportModal() {
  const { isExportOpen, closePowerBiExport } = usePowerBiExport();
  const { user, isDemo } = useAuth();
  const { showToast } = useToast();
  const { blue } = useDolar();

  const [activeTab, setActiveTab] = useState("datasets");
  const [delimiter, setDelimiter] = useState(";");
  const [loadingData, setLoadingData] = useState(false);
  const [transacciones, setTransacciones] = useState([]);
  const [copiedId, setCopiedId] = useState(null);
  const [copiedAllDax, setCopiedAllDax] = useState(false);
  const [copiedM, setCopiedM] = useState(false);
  const [filtroDaxCat, setFiltroDaxCat] = useState("todas");

  const cotizacionUSD = blue?.venta && blue.venta > 0 ? blue.venta : 1550;

  const cargarDatos = useCallback(async () => {
    setLoadingData(true);
    try {
      if (isDemo) {
        const data = getDemoAllTransacciones();
        setTransacciones(data);
      } else if (user?.uid) {
        const data = await getAllUserTransacciones(user.uid);
        setTransacciones(data);
      }
    } catch (err) {
      console.error("Error al cargar transacciones para Power BI:", err);
      showToast("Error al cargar datos para exportación: " + err.message, "error");
    } finally {
      setLoadingData(false);
    }
  }, [isDemo, user?.uid, showToast]);

  useEffect(() => {
    if (isExportOpen) {
      cargarDatos();
    }
  }, [isExportOpen, cargarDatos]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isExportOpen) {
        closePowerBiExport();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isExportOpen, closePowerBiExport]);

  const stats = useMemo(() => {
    const total = transacciones.length;
    const gastos = transacciones.filter(t => t.tipo === "gasto").length;
    const ingresos = transacciones.filter(t => t.tipo === "ingreso").length;
    const ahorros = transacciones.filter(t => t.tipo === "ahorro" || t.tipo === "extraccion").length;
    return { total, gastos, ingresos, ahorros };
  }, [transacciones]);

  const handleDescargarPlano = () => {
    try {
      const csvContent = generatePowerBiFlatCSV(transacciones, cotizacionUSD, delimiter);
      const filename = `FinTrack_PowerBI_Dataset_${new Date().getFullYear()}.csv`;
      triggerDownload(filename, csvContent);
      showToast("Dataset unificado descargado con éxito.", "success");
    } catch (err) {
      console.error("Error al generar CSV plano:", err);
      showToast("Error al exportar dataset: " + err.message, "error");
    }
  };

  const handleDescargarEsquemaEstrella = () => {
    try {
      const fact = generateStarSchemaFactCSV(transacciones, cotizacionUSD, delimiter);
      const dimCat = generateStarSchemaDimCategoriasCSV(transacciones, delimiter);
      const dimTiempo = generateStarSchemaDimTiempoCSV(transacciones, delimiter);

      triggerDownload("Fact_Transacciones.csv", fact);
      setTimeout(() => triggerDownload("Dim_Categorias.csv", dimCat), 300);
      setTimeout(() => triggerDownload("Dim_Tiempo.csv", dimTiempo), 600);

      showToast("Paquete de 3 tablas dimensionales descargado con éxito.", "success");
    } catch (err) {
      console.error("Error al exportar esquema estrella:", err);
      showToast("Error al exportar esquema estrella: " + err.message, "error");
    }
  };

  const handleDescargarFactSolo = () => {
    const fact = generateStarSchemaFactCSV(transacciones, cotizacionUSD, delimiter);
    triggerDownload("Fact_Transacciones.csv", fact);
    showToast("Tabla Fact_Transacciones.csv descargada.", "success");
  };

  const handleDescargarDimCatSolo = () => {
    const dimCat = generateStarSchemaDimCategoriasCSV(transacciones, delimiter);
    triggerDownload("Dim_Categorias.csv", dimCat);
    showToast("Tabla Dim_Categorias.csv descargada.", "success");
  };

  const handleDescargarDimTiempoSolo = () => {
    const dimTiempo = generateStarSchemaDimTiempoCSV(transacciones, delimiter);
    triggerDownload("Dim_Tiempo.csv", dimTiempo);
    showToast("Tabla Dim_Tiempo.csv descargada.", "success");
  };

  const handleCopiarDaxIndividual = (measure) => {
    navigator.clipboard.writeText(measure.formula);
    setCopiedId(measure.id);
    showToast(`Medida DAX "${measure.nombre}" copiada al portapapeles.`, "success");
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleCopiarTodoDax = () => {
    const fullText = DAX_MEASURES.map(m => `--- ${m.nombre} (${m.categoria})\n${m.formula}`).join("\n\n");
    navigator.clipboard.writeText(fullText);
    setCopiedAllDax(true);
    showToast("Todas las fórmulas DAX copiadas al portapapeles.", "success");
    setTimeout(() => setCopiedAllDax(false), 2500);
  };

  const handleCopiarM = () => {
    navigator.clipboard.writeText(POWER_QUERY_M_TEMPLATE);
    setCopiedM(true);
    showToast("Script Power Query M copiado al portapapeles.", "success");
    setTimeout(() => setCopiedM(false), 2500);
  };

  const daxCategorias = useMemo(() => {
    const set = new Set();
    DAX_MEASURES.forEach(m => set.add(m.categoria));
    return Array.from(set);
  }, []);

  const daxFiltradas = useMemo(() => {
    if (filtroDaxCat === "todas") return DAX_MEASURES;
    return DAX_MEASURES.filter(m => m.categoria === filtroDaxCat);
  }, [filtroDaxCat]);

  if (!isExportOpen) return null;

  return (
    <div 
      className="modal-backdrop-custom d-flex align-items-center justify-content-center p-2 p-md-3" 
      style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1060, backgroundColor: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) closePowerBiExport(); }}
    >
      <div 
        className="principal rounded-4 shadow-lg border w-100 d-flex flex-column overflow-hidden" 
        style={{ maxWidth: "860px", maxHeight: "92vh" }}
      >
        <div className="d-flex align-items-center justify-content-between px-3 px-md-4 py-3 border-bottom" style={{ backgroundColor: "var(--bg-card)" }}>
          <div className="d-flex align-items-center gap-2 gap-md-3">
            <div 
              className="rounded-3 d-flex align-items-center justify-content-center text-dark shadow-sm"
              style={{ width: "42px", height: "42px", backgroundColor: "#F2C811", fontWeight: 800, fontSize: "1.2rem" }}
            >
              <i className="bi bi-file-earmark-bar-graph-fill"></i>
            </div>
            <div>
              <div className="d-flex align-items-center gap-2">
                <h5 className="fw-bold text-dark mb-0 fs-6 fs-md-5">Power BI y Excel Analytics Hub</h5>
                <span className="badge rounded-pill bg-warning text-dark border border-warning-subtle px-2 py-0" style={{ fontSize: "0.68rem" }}>
                  PRO
                </span>
              </div>
              <p className="small text-muted mb-0" style={{ fontSize: "0.78rem" }}>
                Exportación dimensional, scripts de carga M y fórmulas DAX de alto rendimiento
              </p>
            </div>
          </div>
          <button 
            type="button" 
            className="btn-close ms-2" 
            onClick={closePowerBiExport} 
            aria-label="Cerrar modal"
          ></button>
        </div>

        <div className="px-3 px-md-4 py-2 border-bottom d-flex flex-wrap align-items-center justify-content-between gap-2 flex-shrink-0" style={{ backgroundColor: "var(--bg-card-alt)", fontSize: "0.82rem" }}>
          <div className="d-flex align-items-center gap-2 text-muted">
            <i className="bi bi-database-check text-success"></i>
            <span>Auditoría de datos:</span>
            <span className="fw-bold text-dark">{stats.total} transacciones</span>
            <span className="badge bg-danger bg-opacity-10 text-danger border border-danger-subtle px-2">{stats.gastos} gastos</span>
            <span className="badge bg-success bg-opacity-10 text-success border border-success-subtle px-2">{stats.ingresos} ingresos</span>
            <span className="badge bg-warning bg-opacity-10 text-warning border border-warning-subtle px-2">{stats.ahorros} ahorros</span>
          </div>

          <div className="d-flex align-items-center gap-1 text-muted">
            <i className="bi bi-currency-exchange text-primary"></i>
            <span>Tipo de cambio aplicado:</span>
            <span className="badge bg-primary bg-opacity-10 text-primary border border-primary-subtle fw-semibold">
              USD Blue = ${cotizacionUSD.toLocaleString("es-AR")}
            </span>
          </div>
        </div>

        <div className="d-flex border-bottom px-3 px-md-4 pt-2 gap-1 overflow-x-auto flex-shrink-0" style={{ backgroundColor: "var(--bg-card)", minHeight: "48px" }}>
          <button
            type="button"
            className={`btn btn-sm border-0 border-bottom border-3 rounded-0 px-3 py-2 fw-semibold d-flex align-items-center gap-1 text-nowrap flex-shrink-0 ${activeTab === 'datasets' ? 'border-warning active' : 'border-transparent text-muted'}`}
            style={{ color: activeTab === 'datasets' ? 'var(--text-main)' : 'var(--text-muted)' }}
            onClick={() => setActiveTab('datasets')}
          >
            <i className="bi bi-download text-warning"></i>
            <span>Descarga de Datasets</span>
          </button>

          <button
            type="button"
            className={`btn btn-sm border-0 border-bottom border-3 rounded-0 px-3 py-2 fw-semibold d-flex align-items-center gap-1 text-nowrap flex-shrink-0 ${activeTab === 'dax' ? 'border-warning active' : 'border-transparent text-muted'}`}
            style={{ color: activeTab === 'dax' ? 'var(--text-main)' : 'var(--text-muted)' }}
            onClick={() => setActiveTab('dax')}
          >
            <i className="bi bi-code-square text-primary"></i>
            <span>Medidas DAX ({DAX_MEASURES.length})</span>
          </button>

          <button
            type="button"
            className={`btn btn-sm border-0 border-bottom border-3 rounded-0 px-3 py-2 fw-semibold d-flex align-items-center gap-1 text-nowrap flex-shrink-0 ${activeTab === 'm' ? 'border-warning active' : 'border-transparent text-muted'}`}
            style={{ color: activeTab === 'm' ? 'var(--text-main)' : 'var(--text-muted)' }}
            onClick={() => setActiveTab('m')}
          >
            <i className="bi bi-lightning-charge text-warning"></i>
            <span>Power Query M</span>
          </button>

          <button
            type="button"
            className={`btn btn-sm border-0 border-bottom border-3 rounded-0 px-3 py-2 fw-semibold d-flex align-items-center gap-1 text-nowrap flex-shrink-0 ${activeTab === 'guia' ? 'border-warning active' : 'border-transparent text-muted'}`}
            style={{ color: activeTab === 'guia' ? 'var(--text-main)' : 'var(--text-muted)' }}
            onClick={() => setActiveTab('guia')}
          >
            <i className="bi bi-info-circle text-info"></i>
            <span>Guía Rápida (3 Pasos)</span>
          </button>
        </div>

        <div className="p-3 p-md-4 overflow-auto flex-grow-1" style={{ backgroundColor: "var(--bg-main)" }}>
          {activeTab === "datasets" && (
            <div className="d-flex flex-column gap-3">
              <div className="p-3 rounded-3 border d-flex flex-wrap align-items-center justify-content-between gap-2" style={{ backgroundColor: "var(--bg-card)" }}>
                <div>
                  <div className="fw-bold text-dark small mb-1">
                    <i className="bi bi-sliders me-1 text-primary"></i>
                    Configuración de Formato Regional y Delimitador
                  </div>
                  <p className="text-muted small mb-0">
                    Ajusta el delimitador según la configuración regional de tu Windows y Microsoft Excel o Power BI Desktop:
                  </p>
                </div>

                <div className="btn-group btn-group-sm" role="group">
                  <button
                    type="button"
                    className={`btn fw-semibold ${delimiter === ';' ? 'btn-primary shadow-sm' : 'btn-outline-secondary'}`}
                    onClick={() => setDelimiter(';')}
                  >
                    ; (Punto y coma) • Español / Argentina
                  </button>
                  <button
                    type="button"
                    className={`btn fw-semibold ${delimiter === ',' ? 'btn-primary shadow-sm' : 'btn-outline-secondary'}`}
                    onClick={() => setDelimiter(',')}
                  >
                    , (Coma) • Inglés / USA
                  </button>
                </div>
              </div>

              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <div className="h-100 p-3 p-md-4 rounded-4 border shadow-sm d-flex flex-column justify-content-between position-relative" style={{ backgroundColor: "var(--bg-card)" }}>
                    <div className="position-absolute top-0 end-0 m-3">
                      <span className="badge rounded-pill bg-success bg-opacity-10 text-success border border-success-subtle fw-semibold px-2 py-1">
                        Más Utilizado
                      </span>
                    </div>

                    <div>
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <div className="rounded-3 d-flex align-items-center justify-content-center text-primary bg-primary bg-opacity-10" style={{ width: "36px", height: "36px" }}>
                          <i className="bi bi-table fs-5"></i>
                        </div>
                        <h6 className="fw-bold text-dark mb-0">Dataset Plano Unificado</h6>
                      </div>

                      <p className="text-muted small mb-3">
                        Archivo CSV único con todas tus transacciones integradas y desnormalizadas. Listo para importar en Power BI o Excel sin necesidad de vincular tablas ni modelar relaciones.
                      </p>

                      <div className="p-2 rounded-3 mb-3" style={{ backgroundColor: "var(--bg-card-alt)", fontSize: "0.78rem" }}>
                        <div className="text-muted mb-1 fw-semibold">Columnas incluidas (23 atributos):</div>
                        <div className="text-dark font-monospace" style={{ fontSize: "0.72rem", lineHeight: 1.4 }}>
                          ID, Fecha, Año, Mes, Trimestre, Tipo, Flujo_Caja, Categoría, Monto_ARS, Monto_USD, Estado_Pago, Vencimiento...
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn btn-primary w-100 fw-semibold d-flex align-items-center justify-content-center gap-2 shadow-sm py-2"
                      onClick={handleDescargarPlano}
                      disabled={loadingData}
                    >
                      <i className="bi bi-file-earmark-arrow-down"></i>
                      <span>Descargar Dataset Plano (.CSV)</span>
                    </button>
                  </div>
                </div>

                <div className="col-12 col-md-6">
                  <div className="h-100 p-3 p-md-4 rounded-4 border shadow-sm d-flex flex-column justify-content-between position-relative" style={{ backgroundColor: "var(--bg-card)" }}>
                    <div className="position-absolute top-0 end-0 m-3">
                      <span className="badge rounded-pill bg-warning bg-opacity-10 text-warning border border-warning-subtle fw-semibold px-2 py-1">
                        Arquitectura BI
                      </span>
                    </div>

                    <div>
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <div className="rounded-3 d-flex align-items-center justify-content-center text-warning bg-warning bg-opacity-10" style={{ width: "36px", height: "36px" }}>
                          <i className="bi bi-diagram-3-fill fs-5"></i>
                        </div>
                        <h6 className="fw-bold text-dark mb-0">Modelo Dimensional Estrella</h6>
                      </div>

                      <p className="text-muted small mb-3">
                        Modelo relacional óptimo en Estrella (Star Schema 3NF). Separa la tabla de Hechos (Fact) de las tablas de Dimensión para consultas DAX veloces.
                      </p>

                      <div className="d-flex flex-column gap-1 mb-3" style={{ fontSize: "0.78rem" }}>
                        <div className="d-flex align-items-center justify-content-between p-2 rounded-2 border" style={{ backgroundColor: "var(--bg-card-alt)" }}>
                          <div className="d-flex align-items-center gap-2">
                            <i className="bi bi-table text-danger"></i>
                            <span className="fw-bold">Fact_Transacciones.csv</span>
                          </div>
                          <button type="button" className="btn btn-link btn-sm p-0 text-decoration-none" onClick={handleDescargarFactSolo}>
                            Descargar
                          </button>
                        </div>

                        <div className="d-flex align-items-center justify-content-between p-2 rounded-2 border" style={{ backgroundColor: "var(--bg-card-alt)" }}>
                          <div className="d-flex align-items-center gap-2">
                            <i className="bi bi-tag text-success"></i>
                            <span className="fw-bold">Dim_Categorias.csv</span>
                          </div>
                          <button type="button" className="btn btn-link btn-sm p-0 text-decoration-none" onClick={handleDescargarDimCatSolo}>
                            Descargar
                          </button>
                        </div>

                        <div className="d-flex align-items-center justify-content-between p-2 rounded-2 border" style={{ backgroundColor: "var(--bg-card-alt)" }}>
                          <div className="d-flex align-items-center gap-2">
                            <i className="bi bi-calendar-event text-primary"></i>
                            <span className="fw-bold">Dim_Tiempo.csv</span>
                          </div>
                          <button type="button" className="btn btn-link btn-sm p-0 text-decoration-none" onClick={handleDescargarDimTiempoSolo}>
                            Descargar
                          </button>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn btn-outline-dark w-100 fw-semibold d-flex align-items-center justify-content-center gap-2 shadow-sm py-2"
                      onClick={handleDescargarEsquemaEstrella}
                      disabled={loadingData}
                    >
                      <i className="bi bi-folder-symlink"></i>
                      <span>Descargar Paquete Completo (3 Archivos)</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "dax" && (
            <div className="d-flex flex-column gap-3">
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 p-3 rounded-3 border" style={{ backgroundColor: "var(--bg-card)" }}>
                <div>
                  <h6 className="fw-bold text-dark mb-1">Medidas DAX para Power BI Desktop</h6>
                  <p className="text-muted small mb-0">
                    Copia y pega estas expresiones DAX en Power BI (Nueva Medida) para automatizar los KPIs financieros de tu tablero.
                  </p>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <select 
                    className="form-select form-select-sm" 
                    value={filtroDaxCat}
                    onChange={(e) => setFiltroDaxCat(e.target.value)}
                    style={{ minWidth: "160px" }}
                  >
                    <option value="todas">Todas las categorías</option>
                    {daxCategorias.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>

                  <button
                    type="button"
                    className={`btn btn-sm fw-semibold shadow-sm text-nowrap ${copiedAllDax ? 'btn-success' : 'btn-dark'}`}
                    onClick={handleCopiarTodoDax}
                  >
                    <i className={`bi ${copiedAllDax ? 'bi-check2' : 'bi-clipboard-check'} me-1`}></i>
                    {copiedAllDax ? "¡Copiadas Todas!" : "Copiar Todas"}
                  </button>
                </div>
              </div>

              <div className="row g-3">
                {daxFiltradas.map((measure) => {
                  const isCopied = copiedId === measure.id;
                  return (
                    <div key={measure.id} className="col-12 col-md-6">
                      <div className="p-3 rounded-4 border shadow-sm h-100 d-flex flex-column justify-content-between" style={{ backgroundColor: "var(--bg-card)" }}>
                        <div>
                          <div className="d-flex align-items-center justify-content-between gap-2 mb-1">
                            <span className="fw-bold text-dark small">{measure.nombre}</span>
                            <span className="badge rounded-pill bg-secondary bg-opacity-10 text-secondary border px-2 py-0" style={{ fontSize: "0.68rem" }}>
                              {measure.categoria}
                            </span>
                          </div>
                          <p className="text-muted small mb-2" style={{ fontSize: "0.78rem" }}>{measure.descripcion}</p>
                          <pre 
                            className="p-2 rounded-3 text-dark mb-3 font-monospace overflow-auto" 
                            style={{ backgroundColor: "var(--bg-card-alt)", fontSize: "0.72rem", maxHeight: "120px", border: "1px solid var(--border-subtle)" }}
                          >
                            <code>{measure.formula}</code>
                          </pre>
                        </div>

                        <button
                          type="button"
                          className={`btn btn-sm w-100 fw-semibold d-flex align-items-center justify-content-center gap-1 ${isCopied ? 'btn-success' : 'btn-outline-primary'}`}
                          onClick={() => handleCopiarDaxIndividual(measure)}
                        >
                          <i className={`bi ${isCopied ? 'bi-check-lg' : 'bi-clipboard'}`}></i>
                          <span>{isCopied ? "¡Fórmula Copiada!" : "Copiar Medida DAX"}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "m" && (
            <div className="d-flex flex-column gap-3">
              <div className="p-3 rounded-3 border" style={{ backgroundColor: "var(--bg-card)" }}>
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
                  <div>
                    <h6 className="fw-bold text-dark mb-1">Script de Carga Power Query (Lenguaje M)</h6>
                    <p className="text-muted small mb-0">
                      Permite cargar y tipar automáticamente todas las 23 columnas de tu dataset en Power BI Desktop sin intervención manual.
                    </p>
                  </div>
                  <button
                    type="button"
                    className={`btn btn-sm fw-semibold shadow-sm ${copiedM ? 'btn-success' : 'btn-primary'}`}
                    onClick={handleCopiarM}
                  >
                    <i className={`bi ${copiedM ? 'bi-check2' : 'bi-clipboard'} me-1`}></i>
                    {copiedM ? "¡Código M Copiado!" : "Copiar Script M"}
                  </button>
                </div>

                <div className="p-2 rounded-2 mb-3 small text-muted" style={{ backgroundColor: "var(--bg-card-alt)", fontSize: "0.78rem" }}>
                  <strong>Instrucciones:</strong> En Power BI Desktop, ve a <em>Transformar Datos</em> &gt; <em>Nueva Fuente</em> &gt; <em>Consulta en Blanco</em> &gt; <em>Editor Avanzado</em>. Reemplaza el texto con el bloque inferior y actualiza la ruta del archivo local.
                </div>

                <pre 
                  className="p-3 rounded-3 font-monospace text-dark overflow-auto mb-0" 
                  style={{ backgroundColor: "var(--bg-card-alt)", fontSize: "0.75rem", maxHeight: "360px", border: "1px solid var(--border-subtle)" }}
                >
                  <code>{POWER_QUERY_M_TEMPLATE}</code>
                </pre>
              </div>
            </div>
          )}

          {activeTab === "guia" && (
            <div className="d-flex flex-column gap-3">
              <div className="p-3 rounded-3 border" style={{ backgroundColor: "var(--bg-card)" }}>
                <h6 className="fw-bold text-dark mb-1">Guía Paso a Paso: Tu Primer Tablero en Power BI Desktop</h6>
                <p className="text-muted small mb-0">
                  Sigue estos 3 pasos simples para construir un informe financiero profesional en menos de 2 minutos:
                </p>
              </div>

              <div className="row g-3">
                <div className="col-12 col-md-4">
                  <div className="p-3 rounded-4 border shadow-sm h-100 d-flex flex-column" style={{ backgroundColor: "var(--bg-card)" }}>
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <span className="badge rounded-circle bg-warning text-dark fw-bold d-flex align-items-center justify-content-center" style={{ width: "28px", height: "28px" }}>1</span>
                      <h6 className="fw-bold text-dark mb-0">Exportar Dataset</h6>
                    </div>
                    <p className="text-muted small mb-0">
                      En la pestaña <strong>Descarga de Datasets</strong>, selecciona el delimitador de tu región y haz clic en <em>Descargar Dataset Plano (.CSV)</em>. Guárdalo en una carpeta de tu preferencia (ej. <code>C:\FinTrack</code>).
                    </p>
                  </div>
                </div>

                <div className="col-12 col-md-4">
                  <div className="p-3 rounded-4 border shadow-sm h-100 d-flex flex-column" style={{ backgroundColor: "var(--bg-card)" }}>
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <span className="badge rounded-circle bg-primary text-white fw-bold d-flex align-items-center justify-content-center" style={{ width: "28px", height: "28px" }}>2</span>
                      <h6 className="fw-bold text-dark mb-0">Abrir en Power BI</h6>
                    </div>
                    <p className="text-muted small mb-0">
                      Abre Microsoft Power BI Desktop (gratuito). Haz clic en la cinta superior en <strong>Obtener Datos</strong> &gt; <strong>Texto o CSV</strong>. Selecciona el archivo descargado y presiona <strong>Cargar</strong>.
                    </p>
                  </div>
                </div>

                <div className="col-12 col-md-4">
                  <div className="p-3 rounded-4 border shadow-sm h-100 d-flex flex-column" style={{ backgroundColor: "var(--bg-card)" }}>
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <span className="badge rounded-circle bg-success text-white fw-bold d-flex align-items-center justify-content-center" style={{ width: "28px", height: "28px" }}>3</span>
                      <h6 className="fw-bold text-dark mb-0">Crear Visualizaciones</h6>
                    </div>
                    <p className="text-muted small mb-0">
                      Copia las <strong>Medidas DAX</strong> de la pestaña 2 y pégalas como nuevas medidas. ¡Arrastra tus gráficos de barras, matriz de categorías o tarjetas KPI para ver tu flujo de fondos en tiempo real!
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-3 border d-flex align-items-center gap-3" style={{ backgroundColor: "var(--bg-card)" }}>
                <i className="bi bi-lightbulb-fill text-warning fs-3"></i>
                <div className="small text-muted">
                  <strong className="text-dark">Consejo Senior de Arquitectura:</strong> Si utilizas Power BI Service o Fabric y quieres programar actualizaciones automáticas, puedes sincronizar la carpeta donde guardas el CSV con Microsoft OneDrive o Google Drive y apuntar tu Power BI a la ruta cloud.
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="d-flex align-items-center justify-content-between px-3 px-md-4 py-3 border-top" style={{ backgroundColor: "var(--bg-card)" }}>
          <div className="small text-muted">
            Compatibilidad: <span className="fw-semibold text-dark">Power BI Desktop, Power BI Service, Microsoft Fabric, Excel Power Pivot</span>
          </div>
          <button 
            type="button" 
            className="btn btn-secondary btn-sm px-4 fw-semibold" 
            onClick={closePowerBiExport}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
