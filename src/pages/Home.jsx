// src/pages/Home.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useBalance } from "../context/BalanceContext";
import { getFechaHoy, formatoMoneda } from "../utils/formatters";

export default function Home() {
  const { user, openLoginModal } = useAuth();
  const { montoActual, totalAhorros } = useBalance();
  const [fecha, setFecha] = useState(getFechaHoy(window.innerWidth < 768));

  useEffect(() => {
    const handleResize = () => {
      setFecha(getFechaHoy(window.innerWidth < 768));
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="home-page fade-in d-flex flex-column align-items-center justify-content-center flex-grow-1">
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
            <button 
              className="btn btn-success btn-lg px-4" 
              id="login-btn" 
              type="button" 
              onClick={openLoginModal}
            >
              Iniciar sesión
            </button>
          ) : (
            <div className="float-xl-start-index d-flex flex-wrap justify-content-center gap-3">
              <div className="text-bg-dark p-3 rounded shadow-sm" id="montoActual">
                <strong>Monto actual:</strong> {formatoMoneda(montoActual)}
              </div>
              <div className="text-bg-dark p-3 rounded shadow-sm" id="totalAhorros">
                <strong>Ahorros:</strong> {formatoMoneda(totalAhorros)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

