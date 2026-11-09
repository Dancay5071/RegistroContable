import React, { useState, useRef, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { usePrivacy } from "../context/PrivacyContext";
import { useSecurity } from "../context/SecurityContext";
import { useDolar } from "../hooks/useDolar";
import FinTrackLogo from "./FinTrackLogo";

export default function Navbar() {
  const { user, isDemo, logout } = useAuth();
  const { openCustomizeModal } = useTheme();
  const { isPrivate, togglePrivacy } = usePrivacy();
  const { lockScreen } = useSecurity();
  const { blue, oficial, mep, refresh: refreshDolar } = useDolar();
  const [isOpen, setIsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      alert("Hubo un problema al cerrar sesión.");
    }
  };

  const closeMenu = () => {
    setIsOpen(false);
    setUserMenuOpen(false);
  };

  const nombreUsuario = user?.displayName || (isDemo ? "Daniela" : (user?.email?.split("@")[0] || "Usuario"));
  const inicial = nombreUsuario.charAt(0).toUpperCase();

  return (
    <nav className="navbar navbar-expand-lg" id="navbar">
      <div className="container-fluid">
        <div className="d-flex align-items-center gap-2">
          <Link className="navbar-brand d-flex align-items-center me-1" to="/" onClick={closeMenu}>
            <FinTrackLogo size={32} showText={true} />
          </Link>

          {blue?.venta > 0 && (
            <div 
              className="navbar-dolar-pill d-flex align-items-center gap-2"
              title={`Cotizaciones en tiempo real:\n• Dólar Blue: Compra $${blue.compra.toLocaleString('es-AR')} | Venta $${blue.venta.toLocaleString('es-AR')}\n• Dólar Oficial: Compra $${oficial.compra.toLocaleString('es-AR')} | Venta $${oficial.venta.toLocaleString('es-AR')}\n• MEP: $${mep.venta.toLocaleString('es-AR')}\n\nHaz clic para actualizar`}
              onClick={() => refreshDolar()}
            >
              <span className="dot dot-dolar-pulse"></span>
              <span className="small fw-semibold text-muted">USD</span>
              <strong className="text-dolar-value">${blue.venta.toLocaleString("es-AR")}</strong>
            </div>
          )}
        </div>

        <button 
          className="navbar-toggler border-0 ms-auto" 
          type="button" 
          onClick={() => setIsOpen(!isOpen)}
          aria-controls="navbarSupportedContent" 
          aria-expanded={isOpen} 
          aria-label="Toggle navigation"
        >
          <i className="bi bi-list fs-2"></i>
        </button>

        <div className={`collapse navbar-collapse ${isOpen ? "show" : ""}`} id="navbarSupportedContent">
          <ul className="navbar-nav ms-auto mb-2 mb-lg-0 align-items-lg-center gap-lg-1">
            <li className="nav-item">
              <NavLink className="nav-link" to="/gastos/consultar" onClick={closeMenu}>
                <i className="bi bi-arrow-down-circle text-danger me-1"></i> Gastos
              </NavLink>
            </li>

            <li className="nav-item">
              <NavLink className="nav-link" to="/ingresos/consultar" onClick={closeMenu}>
                <i className="bi bi-arrow-up-circle text-success me-1"></i> Ingresos
              </NavLink>
            </li>

            <li className="nav-item">
              <NavLink className="nav-link" to="/ahorros" onClick={closeMenu}>
                <i className="bi bi-piggy-bank me-1 text-warning"></i> Ahorros
              </NavLink>
            </li>

            <li className="nav-item">
              <NavLink className="nav-link" to="/resumen" onClick={closeMenu}>
                <i className="bi bi-bar-chart-line me-1 text-primary"></i> Resumen
              </NavLink>
            </li>
          </ul>

          <div className="d-none d-lg-flex align-items-center gap-2 ms-lg-3">
            <button
              className={`btn btn-privacy-toggle d-flex align-items-center justify-content-center rounded-circle shadow-sm ${isPrivate ? 'active' : ''}`}
              type="button"
              onClick={togglePrivacy}
              title={isPrivate ? "Mostrar saldos (Alt + P)" : "Ocultar saldos (Modo Privacidad - Alt + P)"}
              aria-label="Alternar privacidad de saldos"
            >
              <i className={`bi ${isPrivate ? "bi-eye-slash-fill text-warning" : "bi-eye"}`}></i>
            </button>

            <div className="position-relative" ref={userMenuRef}>
              <button
                className="btn btn-user-profile d-flex align-items-center gap-2 rounded-pill px-2 py-1 shadow-sm"
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                title="Opciones de cuenta y personalización"
              >
                <span className="user-avatar-badge">{inicial}</span>
                <span className="user-name-text fw-semibold small">{nombreUsuario}</span>
                <i className="bi bi-chevron-down text-muted" style={{ fontSize: "0.75rem" }}></i>
              </button>

              {userMenuOpen && (
                <ul 
                  className="dropdown-menu dropdown-menu-end shadow-lg rounded-4 p-2 border show" 
                  style={{ minWidth: "220px", position: "absolute", top: "115%", right: 0, zIndex: 1050 }}
                >
                  <li className="px-3 py-2 border-bottom mb-1">
                    <div className="fw-bold small dropdown-user-name">{nombreUsuario}</div>
                    <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                      {isDemo ? "Modo Demo Activo" : (user?.email || "Cuenta personal")}
                    </div>
                  </li>

                  <li>
                    <button 
                      className="dropdown-item d-flex align-items-center justify-content-between py-2 rounded-3"
                      onClick={() => { togglePrivacy(); setUserMenuOpen(false); }}
                    >
                      <div className="d-flex align-items-center gap-2">
                        <i className={`bi ${isPrivate ? "bi-eye-slash-fill text-warning" : "bi-eye text-primary"}`}></i>
                        <span>Modo Privacidad</span>
                      </div>
                      <span className={`badge rounded-pill ${isPrivate ? 'bg-warning text-dark' : 'bg-secondary bg-opacity-25 text-secondary'}`} style={{ fontSize: "0.68rem" }}>
                        {isPrivate ? "Activo" : "Off"}
                      </span>
                    </button>
                  </li>

                  <li>
                    <button 
                      className="dropdown-item d-flex align-items-center gap-2 py-2 rounded-3"
                      onClick={() => { setUserMenuOpen(false); openCustomizeModal(); }}
                    >
                      <i className="bi bi-palette2 text-primary"></i>
                      <span>Personalizar Tema</span>
                    </button>
                  </li>

                  <li>
                    <button 
                      className="dropdown-item d-flex align-items-center gap-2 py-2 rounded-3 text-secondary"
                      onClick={() => { setUserMenuOpen(false); lockScreen(); }}
                      title="Bloquear pantalla temporalmente"
                    >
                      <i className="bi bi-shield-lock text-warning"></i>
                      <span>Bloquear Pantalla</span>
                    </button>
                  </li>

                  <li><hr className="dropdown-divider my-1 opacity-50" /></li>

                  <li>
                    <button 
                      className="dropdown-item d-flex align-items-center gap-2 py-2 rounded-3 text-danger"
                      onClick={() => { setUserMenuOpen(false); handleLogout(); }}
                    >
                      <i className="bi bi-box-arrow-right"></i>
                      <span>{isDemo ? "Salir del Demo" : "Cerrar sesión"}</span>
                    </button>
                  </li>
                </ul>
              )}
            </div>
          </div>

          <div className="d-lg-none mt-3 pt-3 border-top">
            <div className="d-flex align-items-center gap-2 mb-3 px-2">
              <span className="user-avatar-badge">{inicial}</span>
              <div>
                <div className="fw-bold small dropdown-user-name">{nombreUsuario}</div>
                <div className="text-muted small" style={{ fontSize: "0.75rem" }}>
                  {isDemo ? "Modo Demo" : user?.email}
                </div>
              </div>
            </div>

            <div className="d-flex flex-column gap-2">
              <button
                className={`btn ${isPrivate ? 'btn-warning text-dark' : 'btn-outline-secondary'} btn-sm w-100 d-flex align-items-center justify-content-center gap-2 rounded-pill py-2`}
                onClick={() => { togglePrivacy(); closeMenu(); }}
              >
                <i className={`bi ${isPrivate ? "bi-eye-slash-fill" : "bi-eye"}`}></i>
                <span>{isPrivate ? "Saldos Ocultos (Toca para ver)" : "Modo Privacidad (Ocultar saldos)"}</span>
              </button>

              <button
                className="btn btn-outline-secondary btn-sm w-100 d-flex align-items-center justify-content-center gap-2 rounded-pill py-2"
                onClick={() => { closeMenu(); openCustomizeModal(); }}
              >
                <i className="bi bi-palette2"></i>
                <span>Personalizar Tema</span>
              </button>

              <button
                className="btn btn-outline-warning text-dark btn-sm w-100 d-flex align-items-center justify-content-center gap-2 rounded-pill py-2"
                onClick={() => { closeMenu(); lockScreen(); }}
              >
                <i className="bi bi-shield-lock"></i>
                <span>Bloquear Pantalla</span>
              </button>

              <button 
                className="btn btn-outline-danger btn-sm w-100 d-flex align-items-center justify-content-center gap-2 rounded-pill py-2" 
                onClick={handleLogout}
              >
                <i className="bi bi-box-arrow-right"></i>
                <span>{isDemo ? "Salir del Demo" : "Cerrar sesión"}</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </nav>
  );
}
