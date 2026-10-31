// src/components/Navbar.jsx
import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useBalance } from "../context/BalanceContext";
import { useQuickMovement } from "../context/QuickMovementContext";
import { formatoMoneda } from "../utils/formatters";

export default function Navbar() {
  const { user, isDemo, logout } = useAuth();
  const { montoActual, totalAhorros } = useBalance();
  const { openQuickModal } = useQuickMovement();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

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
  };

  return (
    <nav className="navbar navbar-expand-lg" id="navbar">
      <div className="container-fluid">
        {/* Brand / Logo */}
        <Link className="navbar-brand d-flex align-items-center me-3" to="/" onClick={closeMenu}>
          <img src="/imagen/RC.png" alt="Logo" style={{ height: "32px" }} />
        </Link>

        {/* Indicador de Saldos en Navbar (Desktop y Tablet) */}
        <div className="navbar-balance-pill d-none d-md-flex align-items-center me-auto">
          <div className="balance-item" title="Monto disponible actual">
            <span className="dot dot-green"></span>
            <span className="text-muted small">Saldo:</span>
            <strong className="text-success">{formatoMoneda(montoActual)}</strong>
          </div>
          <span className="text-secondary opacity-50">|</span>
          <div className="balance-item" title="Total ahorrado">
            <span className="dot dot-amber"></span>
            <span className="text-muted small">Ahorro:</span>
            <strong className="text-warning">{formatoMoneda(totalAhorros)}</strong>
          </div>
        </div>

        {/* Botón Acción Rápida Desktop */}
        <button
          className="btn btn-sm btn-success rounded-pill px-3 fw-bold d-none d-md-flex align-items-center gap-1 shadow-sm ms-2"
          type="button"
          onClick={() => openQuickModal("gasto")}
          title="Nuevo movimiento rápido"
        >
          <i className="bi bi-plus-lg"></i>
          <span>Nuevo</span>
        </button>

        {/* Badge Modo Demo */}
        {isDemo && (
          <span className="badge bg-warning text-dark d-none d-lg-inline-flex align-items-center gap-1 mx-2">
            <i className="bi bi-eye"></i> Modo Demo
          </span>
        )}

        {/* Botón Hamburguesa Móvil */}
        <button 
          className="navbar-toggler border-0 text-dark" 
          type="button" 
          onClick={() => setIsOpen(!isOpen)}
          aria-controls="navbarSupportedContent" 
          aria-expanded={isOpen} 
          aria-label="Toggle navigation"
        >
          <i className="bi bi-list fs-2 text-dark"></i>
        </button>

        {/* Menú Colapsable */}
        <div className={`collapse navbar-collapse ${isOpen ? "show" : ""}`} id="navbarSupportedContent">
          {/* Indicador de Saldos en Móvil */}
          <div className="navbar-balance-pill d-flex d-md-none my-2 justify-content-around w-100">
            <div className="balance-item">
              <span className="dot dot-green"></span>
              <span className="text-muted small">Saldo:</span>
              <strong className="text-success">{formatoMoneda(montoActual)}</strong>
            </div>
            <div className="balance-item">
              <span className="dot dot-amber"></span>
              <span className="text-muted small">Ahorro:</span>
              <strong className="text-warning">{formatoMoneda(totalAhorros)}</strong>
            </div>
          </div>

          {/* Botón Acción Rápida Móvil */}
          <button
            className="btn btn-sm btn-success w-100 rounded-pill py-2 fw-bold d-flex d-md-none align-items-center justify-content-center gap-1 shadow-sm mb-2"
            type="button"
            onClick={() => { closeMenu(); openQuickModal("gasto"); }}
          >
            <i className="bi bi-plus-circle me-1"></i>
            + Nuevo Movimiento
          </button>

          <ul className="navbar-nav ms-auto mb-2 mb-lg-0 align-items-lg-center">
            {/* Enlace Directo Gastos */}
            <li className="nav-item">
              <NavLink className="nav-link" to="/gastos/consultar" onClick={closeMenu}>
                <i className="bi bi-arrow-down-circle text-danger me-1"></i> Gastos
              </NavLink>
            </li>

            {/* Enlace Directo Ingresos */}
            <li className="nav-item">
              <NavLink className="nav-link" to="/ingresos/consultar" onClick={closeMenu}>
                <i className="bi bi-arrow-up-circle text-success me-1"></i> Ingresos
              </NavLink>
            </li>

            {/* Ahorros */}
            <li className="nav-item">
              <NavLink className="nav-link" to="/ahorros" onClick={closeMenu}>
                <i className="bi bi-piggy-bank me-1 text-warning"></i> Ahorros
              </NavLink>
            </li>

            {/* Resumen */}
            <li className="nav-item">
              <NavLink className="nav-link" to="/resumen" onClick={closeMenu}>
                <i className="bi bi-bar-chart-line me-1 text-primary"></i> Resumen
              </NavLink>
            </li>
          </ul>

          <div className="d-flex align-items-center gap-2 ms-lg-3 mt-3 mt-lg-0">
            {isDemo && (
              <span className="badge bg-warning text-dark d-inline-flex d-lg-none align-items-center gap-1">
                <i className="bi bi-eye"></i> Demo
              </span>
            )}
            <button 
              className="btn btn-outline-danger btn-sm px-3" 
              type="button"
              onClick={handleLogout}
            >
              {isDemo ? "Salir del Demo" : "Cerrar sesión"}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
