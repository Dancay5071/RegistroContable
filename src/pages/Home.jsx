// src/pages/Home.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useBalance } from "../context/BalanceContext";
import { getFechaHoy, formatoMoneda } from "../utils/formatters";
import { resetDemoData } from "../services/demoData";

export default function Home() {
  const { user, isDemo, openLoginModal, loginAsDemo } = useAuth();
  const { montoActual, totalAhorros } = useBalance();
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
      alert("Datos del modo demo restablecidos.");
    }
  };

  return (
    <div className="home-page fade-in d-flex flex-column align-items-center justify-content-center flex-grow-1 p-3">
      <div className="logo-container mb-4 text-center">
        <img 
          src="/imagen/RC.png" 
          alt="Registro Contable Logo" 
          id="titulo" 
          className="img-fluid"
          style={{ maxHeight: "160px" }}
        />
      </div>

      <div className="principal text-center p-4 rounded shadow-lg text-white">
        <h2 id="diaDeHoy" className="mb-4">{fecha}</h2>

        <div className="container text-center mt-3 d-flex flex-column align-items-center">
          {!user ? (
            <div className="d-flex flex-column flex-sm-row gap-3">
              <button 
                className="btn btn-success btn-lg px-4" 
                id="login-btn" 
                type="button" 
                onClick={openLoginModal}
              >
                <i className="bi bi-box-arrow-in-right me-2"></i>
                Iniciar sesión
              </button>
              <button 
                className="btn btn-warning btn-lg px-4 fw-semibold text-dark" 
                type="button" 
                onClick={loginAsDemo}
              >
                <i className="bi bi-rocket-takeoff-fill me-2"></i>
                Probar Modo Demo
              </button>
            </div>
          ) : (
            <div className="d-flex flex-column align-items-center gap-3">
              {isDemo && (
                <div className="badge bg-warning text-dark px-3 py-2 fs-6 shadow-sm d-flex align-items-center gap-2">
                  <i className="bi bi-info-circle-fill"></i>
                  <span>Estás navegando en <strong>Modo Demo</strong> (sin credenciales)</span>
                </div>
              )}

              <div className="float-xl-start-index d-flex flex-wrap justify-content-center gap-3">
                <div className="text-bg-dark p-3 rounded shadow-sm" id="montoActual">
                  <strong>Monto actual:</strong> {formatoMoneda(montoActual)}
                </div>
                <div className="text-bg-dark p-3 rounded shadow-sm" id="totalAhorros">
                  <strong>Ahorros:</strong> {formatoMoneda(totalAhorros)}
                </div>
              </div>

              {isDemo && (
                <button 
                  type="button" 
                  className="btn btn-sm btn-outline-light mt-2"
                  onClick={handleResetDemo}
                >
                  <i className="bi bi-arrow-counterclockwise me-1"></i>
                  Restablecer datos demo
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
