import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useSecurity } from "../context/SecurityContext";
import FinTrackLogo from "./FinTrackLogo";

export default function ScreenLockModal() {
  const { user, isDemo, logout } = useAuth();
  const { isLocked, unlockScreen, quickPin } = useSecurity();
  const [pinInput, setPinInput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  if (!isLocked || !user) return null;

  const nombreUsuario = user?.displayName || (isDemo ? "Daniela" : (user?.email?.split("@")[0] || "Usuario"));
  const inicial = nombreUsuario.charAt(0).toUpperCase();

  const handleUnlock = (e) => {
    if (e) e.preventDefault();
    setErrorMsg("");

    const success = unlockScreen(pinInput || (isDemo ? "demo" : "1234"));
    if (success) {
      setPinInput("");
      setErrorMsg("");
    } else {
      setErrorMsg("Código o PIN incorrecto. Inténtalo nuevamente.");
      setPinInput("");
    }
  };

  return (
    <div 
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
      style={{
        zIndex: 9999,
        backgroundColor: "rgba(15, 23, 42, 0.88)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)"
      }}
    >
      <div 
        className="principal text-center p-4 p-md-5 rounded-4 shadow-lg border w-100" 
        style={{ maxWidth: "400px" }}
      >
        <div className="d-flex justify-content-center mb-4">
          <FinTrackLogo size={42} showText={true} />
        </div>

        <div className="d-flex flex-column align-items-center mb-4">
          <div 
            className="user-avatar-badge mb-2 shadow"
            style={{ width: "54px", height: "54px", fontSize: "1.4rem" }}
          >
            {inicial}
          </div>
          <h4 className="fw-bold mb-0 fs-5">{nombreUsuario}</h4>
          <span className="text-muted small">Sesión protegida por inactividad</span>
        </div>

        <form onSubmit={handleUnlock}>
          <div className="mb-3">
            <label className="form-label small text-muted mb-1 fw-semibold">
              {quickPin ? "Ingresa tu PIN de 4 dígitos" : "Código de desbloqueo"}
            </label>
            <input 
              type="password"
              className="form-control text-center fs-4 fw-bold tracking-widest rounded-3 py-2"
              placeholder={quickPin ? "••••" : (isDemo ? "Modo Demo" : "Contraseña o PIN")}
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              autoFocus
              maxLength={quickPin ? 6 : 40}
            />
            {errorMsg && (
              <div className="text-danger small mt-2 fw-semibold">
                <i className="bi bi-exclamation-triangle-fill me-1"></i>
                {errorMsg}
              </div>
            )}
          </div>

          <div className="d-flex flex-column gap-2 mt-4">
            <button 
              type="submit" 
              className="btn btn-success rounded-pill py-2 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2"
            >
              <i className="bi bi-unlock-fill"></i>
              <span>Desbloquear Sesión</span>
            </button>

            <button 
              type="button" 
              className="btn btn-outline-danger btn-sm rounded-pill py-2 mt-1"
              onClick={logout}
            >
              <i className="bi bi-box-arrow-right me-1"></i>
              <span>Cerrar sesión</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

