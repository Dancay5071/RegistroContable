import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useBalance } from "../context/BalanceContext";
import { usePrivacy } from "../context/PrivacyContext";
import { useQuickMovement } from "../context/QuickMovementContext";
import { getFechaHoy, formatoMoneda, MESES } from "../utils/formatters";
import { resetDemoData, getDemoUltimasTransacciones, getDemoGastos, getDemoResumenAnual } from "../services/demoData";
import { getUltimasTransaccionesUser, getGastosUser, getResumenAnualUser } from "../services/dbService";
import { getCategoriaGasto, getCategoriaIngreso } from "../utils/categories";
import { useToast } from "../context/ToastContext";
import ExpenseCategoryChart from "../components/charts/ExpenseCategoryChart";
import MonthlyComparisonChart from "../components/charts/MonthlyComparisonChart";
import FinTrackLogo from "../components/FinTrackLogo";

export default function Home() {
  const { user, isDemo, openLoginModal, loginAsDemo } = useAuth();
  const { montoActual, totalAhorros } = useBalance();
  const { isPrivate, togglePrivacy, maskAmount } = usePrivacy();
  const { openQuickModal, movementCounter } = useQuickMovement();
  const { showToast } = useToast();
  const [fecha, setFecha] = useState(getFechaHoy(window.innerWidth < 768));
  const [ultimasTransacciones, setUltimasTransacciones] = useState([]);
  const [gastosMes, setGastosMes] = useState([]);
  const [resumenAnual, setResumenAnual] = useState(null);
  const [loadingRecientes, setLoadingRecientes] = useState(false);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  const mesActual = MESES[new Date().getMonth()];
  const anioActual = new Date().getFullYear();

  useEffect(() => {
    const handleResize = () => {
      setFecha(getFechaHoy(window.innerWidth < 768));
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!user) return;

    const cargarDashboard = async () => {
      setLoadingRecientes(true);
      setLoadingAnalytics(true);
      try {
        if (isDemo) {
          const recientes = getDemoUltimasTransacciones(5);
          const gastos = getDemoGastos(mesActual, anioActual);
          const anual = getDemoResumenAnual(anioActual);
          setUltimasTransacciones(recientes);
          setGastosMes(gastos);
          setResumenAnual(anual);
        } else {
          const [recientes, gastos, anual] = await Promise.all([
            getUltimasTransaccionesUser(user.uid, 5),
            getGastosUser(user.uid, mesActual, anioActual),
            getResumenAnualUser(user.uid, anioActual)
          ]);
          setUltimasTransacciones(recientes);
          setGastosMes(gastos);
          setResumenAnual(anual);
        }
      } catch (err) {
        console.error("Error al cargar datos del dashboard:", err);
      } finally {
        setLoadingRecientes(false);
        setLoadingAnalytics(false);
      }
    };

    cargarDashboard();
  }, [user, isDemo, movementCounter, mesActual, anioActual]);

  const handleResetDemo = () => {
    if (window.confirm("¿Deseas reiniciar los datos del Modo Demo a los valores por defecto?")) {
      resetDemoData();
      showToast("Datos del modo demo restablecidos.", "info");
      if (isDemo) {
        setUltimasTransacciones(getDemoUltimasTransacciones(5));
        setGastosMes(getDemoGastos(mesActual, anioActual));
        setResumenAnual(getDemoResumenAnual(anioActual));
      }
    }
  };

  return (
    <div className="home-page fade-in d-flex flex-column align-items-center justify-content-center flex-grow-1 p-3">
      {!user ? (
        <div className="principal text-center p-4 p-md-5 rounded-4 shadow-sm border" style={{ maxWidth: "560px", width: "100%" }}>
          <div className="d-flex justify-content-center mb-3">
            <FinTrackLogo size={56} showText={true} textClass="h2" />
          </div>
          <h2 className="h4 fw-bold mb-3">Control Financiero Simple y Eficiente</h2>
          <p className="text-muted mb-4 small">
            Gestiona tus ingresos, gastos diarios y metas de ahorro con balances en tiempo real y estadísticas mensuales organizadas.
          </p>

          <div className="d-flex flex-column flex-sm-row justify-content-center gap-3">
            <button 
              className="btn btn-success btn-lg px-4 shadow-sm d-flex align-items-center justify-content-center gap-2 fw-semibold" 
              type="button" 
              onClick={openLoginModal}
            >
              <i className="bi bi-box-arrow-in-right fs-5"></i>
              Iniciar sesión
            </button>
            <button 
              className="btn btn-warning btn-lg px-4 fw-semibold text-white shadow-sm d-flex align-items-center justify-content-center gap-2" 
              type="button" 
              onClick={loginAsDemo}
            >
              <i className="bi bi-eye fs-5"></i>
              Probar Modo Demo
            </button>
          </div>
        </div>
      ) : (
        <div className="w-100" style={{ maxWidth: "1020px" }}>
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
            <div>
              <h1 className="h4 fw-bold text-dark mb-1">
                {user?.displayName ? `Hola, ${user.displayName.split(" ")[0]}` : "Panel Financiero"}
              </h1>
              <p className="text-muted small mb-0">Resumen de tus saldos y actividad mensual</p>
            </div>
            <div className="badge shadow-sm border px-3 py-2 text-dark fw-medium rounded-pill" style={{ backgroundColor: "var(--bg-card)" }}>
              {fecha}
            </div>
          </div>

          {isDemo && (
            <div className="alert bg-warning bg-opacity-10 border border-warning text-dark d-flex align-items-center justify-content-between p-3 rounded-3 mb-4 shadow-sm">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-info-circle-fill text-warning fs-5"></i>
                <span className="small">Estás explorando en <strong>Modo Demo</strong> (los cambios se guardan localmente).</span>
              </div>
              <button 
                type="button" 
                className="btn btn-sm btn-outline-dark"
                onClick={handleResetDemo}
              >
                <i className="bi bi-arrow-counterclockwise me-1"></i> Reiniciar
              </button>
            </div>
          )}

          <div className="row g-3 mb-4">
            <div className="col-12 col-md-6">
              <div className="hero-balance-card hero-saldo p-4 rounded-4 shadow-sm">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="kpi-title text-success mb-0">Saldo Disponible</div>
                  <button 
                    type="button" 
                    className="btn btn-sm btn-link text-muted p-0 text-decoration-none"
                    onClick={togglePrivacy}
                    title={isPrivate ? "Mostrar saldos" : "Ocultar saldos"}
                  >
                    <i className={`bi ${isPrivate ? "bi-eye-slash-fill text-warning" : "bi-eye"}`}></i>
                  </button>
                </div>
                <div className={`kpi-amount mb-2 ${isPrivate ? "privacy-masked" : ""}`}>
                  {maskAmount(formatoMoneda(montoActual))}
                </div>
                <div className="d-flex align-items-center gap-2">
                  <span className="dot dot-green"></span>
                  <span className="text-muted small">Actualizado en tiempo real</span>
                </div>
              </div>
            </div>

            <div className="col-12 col-md-6">
              <div className="hero-balance-card hero-ahorro p-4 rounded-4 shadow-sm">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="kpi-title text-warning mb-0">Total Ahorrado</div>
                  <button 
                    type="button" 
                    className="btn btn-sm btn-link text-muted p-0 text-decoration-none"
                    onClick={togglePrivacy}
                    title={isPrivate ? "Mostrar saldos" : "Ocultar saldos"}
                  >
                    <i className={`bi ${isPrivate ? "bi-eye-slash-fill text-warning" : "bi-eye"}`}></i>
                  </button>
                </div>
                <div className={`kpi-amount mb-2 ${isPrivate ? "privacy-masked" : ""}`}>
                  {maskAmount(formatoMoneda(totalAhorros))}
                </div>
                <div className="d-flex align-items-center gap-2">
                  <span className="dot dot-amber"></span>
                  <span className="text-muted small">Fondo acumulado en ARS</span>
                </div>
              </div>
            </div>
          </div>

          <div className="row g-3 mb-4">
            <div className="col-12 col-lg-5">
              <div className="principal p-3 p-md-4 rounded-4 shadow-sm border h-100 d-flex flex-column">
                <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
                  <h5 className="h6 text-muted text-uppercase fw-bold mb-0 tracking-wider d-flex align-items-center gap-2">
                    <i className="bi bi-pie-chart text-danger"></i> Gastos de {mesActual}
                  </h5>
                  <Link to="/gastos/consultar" className="small text-decoration-none fw-semibold text-primary">
                    Detalle <i className="bi bi-arrow-right"></i>
                  </Link>
                </div>

                <div className={`flex-grow-1 d-flex align-items-center justify-content-center ${isPrivate ? "privacy-blur" : ""}`} style={{ minHeight: "260px" }}>
                  {loadingAnalytics ? (
                    <div className="text-center text-muted small py-4">
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Cargando gráfico...
                    </div>
                  ) : (
                    <ExpenseCategoryChart gastos={gastosMes} mes={mesActual} anio={anioActual} />
                  )}
                </div>
              </div>
            </div>

            <div className="col-12 col-lg-7">
              <div className="principal p-3 p-md-4 rounded-4 shadow-sm border h-100 d-flex flex-column">
                <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
                  <h5 className="h6 text-muted text-uppercase fw-bold mb-0 tracking-wider d-flex align-items-center gap-2">
                    <i className="bi bi-bar-chart-line text-success"></i> Evolución Mensual — {anioActual}
                  </h5>
                  <Link to="/resumen" className="small text-decoration-none fw-semibold text-primary">
                    Matriz Anual <i className="bi bi-arrow-right"></i>
                  </Link>
                </div>

                <div className={`flex-grow-1 ${isPrivate ? "privacy-blur" : ""}`} style={{ minHeight: "260px" }}>
                  {loadingAnalytics ? (
                    <div className="text-center text-muted small py-4">
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Cargando comparativa...
                    </div>
                  ) : (
                    <MonthlyComparisonChart 
                      ingresosMensuales={resumenAnual?.ingresosMensuales || []}
                      gastosMensuales={resumenAnual?.gastosMensuales || []}
                      ahorrosMensuales={resumenAnual?.ahorrosMensuales || []}
                      anio={anioActual}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="principal p-3 p-md-4 rounded-4 shadow-sm border mb-4">
            <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
              <h5 className="h6 text-muted text-uppercase fw-bold mb-0 tracking-wider d-flex align-items-center gap-2">
                <i className="bi bi-clock-history text-primary"></i> Últimos Movimientos
              </h5>
              <button 
                type="button" 
                className="btn btn-sm btn-outline-success rounded-pill px-3 fw-semibold shadow-sm"
                onClick={() => openQuickModal("gasto")}
              >
                <i className="bi bi-plus-lg me-1"></i>  Movimiento
              </button>
            </div>

            {loadingRecientes ? (
              <div className="text-center py-4 text-muted small">
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                Cargando movimientos...
              </div>
            ) : ultimasTransacciones.length === 0 ? (
              <div className="d-flex flex-column align-items-center justify-content-center py-4 text-center">
                <i className="bi bi-inbox fs-1 mb-2 opacity-75" style={{ color: "var(--text-muted)" }}></i>
                <p className="small mb-3" style={{ color: "var(--text-muted)" }}>
                  Aún no hay movimientos registrados este mes.
                </p>
                <button 
                  type="button" 
                  className="btn btn-sm btn-success rounded-pill px-3 shadow-sm"
                  onClick={() => openQuickModal("gasto")}
                >
                  Registrar primer movimiento
                </button>
              </div>
            ) : (
              <div className="list-group list-group-flush">
                {ultimasTransacciones.map((tx, idx) => {
                  const esIngreso = tx.tipo === "ingreso";
                  const cat = esIngreso ? getCategoriaIngreso(tx.categoria) : getCategoriaGasto(tx.categoria);
                  return (
                    <div 
                      key={tx.id || idx}
                      className="list-group-item d-flex align-items-center justify-content-between px-0 py-2 border-bottom"
                      style={{ backgroundColor: "transparent" }}
                    >
                      <div className="d-flex align-items-center gap-3">
                        <div 
                          className="rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                          style={{ width: "38px", height: "38px", backgroundColor: cat.bg, color: cat.color }}
                        >
                          <i className={`bi ${cat.icon} fs-6`}></i>
                        </div>
                        <div>
                          <div className="fw-semibold text-dark small">{tx.descripcion}</div>
                          <div className="d-flex align-items-center gap-2">
                            <span 
                              className="badge px-2 py-0 rounded-pill"
                              style={{ backgroundColor: cat.bg, color: cat.color, border: `1px solid ${cat.border}`, fontSize: "0.7rem" }}
                            >
                              {cat.nombre}
                            </span>
                            <span className="text-muted small" style={{ fontSize: "0.75rem" }}>
                              {tx.mes} {tx.anio}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className={`fw-bold ${esIngreso ? "text-success" : "text-danger"} ${isPrivate ? "privacy-masked" : ""}`}>
                        {maskAmount(`${esIngreso ? "+" : "-"}${formatoMoneda(tx.monto)}`)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="d-flex flex-wrap justify-content-center gap-3 pt-3 mt-2 border-top">
              <Link to="/gastos/consultar" className="btn btn-sm btn-outline-secondary rounded-pill px-3">
                <i className="bi bi-receipt me-1"></i> Ver todos los Gastos
              </Link>
              <Link to="/ingresos/consultar" className="btn btn-sm btn-outline-secondary rounded-pill px-3">
                <i className="bi bi-cash-coin me-1"></i> Ver todos los Ingresos
              </Link>
              <Link to="/ahorros" className="btn btn-sm btn-outline-secondary rounded-pill px-3">
                <i className="bi bi-piggy-bank me-1"></i> Administrar Ahorros
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
