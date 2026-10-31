// src/components/Navbar.jsx
import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useBalance } from "../context/BalanceContext";
import { formatoMoneda } from "../utils/formatters";

export default function Navbar() {
  const { user, isDemo, logout } = useAuth();
  const { montoActual, totalAhorros } = useBalance();
  const [isOpen, setIsOpen] = useState(false);
  const [gastosOpen, setGastosOpen] = useState(false);
  const [ingresosOpen, setIngresosOpen] = useState(false);
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
    setGastosOpen(false);
    setIngresosOpen(false);
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

          <ul className="navbar-nav ms-auto mb-2 mb-lg-0 align-items-lg-center">
            {/* Dropdown Gastos */}
            <li 
              className={`nav-item dropdown ${gastosOpen ? "show" : ""}`}
              onMouseEnter={() => setGastosOpen(true)}
              onMouseLeave={() => setGastosOpen(false)}
            >
              <button 
                className="nav-link dropdown-toggle btn btn-link" 
                type="button"
                onClick={() => setGastosOpen(!gastosOpen)}
                aria-expanded={gastosOpen}
              >
                <i className="bi bi-arrow-down-circle text-danger me-1"></i> Gastos
              </button>
              <ul className={`dropdown-menu ${gastosOpen ? "show" : ""}`}>
                <li>
                  <NavLink className="dropdown-item" to="/gastos/nuevo" onClick={closeMenu}>
                    <i className="bi bi-plus-circle me-2 text-danger"></i> Nuevo Gasto
                  </NavLink>
                </li>
                <li><hr className="dropdown-divider border-secondary opacity-25" /></li>
                <li>
                  <NavLink className="dropdown-item" to="/gastos/consultar" onClick={closeMenu}>
                    <i className="bi bi-search me-2"></i> Consultar Gastos
                  </NavLink>
                </li>
              </ul>
            </li>

            {/* Dropdown Ingresos */}
            <li 
              className={`nav-item dropdown ${ingresosOpen ? "show" : ""}`}
              onMouseEnter={() => setIngresosOpen(true)}
              onMouseLeave={() => setIngresosOpen(false)}
            >
              <button 
                className="nav-link dropdown-toggle btn btn-link" 
                type="button"
                onClick={() => setIngresosOpen(!ingresosOpen)}
                aria-expanded={ingresosOpen}
              >
                <i className="bi bi-arrow-up-circle text-success me-1"></i> Ingresos
              </button>
              <ul className={`dropdown-menu ${ingresosOpen ? "show" : ""}`}>
                <li>
                  <NavLink className="dropdown-item" to="/ingresos/nuevo" onClick={closeMenu}>
                    <i className="bi bi-plus-circle me-2 text-success"></i> Nuevo Ingreso
                  </NavLink>
                </li>
                <li><hr className="dropdown-divider border-secondary opacity-25" /></li>
                <li>
                  <NavLink className="dropdown-item" to="/ingresos/consultar" onClick={closeMenu}>
                    <i className="bi bi-search me-2"></i> Consultar Ingresos
                  </NavLink>
                </li>
              </ul>
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
                <i className="bi bi-bar-chart-line me-1 text-warning"></i> Resumen
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
