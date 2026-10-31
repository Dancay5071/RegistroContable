// src/pages/Home.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useBalance } from "../context/BalanceContext";
import { getFechaHoy, formatoMoneda } from "../utils/formatters";
import { resetDemoData } from "../services/demoData";
import { useToast } from "../context/ToastContext";

export default function Home() {
  const { user, isDemo, openLoginModal, loginAsDemo } = useAuth();
  const { montoActual, totalAhorros } = useBalance();
  const { showToast } = useToast();
  const [fecha, setFecha] = useState(getFechaHoy(window.innerWidth < 768));

  useEffect(() => {
    const handleResize = () => {
      setFecha(getFechaHoy(window.innerWidth < 768));
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleResetDemo = () => {
    if (window.confirm("¿Deseas reiniciar los datos del Modo Demo a los valores por defecto?")) {
      resetDemoData();
      showToast("Datos del modo demo restablecidos.", "info");
    }
  };

  return (
    <div className="home-page fade-in d-flex flex-column align-items-center justify-content-center flex-grow-1 p-3">
      {/* Logo & Marca */}
      <div className="logo-container mb-4 text-center">
        <img 
          src="/imagen/RC.png" 
          alt="Registro Contable Logo" 
          id="titulo" 
          className="img-fluid"
          style={{ maxHeight: "120px", filter: "drop-shadow(0 6px 12px rgba(0,0,0,0.08))" }}
        />
        <h1 className="h4 fw-bold mt-3 text-dark tracking-wide">Registro Contable</h1>
        <div className="badge shadow-sm border px-3 py-2 text-dark fw-medium rounded-pill mt-1" style={{ backgroundColor: "var(--bg-card)" }}>
          <i className="bi bi-calendar3 me-2 text-success"></i>
          {fecha}
        </div>
      </div>

      {/* Contenido Principal */}
      {!user ? (
        <div className="principal text-center p-4 p-md-5 rounded-4 shadow-sm border" style={{ maxWidth: "560px", width: "100%" }}>
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
        <div className="w-100" style={{ maxWidth: "800px" }}>
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

          {/* Tarjetas KPI Hero Pastel */}
          <div className="row g-3 mb-4">
            <div className="col-12 col-md-6">
              <div className="hero-balance-card hero-saldo d-flex align-items-center justify-content-between p-4 rounded-4 shadow-sm">
                <div>
                  <div className="kpi-title text-success d-flex align-items-center gap-1">
                    <i className="bi bi-wallet2"></i> Saldo Disponible
                  </div>
                  <div className="kpi-amount">{formatoMoneda(montoActual)}</div>
                  <span className="text-muted small">Actualizado en tiempo real</span>
                </div>
                <div className="p-3 bg-success bg-opacity-15 rounded-circle text-success fs-2">
                  <i className="bi bi-cash-stack"></i>
                </div>
              </div>
            </div>

            <div className="col-12 col-md-6">
              <div className="hero-balance-card hero-ahorro d-flex align-items-center justify-content-between p-4 rounded-4 shadow-sm">
                <div>
                  <div className="kpi-title text-warning d-flex align-items-center gap-1">
                    <i className="bi bi-piggy-bank"></i> Total Ahorrado
                  </div>
                  <div className="kpi-amount">{formatoMoneda(totalAhorros)}</div>
                  <span className="text-muted small">Fondo acumulado</span>
                </div>
                <div className="p-3 bg-warning bg-opacity-15 rounded-circle text-warning fs-2">
                  <i className="bi bi-shield-lock"></i>
                </div>
              </div>
            </div>
          </div>

          {/* Acciones Rápidas */}
          <div className="principal p-4 rounded-4 shadow-sm border">
            <h5 className="h6 text-muted text-uppercase fw-bold mb-3 tracking-wider">Acciones Rápidas</h5>
            <div className="row g-2">
              <div className="col-6 col-sm-3">
                <Link to="/gastos/nuevo" className="btn btn-outline-danger w-100 py-3 d-flex flex-column align-items-center rounded-3">
                  <i className="bi bi-dash-circle fs-4 mb-1"></i>
                  <span className="small fw-semibold">Nuevo Gasto</span>
                </Link>
              </div>
              <div className="col-6 col-sm-3">
                <Link to="/ingresos/nuevo" className="btn btn-outline-success w-100 py-3 d-flex flex-column align-items-center rounded-3">
                  <i className="bi bi-plus-circle fs-4 mb-1"></i>
                  <span className="small fw-semibold">Nuevo Ingreso</span>
                </Link>
              </div>
              <div className="col-6 col-sm-3">
                <Link to="/ahorros" className="btn btn-outline-primary w-100 py-3 d-flex flex-column align-items-center rounded-3">
                  <i className="bi bi-safe fs-4 mb-1"></i>
                  <span className="small fw-semibold">Ahorros</span>
                </Link>
              </div>
              <div className="col-6 col-sm-3">
                <Link to="/resumen" className="btn btn-outline-warning text-dark w-100 py-3 d-flex flex-column align-items-center rounded-3">
                  <i className="bi bi-bar-chart fs-4 mb-1"></i>
                  <span className="small fw-semibold">Resumen</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
